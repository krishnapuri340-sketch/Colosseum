import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, auctionRoomsTable } from "@workspace/db";
import { getUserFromRequest } from "./auth";

const router: IRouter = Router();

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

export default router;
