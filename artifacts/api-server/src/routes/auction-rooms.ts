import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, auctionRoomsTable, auctionRoomTeamsTable } from "@workspace/db";
import { getUserFromRequest } from "./auth";

const router: IRouter = Router();

// Palette of team colours — assigned in join order
const TEAM_PALETTE = [
  "#c0392b", "#3b82f6", "#a855f7", "#f59e0b",
  "#22c55e", "#ec4899", "#06b6d4", "#f97316",
];

// ── Rooms ────────────────────────────────────────────────────────────

// POST /api/auction/rooms — create (or upsert) a room
router.post("/auction/rooms", async (req, res): Promise<void> => {
  const userId = getUserFromRequest(req);
  const { code, name, budget, maxPlayers, format, topScoring, topScoringCount, captainVC } = req.body ?? {};

  if (!code || !name) {
    res.status(400).json({ error: "code and name are required" });
    return;
  }

  try {
    const [room] = await db
      .insert(auctionRoomsTable)
      .values({
        code: String(code).toUpperCase(),
        name: String(name).trim(),
        hostUserId: userId ?? null,
        budget: Number(budget) || 100,
        maxPlayers: Number(maxPlayers) || 15,
        format: String(format ?? "classic"),
        topScoring: Boolean(topScoring),
        topScoringCount: Number(topScoringCount) || 11,
        captainVC: Boolean(captainVC),
      })
      .onConflictDoUpdate({
        target: auctionRoomsTable.code,
        set: {
          name: String(name).trim(),
          budget: Number(budget) || 100,
          maxPlayers: Number(maxPlayers) || 15,
          format: String(format ?? "classic"),
          topScoring: Boolean(topScoring),
          topScoringCount: Number(topScoringCount) || 11,
          captainVC: Boolean(captainVC),
        },
      })
      .returning();

    res.status(201).json({ room });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save room" });
  }
});

// GET /api/auction/rooms/:code — look up a room by invite code
router.get("/auction/rooms/:code", async (req, res): Promise<void> => {
  const code = (req.params.code ?? "").toUpperCase();
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }

  try {
    const [room] = await db
      .select()
      .from(auctionRoomsTable)
      .where(eq(auctionRoomsTable.code, code));

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json({ room });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to look up room" });
  }
});

// ── Teams inside a room ───────────────────────────────────────────────

// GET /api/auction/rooms/:code/teams — list all teams registered for a room
router.get("/auction/rooms/:code/teams", async (req, res): Promise<void> => {
  const code = (req.params.code ?? "").toUpperCase();
  try {
    const teams = await db
      .select()
      .from(auctionRoomTeamsTable)
      .where(eq(auctionRoomTeamsTable.roomCode, code));

    res.json({ teams });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list teams" });
  }
});

// POST /api/auction/rooms/:code/teams — register a team for a room
router.post("/auction/rooms/:code/teams", async (req, res): Promise<void> => {
  const code = (req.params.code ?? "").toUpperCase();
  const userId = getUserFromRequest(req);
  const { teamName, isHost } = req.body ?? {};

  if (!teamName) {
    res.status(400).json({ error: "teamName is required" });
    return;
  }

  try {
    // Fetch current team count to assign a colour
    const existing = await db
      .select()
      .from(auctionRoomTeamsTable)
      .where(eq(auctionRoomTeamsTable.roomCode, code));

    // If this user already registered for this room, update instead
    if (userId) {
      const mine = existing.find(t => t.userId === userId);
      if (mine) {
        const [updated] = await db
          .update(auctionRoomTeamsTable)
          .set({ teamName: String(teamName).trim() })
          .where(and(
            eq(auctionRoomTeamsTable.roomCode, code),
            eq(auctionRoomTeamsTable.userId, userId),
          ))
          .returning();
        res.json({ team: updated });
        return;
      }
    }

    const color = TEAM_PALETTE[existing.length % TEAM_PALETTE.length];
    const [team] = await db
      .insert(auctionRoomTeamsTable)
      .values({
        roomCode: code,
        userId:   userId ?? null,
        teamName: String(teamName).trim(),
        color,
        isHost:   Boolean(isHost),
      })
      .returning();

    res.status(201).json({ team });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to register team" });
  }
});

// DELETE /api/auction/rooms/:code/teams — clear all teams (host resets room)
router.delete("/auction/rooms/:code/teams", async (req, res): Promise<void> => {
  const code = (req.params.code ?? "").toUpperCase();
  try {
    await db
      .delete(auctionRoomTeamsTable)
      .where(eq(auctionRoomTeamsTable.roomCode, code));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to clear teams" });
  }
});

export default router;
