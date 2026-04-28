import { Router, type IRouter } from "express";
import { db, leaderboardTable, activityTable } from "@workspace/db";
import { asc } from "drizzle-orm";
import {
  GetLeaderboardQueryParams,
  GetLeaderboardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const query = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = (query.success && query.data.limit) ? query.data.limit : 20;

  const rows = await db
    .select()
    .from(leaderboardTable)
    .orderBy(asc(leaderboardTable.points))
    .limit(limit);

  // Sort descending by points and assign rank
  const sorted = [...rows].sort((a, b) => b.points - a.points);
  const result = sorted.map((entry, i) => ({
    rank: i + 1,
    userId: entry.userId,
    username: entry.username,
    avatar: entry.avatar ?? null,
    points: entry.points,
    winnings: entry.winnings,
    teamsJoined: entry.teamsJoined,
  }));

  res.json(GetLeaderboardResponse.parse(result));
});

export default router;
