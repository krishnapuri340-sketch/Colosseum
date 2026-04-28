import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  ListPlayersQueryParams,
  ListPlayersResponse,
  GetPlayerParams,
  GetPlayerResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/players", async (req, res): Promise<void> => {
  const query = ListPlayersQueryParams.safeParse(req.query);
  const rows = await db.select().from(playersTable);

  let filtered = rows;
  if (query.success) {
    if (query.data.team) {
      filtered = filtered.filter((p) => p.team === query.data.team || p.teamCode === query.data.team);
    }
    if (query.data.role) {
      filtered = filtered.filter((p) => p.role === query.data.role);
    }
  }

  res.json(ListPlayersResponse.parse(filtered));
});

router.get("/players/:playerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.playerId) ? req.params.playerId[0] : req.params.playerId;
  const params = GetPlayerParams.safeParse({ playerId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json(GetPlayerResponse.parse(player));
});

export default router;
