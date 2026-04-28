import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contestsTable, matchesTable } from "@workspace/db";
import {
  ListContestsQueryParams,
  ListContestsResponse,
  CreateContestBody,
  GetContestParams,
  GetContestResponse,
  JoinContestParams,
  JoinContestBody,
  JoinContestResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/contests", async (req, res): Promise<void> => {
  const query = ListContestsQueryParams.safeParse(req.query);
  const rows = await db.select().from(contestsTable);
  const matches = await db.select().from(matchesTable);
  const matchMap: Record<number, (typeof matches)[0]> = {};
  for (const m of matches) matchMap[m.id] = m;

  let filtered = rows;
  if (query.success) {
    if (query.data.matchId) {
      filtered = filtered.filter((c) => c.matchId === query.data.matchId);
    }
    if (query.data.status) {
      filtered = filtered.filter((c) => c.status === query.data.status);
    }
  }

  const result = filtered.map((c) => ({
    ...c,
    prizePool: parseFloat(c.prizePool),
    entryFee: parseFloat(c.entryFee),
    firstPrize: parseFloat(c.firstPrize),
    matchName: matchMap[c.matchId]
      ? `${matchMap[c.matchId].team1} vs ${matchMap[c.matchId].team2}`
      : "Unknown Match",
  }));

  res.json(ListContestsResponse.parse(result));
});

router.post("/contests", async (req, res): Promise<void> => {
  const parsed = CreateContestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contest] = await db.insert(contestsTable).values({
    matchId: parsed.data.matchId,
    name: parsed.data.name,
    prizePool: String(parsed.data.prizePool),
    entryFee: String(parsed.data.entryFee),
    totalSpots: parsed.data.totalSpots,
    type: parsed.data.type,
    firstPrize: String(parsed.data.prizePool * 0.5),
    filledSpots: 0,
    status: "upcoming",
  }).returning();

  const matches = await db.select().from(matchesTable).where(eq(matchesTable.id, contest.matchId));
  const match = matches[0];

  res.status(201).json(GetContestResponse.parse({
    ...contest,
    prizePool: parseFloat(contest.prizePool),
    entryFee: parseFloat(contest.entryFee),
    firstPrize: parseFloat(contest.firstPrize),
    matchName: match ? `${match.team1} vs ${match.team2}` : "Unknown Match",
  }));
});

router.get("/contests/:contestId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.contestId) ? req.params.contestId[0] : req.params.contestId;
  const params = GetContestParams.safeParse({ contestId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [contest] = await db.select().from(contestsTable).where(eq(contestsTable.id, params.data.contestId));
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }

  const matches = await db.select().from(matchesTable).where(eq(matchesTable.id, contest.matchId));
  const match = matches[0];

  res.json(GetContestResponse.parse({
    ...contest,
    prizePool: parseFloat(contest.prizePool),
    entryFee: parseFloat(contest.entryFee),
    firstPrize: parseFloat(contest.firstPrize),
    matchName: match ? `${match.team1} vs ${match.team2}` : "Unknown Match",
  }));
});

router.post("/contests/:contestId/join", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.contestId) ? req.params.contestId[0] : req.params.contestId;
  const params = JoinContestParams.safeParse({ contestId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = JoinContestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [contest] = await db.select().from(contestsTable).where(eq(contestsTable.id, params.data.contestId));
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }

  const [updated] = await db
    .update(contestsTable)
    .set({ filledSpots: contest.filledSpots + 1 })
    .where(eq(contestsTable.id, contest.id))
    .returning();

  const matches = await db.select().from(matchesTable).where(eq(matchesTable.id, updated.matchId));
  const match = matches[0];

  res.json(JoinContestResponse.parse({
    ...updated,
    prizePool: parseFloat(updated.prizePool),
    entryFee: parseFloat(updated.entryFee),
    firstPrize: parseFloat(updated.firstPrize),
    matchName: match ? `${match.team1} vs ${match.team2}` : "Unknown Match",
  }));
});

export default router;
