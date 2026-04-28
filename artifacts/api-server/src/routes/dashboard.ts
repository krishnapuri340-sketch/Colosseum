import { Router, type IRouter } from "express";
import { db, matchesTable, contestsTable, teamsTable, leaderboardTable, activityTable, playersTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardActivityResponse,
  GetTopPlayersResponse,
} from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [matches, contests, teams, leaderboard] = await Promise.all([
    db.select().from(matchesTable),
    db.select().from(contestsTable),
    db.select().from(teamsTable),
    db.select().from(leaderboardTable).orderBy(desc(leaderboardTable.points)).limit(1),
  ]);

  const liveMatches = matches.filter((m) => m.status === "live").length;
  const upcomingMatches = matches.filter((m) => m.status === "upcoming").length;
  const topUser = leaderboard[0];

  res.json(GetDashboardSummaryResponse.parse({
    totalContests: contests.length,
    liveMatches,
    upcomingMatches,
    totalWinnings: topUser ? topUser.winnings : 0,
    rank: 1,
    totalPoints: topUser ? topUser.points : 0,
    teamsCreated: teams.length,
    contestsJoined: contests.filter((c) => c.filledSpots > 0).length,
  }));
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(10);

  const result = rows.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    timestamp: a.timestamp.toISOString(),
    meta: a.meta ? JSON.parse(a.meta) : null,
  }));

  res.json(GetDashboardActivityResponse.parse(result));
});

router.get("/dashboard/top-players", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(playersTable)
    .orderBy(desc(playersTable.points))
    .limit(5);

  res.json(GetTopPlayersResponse.parse(rows));
});

export default router;
