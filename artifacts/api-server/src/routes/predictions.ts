import { Router, type IRouter } from "express";
import { eq, inArray, sql } from "drizzle-orm";
import { db, predictionsTable, usersTable } from "@workspace/db";
import { getUserFromRequest } from "./auth";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any): void {
  const userId = getUserFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  (req as any).userId = userId;
  next();
}

// ── S3 helpers (mirrors ipl.ts but scoped to this module) ─────────────────────
const S3_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";
const COMP_ID = 284;
interface CacheEntry { data: any; expiresAt: number; }
const cache = new Map<string, CacheEntry>();

async function fetchS3(path: string): Promise<any> {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.expiresAt > now) return hit.data;
  const url = `${S3_BASE}/${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`S3 fetch failed: ${res.status}`);
  const text = await res.text();
  const data = JSON.parse(text.replace(/^[A-Za-z_$][A-Za-z0-9_$]*\(/, "").replace(/\)\s*;?\s*$/, ""));
  cache.set(path, { data, expiresAt: now + 60_000 });
  return data;
}

// Build a consistent avatar color from a string (same palette as frontend)
const PALETTE = ["#c0392b","#3b82f6","#a855f7","#f59e0b","#34d399","#818cf8","#f472b6","#60a5fa","#fb923c"];
function avatarColor(name: string): string {
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[seed % PALETTE.length];
}
function initials(name: string): string {
  return name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

// ── GET /api/predictions/matches ──────────────────────────────────────────────
// Returns upcoming + live + last 10 settled matches with prediction data
router.get("/predictions/matches", requireAuth, async (req: any, res: any): Promise<void> => {
  try {
    const userId: number = (req as any).userId;

    // 1. Fetch fixture list from S3
    const raw = await fetchS3(`${COMP_ID}-matchschedule.js`);
    const fixtures: any[] = raw?.Matchsummary ?? [];

    // 2. Map all matches
    const allMatches: any[] = fixtures.map(m => {
      const rawStatus = String(m.MatchStatus ?? "").toLowerCase();
      const isCompleted = rawStatus === "post" || rawStatus === "result";
      const isLive = rawStatus === "live";
      const isUpcoming = !isCompleted && !isLive;

      const homeId = String(m.HomeTeamID ?? "");
      const firstId = String(m.FirstBattingTeamID ?? "");
      const homeBatsFirst = homeId !== "" && homeId === firstId;

      const team1 = homeBatsFirst
        ? (m.FirstBattingTeamCode ?? "")
        : (m.SecondBattingTeamCode ?? m.FirstBattingTeamCode ?? "");
      const team2 = homeBatsFirst
        ? (m.SecondBattingTeamCode ?? "")
        : (m.FirstBattingTeamCode ?? m.SecondBattingTeamCode ?? "");

      const winId = String(m.WinningTeamID ?? "");
      const winCode = winId
        ? (winId === firstId ? m.FirstBattingTeamCode : m.SecondBattingTeamCode) ?? null
        : null;

      const momName: string = m.MOM ?? m.ManOfTheMatch ?? "";

      return {
        matchId: String(m.MatchID ?? ""),
        matchNumber: parseInt(String(m.MatchOrder ?? m.RowNo ?? "").replace(/[^0-9]/g, "")) || 0,
        team1: String(team1),
        team2: String(team2),
        venue: String(m.GroundName ?? m.MatchVenue ?? ""),
        date: String(m.MatchDate ?? m.MatchDateNew ?? ""),
        time: String(m.MatchTime ?? "19:30"),
        isCompleted,
        isLive,
        isUpcoming,
        winnerCode: winCode,
        momName: momName.trim(),
        rawSixes: 0, // not available from schedule feed
      };
    }).filter(m => m.matchId && m.team1 && m.team2);

    // 3. Bucket into upcoming, live, settled; take relevant slice
    const live      = allMatches.filter(m => m.isLive);
    const upcoming  = allMatches.filter(m => m.isUpcoming).sort((a, b) => a.matchNumber - b.matchNumber);
    const settled   = allMatches.filter(m => m.isCompleted).sort((a, b) => b.matchNumber - a.matchNumber).slice(0, 12);
    const relevant  = [...live, ...upcoming.slice(0, 6), ...settled];
    const matchIds  = relevant.map(m => m.matchId).filter(Boolean);

    if (matchIds.length === 0) {
      res.json({ matches: [], myStats: { total: 0, correct: 0, streak: 0, pts: 0, accuracy: 0 } });
      return;
    }

    // 4. Fetch all predictions for relevant matches (all users)
    const allPreds = await db
      .select({
        id:      predictionsTable.id,
        userId:  predictionsTable.userId,
        matchId: predictionsTable.matchId,
        winner:  predictionsTable.winner,
        mom:     predictionsTable.mom,
        sixes:   predictionsTable.sixes,
        points:  predictionsTable.points,
        settled: predictionsTable.settled,
        name:    usersTable.name,
      })
      .from(predictionsTable)
      .innerJoin(usersTable, eq(predictionsTable.userId, usersTable.id))
      .where(inArray(predictionsTable.matchId, matchIds));

    // 5. Group by matchId
    const byMatch: Record<string, typeof allPreds> = {};
    for (const p of allPreds) {
      if (!byMatch[p.matchId]) byMatch[p.matchId] = [];
      byMatch[p.matchId].push(p);
    }

    // 6. Build response matches
    const matches = relevant.map(m => {
      const preds = byMatch[m.matchId] ?? [];
      const myPick = preds.find(p => p.userId === userId) ?? null;
      const others = preds
        .filter(p => p.userId !== userId)
        .map(p => ({
          userId: p.userId,
          name:     p.name,
          initials: initials(p.name),
          color:    avatarColor(p.name),
          winner:   p.winner ?? undefined,
          mom:      p.mom    ?? undefined,
          sixes:    p.sixes  ?? undefined,
        }));

      const total   = preds.length;
      const t1count = preds.filter(p => p.winner === m.team1).length;
      const communityT1 = total > 0 ? Math.round((t1count / total) * 100) : 50;

      const predStatus: "open" | "live" | "settled" =
        m.isCompleted ? "settled" : m.isLive ? "live" : "open";

      return {
        matchId:       m.matchId,
        matchNumber:   m.matchNumber,
        team1:         m.team1,
        team2:         m.team2,
        venue:         m.venue,
        date:          m.date,
        time:          m.time,
        status:        predStatus,
        result: m.isCompleted
          ? { winner: m.winnerCode ?? "", mom: m.momName, sixes: m.rawSixes }
          : null,
        community:     { t1: communityT1, t2: 100 - communityT1 },
        allPicks:      others,
        totalPickers:  total,
        myPick: myPick
          ? { winner: myPick.winner, mom: myPick.mom, sixes: myPick.sixes }
          : null,
        alreadySubmitted: !!myPick,
      };
    });

    // 7. My overall prediction stats (all-time, not just relevant matches)
    const myAllPreds = await db
      .select({
        points:  predictionsTable.points,
        settled: predictionsTable.settled,
      })
      .from(predictionsTable)
      .where(eq(predictionsTable.userId, userId));

    const settledPreds = myAllPreds.filter(p => p.settled);
    const totalMade    = myAllPreds.length;
    const totalCorrect = settledPreds.filter(p => p.points > 0).length;
    const totalPts     = myAllPreds.reduce((s, p) => s + (p.points ?? 0), 0);
    const accuracy     = settledPreds.length > 0
      ? Math.round((totalCorrect / settledPreds.length) * 100) : 0;

    // Current streak: consecutive correct from most recent settled (ordered by id desc)
    const mySettledPreds = await db
      .select({ points: predictionsTable.points })
      .from(predictionsTable)
      .where(eq(predictionsTable.userId, userId))
      .orderBy(sql`${predictionsTable.id} desc`);

    let streak = 0;
    for (const p of mySettledPreds) {
      if (p.points > 0) streak++;
      else break;
    }

    res.json({
      matches,
      myStats: { total: totalMade, correct: totalCorrect, streak, pts: totalPts, accuracy },
    });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch predictions", detail: err?.message });
  }
});

// ── POST /api/predictions ──────────────────────────────────────────────────────
// Save or update a prediction for a match
router.post("/predictions", requireAuth, async (req: any, res: any): Promise<void> => {
  const userId: number = (req as any).userId;
  const { matchId, winner, mom, sixes } = req.body ?? {};

  if (!matchId || !winner || !mom) {
    res.status(400).json({ error: "matchId, winner and mom are required" });
    return;
  }

  try {
    const [pred] = await db
      .insert(predictionsTable)
      .values({
        userId,
        matchId: String(matchId),
        winner:  String(winner),
        mom:     String(mom),
        sixes:   sixes ? String(sixes) : null,
      })
      .onConflictDoUpdate({
        target: [predictionsTable.userId, predictionsTable.matchId],
        set: {
          winner:    String(winner),
          mom:       String(mom),
          sixes:     sixes ? String(sixes) : null,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(pred);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save prediction", detail: err?.message });
  }
});

// ── GET /api/predictions/leaderboard ─────────────────────────────────────────
router.get("/predictions/leaderboard", requireAuth, async (req: any, res: any): Promise<void> => {
  const userId: number = (req as any).userId;
  try {
    const rows = await db
      .select({
        userId:   predictionsTable.userId,
        name:     usersTable.name,
        pts:      sql<number>`COALESCE(SUM(${predictionsTable.points}), 0)`.as("pts"),
        correct:  sql<number>`COUNT(*) FILTER (WHERE ${predictionsTable.points} > 0 AND ${predictionsTable.settled})`.as("correct"),
        total:    sql<number>`COUNT(*)`.as("total"),
      })
      .from(predictionsTable)
      .innerJoin(usersTable, eq(predictionsTable.userId, usersTable.id))
      .groupBy(predictionsTable.userId, usersTable.name)
      .orderBy(sql`pts desc`);

    const leaderboard = rows.map((r, i) => ({
      rank:    i + 1,
      userId:  r.userId,
      name:    r.name,
      pts:     Number(r.pts),
      correct: Number(r.correct),
      total:   Number(r.total),
      isMe:    r.userId === userId,
      initials: initials(r.name),
      color:   avatarColor(r.name),
    }));

    res.json({ leaderboard });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch leaderboard", detail: err?.message });
  }
});

export default router;
