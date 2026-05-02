import { Router, type IRouter } from "express";
import { eq, inArray, or, sql, and } from "drizzle-orm";
import {
  db,
  leaguesTable,
  leagueMembersTable,
  auctionRoomsTable,
  auctionRoomTeamsTable,
  auctionRoomStateTable,
  playersTable,
  type LeagueSquadEntry,
} from "@workspace/db";
import { getUserFromRequest } from "./auth";

const router: IRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────

interface AuctionStateTeam {
  id:     string;
  name:   string;
  color:  string;
  budget: number;
  squad:  Array<{
    name:    string;
    team:    string;
    role:    string;
    credits: number;
    price:   number;
    tier:    string;
  }>;
}

interface AuctionStateSnapshot {
  teams?: AuctionStateTeam[];
}

/**
 * Deterministic season-points fallback: if playersTable.points is 0 (data not
 * yet loaded), derive a stable per-player number from credits and role so the
 * leaderboard still has meaningful values to display.
 */
function fallbackPoints(name: string, credits: number, role: string): number {
  const roleMul: Record<string, number> = { BAT: 50, BWL: 48, AR: 60, WK: 52 };
  const mul = roleMul[role] ?? 50;
  // Simple stable hash of the name so each player has a unique offset
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  const offset = Math.abs(hash) % 180;
  return Math.round(credits * mul + offset);
}

/**
 * Materialise a `leagues` + `league_members` record from a completed auction
 * room. Idempotent and race-safe: uses an `onConflictDoNothing` upsert on
 * `leagues.code` so concurrent calls (e.g. /complete and /from-auction firing
 * together) cannot both succeed. The losing call simply re-fetches the
 * already-persisted row.
 */
export async function materialiseLeagueFromAuction(
  code: string,
  hostUserId: number | null,
): Promise<{ league: typeof leaguesTable.$inferSelect; created: boolean } | null> {
  // 1. Look up the room
  const [room] = await db
    .select()
    .from(auctionRoomsTable)
    .where(eq(auctionRoomsTable.code, code));
  if (!room) return null;

  // 2. Fast path: league already materialised
  const [existing] = await db
    .select()
    .from(leaguesTable)
    .where(eq(leaguesTable.code, code));
  if (existing) return { league: existing, created: false };

  // 3. Read auction snapshot
  const [stateRow] = await db
    .select()
    .from(auctionRoomStateTable)
    .where(eq(auctionRoomStateTable.roomCode, code));
  if (!stateRow) return null;

  let snap: AuctionStateSnapshot;
  try {
    snap = JSON.parse(stateRow.stateJson) as AuctionStateSnapshot;
  } catch {
    return null;
  }
  const teams = snap.teams ?? [];
  if (teams.length === 0) return null;

  // 4. Map team-id → userId via auction_room_teams (best-effort).
  const numericIds = teams
    .map(t => Number(t.id))
    .filter(n => Number.isFinite(n) && n > 0);
  const dbTeams = numericIds.length
    ? await db
        .select()
        .from(auctionRoomTeamsTable)
        .where(inArray(auctionRoomTeamsTable.id, numericIds))
    : [];
  const userByTeamId = new Map<string, number | null>();
  const isHostByTeamId = new Map<string, boolean>();
  for (const dt of dbTeams) {
    userByTeamId.set(String(dt.id), dt.userId ?? null);
    isHostByTeamId.set(String(dt.id), dt.isHost);
  }

  // 5. Race-safe insert: onConflictDoNothing on the unique `code` column.
  // If two requests race past the existence check above, only one INSERT
  // wins and the other gets back nothing — we then re-select the winner.
  const inserted = await db
    .insert(leaguesTable)
    .values({
      code:        room.code,
      name:        room.name,
      format:      room.format,
      budget:      room.budget,
      squadSize:   room.maxPlayers,
      captainVC:   room.captainVC,
      hostUserId:  hostUserId ?? room.hostUserId ?? null,
    })
    .onConflictDoNothing({ target: leaguesTable.code })
    .returning();

  if (inserted.length === 0) {
    // Lost the race — another caller created the league concurrently.
    const [winner] = await db
      .select()
      .from(leaguesTable)
      .where(eq(leaguesTable.code, code));
    return winner ? { league: winner, created: false } : null;
  }

  const league = inserted[0];

  // 6. Insert members. Safe to do unconditionally because we know we just
  // created the league above (no members exist yet for this leagueId).
  const memberRows = teams.map(t => {
    const spent = parseFloat((room.budget - t.budget).toFixed(2));
    return {
      leagueId:    league.id,
      userId:      userByTeamId.get(t.id) ?? null,
      teamName:    t.name,
      color:       t.color,
      isHost:      isHostByTeamId.get(t.id) ?? false,
      squadJson:   t.squad as LeagueSquadEntry[],
      budgetSpent: spent,
    };
  });

  if (memberRows.length > 0) {
    await db.insert(leagueMembersTable).values(memberRows);
  }

  return { league, created: true };
}

/**
 * Compose a full league object with members + per-player fantasy points
 * (joined against playersTable.points, with a deterministic fallback for
 * unseeded players).
 */
async function composeLeague(
  league: typeof leaguesTable.$inferSelect,
  currentUserId: number | null,
) {
  const members = await db
    .select()
    .from(leagueMembersTable)
    .where(eq(leagueMembersTable.leagueId, league.id));

  // Bulk-fetch points for all distinct player names referenced. We use a Map
  // to distinguish "player exists in DB with 0 points" (legitimate, keep zero)
  // from "player not yet seeded in DB" (use deterministic fallback so the
  // leaderboard isn't filled with zeros while data is still being loaded).
  const allNames = Array.from(
    new Set(members.flatMap(m => m.squadJson.map(p => p.name))),
  );
  const playerPts = new Map<string, number>();
  if (allNames.length > 0) {
    const rows = await db
      .select({ name: playersTable.name, points: playersTable.points })
      .from(playersTable)
      .where(inArray(playersTable.name, allNames));
    for (const r of rows) playerPts.set(r.name, r.points);
  }

  const composedMembers = members.map(m => {
    const squad = m.squadJson.map(p => {
      const pts = playerPts.has(p.name)
        ? Math.round(playerPts.get(p.name) ?? 0)
        : fallbackPoints(p.name, p.credits, p.role);
      return {
        name:          p.name,
        team:          p.team,
        role:          p.role,
        purchasePrice: p.price,
        fantasyPts:    pts,
      };
    });
    const totalPts = squad.reduce((s, p) => s + p.fantasyPts, 0);
    return {
      id:          String(m.id),
      userId:      m.userId,
      teamName:    m.teamName,
      color:       m.color,
      isHost:      m.isHost,
      isMe:        currentUserId != null && m.userId === currentUserId,
      squad,
      totalPts,
      budgetSpent: m.budgetSpent,
    };
  });

  // Rank by totalPts desc
  composedMembers.sort((a, b) => b.totalPts - a.totalPts);
  const ranked = composedMembers.map((m, i) => ({ ...m, rank: i + 1 }));

  return {
    id:         String(league.id),
    code:       league.code,
    name:       league.name,
    format:     league.format,
    budget:     league.budget,
    squadSize:  league.squadSize,
    captainVC:  league.captainVC,
    createdAt:  league.createdAt,
    members:    ranked,
  };
}

// ── Routes ───────────────────────────────────────────────────────────

// POST /api/leagues/from-auction/:code — create a league from a completed auction
router.post("/leagues/from-auction/:code", async (req, res): Promise<void> => {
  const code = (req.params.code ?? "").toUpperCase();
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }
  try {
    const userId = getUserFromRequest(req);
    const result = await materialiseLeagueFromAuction(code, userId);
    if (!result) {
      res.status(404).json({ error: "Auction not found or has no saved state" });
      return;
    }
    const composed = await composeLeague(result.league, userId);
    res.status(result.created ? 201 : 200).json({ league: composed, created: result.created });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create league from auction" });
  }
});

// GET /api/leagues — list leagues the current user is in (member or host)
router.get("/leagues", async (req, res): Promise<void> => {
  try {
    const userId = getUserFromRequest(req);
    if (!userId) {
      res.json({ leagues: [] });
      return;
    }

    // Find league ids the user is a member of, plus leagues they host.
    const memberLeagueIds = await db
      .selectDistinct({ leagueId: leagueMembersTable.leagueId })
      .from(leagueMembersTable)
      .where(eq(leagueMembersTable.userId, userId));

    const ids = memberLeagueIds.map(r => r.leagueId);

    const myLeagues = await db
      .select()
      .from(leaguesTable)
      .where(
        ids.length > 0
          ? or(inArray(leaguesTable.id, ids), eq(leaguesTable.hostUserId, userId))
          : eq(leaguesTable.hostUserId, userId),
      )
      .orderBy(sql`${leaguesTable.createdAt} desc`);

    const composed = await Promise.all(myLeagues.map(l => composeLeague(l, userId)));
    res.json({ leagues: composed });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list leagues" });
  }
});

// GET /api/leagues/:id — single league with full member detail.
// Access is gated to authenticated users who are either the host or a member
// of the league. This prevents IDOR enumeration of other users' private leagues.
router.get("/leagues/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid league id" });
    return;
  }
  try {
    const userId = getUserFromRequest(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const [league] = await db.select().from(leaguesTable).where(eq(leaguesTable.id, id));
    if (!league) {
      res.status(404).json({ error: "League not found" });
      return;
    }

    // Authorisation: host OR member of this league
    if (league.hostUserId !== userId) {
      const [membership] = await db
        .select({ id: leagueMembersTable.id })
        .from(leagueMembersTable)
        .where(
          and(
            eq(leagueMembersTable.leagueId, league.id),
            eq(leagueMembersTable.userId, userId),
          ),
        )
        .limit(1);
      if (!membership) {
        res.status(404).json({ error: "League not found" });
        return;
      }
    }

    const composed = await composeLeague(league, userId);
    res.json({ league: composed });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to load league" });
  }
});

export default router;
