import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, matchesTable, contestsTable } from "@workspace/db";
import {
  ListMatchesQueryParams,
  ListMatchesResponse,
  GetMatchParams,
  GetMatchResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/matches", async (req, res): Promise<void> => {
  const query = ListMatchesQueryParams.safeParse(req.query);
  const rows = await db.select().from(matchesTable).orderBy(asc(matchesTable.scheduledAt));

  const filtered = query.success && query.data.status
    ? rows.filter((m) => m.status === query.data.status)
    : rows;

  // Get contest counts
  const allContests = await db.select().from(contestsTable);
  const contestCounts: Record<number, number> = {};
  for (const c of allContests) {
    contestCounts[c.matchId] = (contestCounts[c.matchId] || 0) + 1;
  }

  const result = filtered.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt.toISOString(),
    contestCount: contestCounts[m.id] || 0,
  }));

  res.json(ListMatchesResponse.parse(result));
});

router.get("/matches/:matchId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const params = GetMatchParams.safeParse({ matchId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const contests = await db.select().from(contestsTable).where(eq(contestsTable.matchId, match.id));

  res.json(GetMatchResponse.parse({
    ...match,
    scheduledAt: match.scheduledAt.toISOString(),
    contestCount: contests.length,
  }));
});

export default router;
