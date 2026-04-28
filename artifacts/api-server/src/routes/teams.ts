import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, teamsTable } from "@workspace/db";
import {
  ListTeamsResponse,
  CreateTeamBody,
  GetTeamParams,
  GetTeamResponse,
  UpdateTeamParams,
  UpdateTeamBody,
  UpdateTeamResponse,
  DeleteTeamParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/teams", async (_req, res): Promise<void> => {
  const rows = await db.select().from(teamsTable);
  const result = rows.map((t) => ({
    ...t,
    players: t.players.map((p) => parseInt(p, 10)),
    createdAt: t.createdAt.toISOString(),
  }));
  res.json(ListTeamsResponse.parse(result));
});

router.post("/teams", async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db.insert(teamsTable).values({
    name: parsed.data.name,
    matchId: parsed.data.matchId,
    captain: parsed.data.captain,
    viceCaptain: parsed.data.viceCaptain,
    players: parsed.data.players.map(String),
    totalCredits: 100,
  }).returning();

  res.status(201).json(GetTeamResponse.parse({
    ...team,
    players: team.players.map((p) => parseInt(p, 10)),
    createdAt: team.createdAt.toISOString(),
  }));
});

router.get("/teams/:teamId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = GetTeamParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.teamId));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(GetTeamResponse.parse({
    ...team,
    players: team.players.map((p) => parseInt(p, 10)),
    createdAt: team.createdAt.toISOString(),
  }));
});

router.put("/teams/:teamId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = UpdateTeamParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db
    .update(teamsTable)
    .set({
      name: parsed.data.name,
      captain: parsed.data.captain,
      viceCaptain: parsed.data.viceCaptain,
      players: parsed.data.players.map(String),
    })
    .where(eq(teamsTable.id, params.data.teamId))
    .returning();

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(UpdateTeamResponse.parse({
    ...team,
    players: team.players.map((p) => parseInt(p, 10)),
    createdAt: team.createdAt.toISOString(),
  }));
});

router.delete("/teams/:teamId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = DeleteTeamParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.delete(teamsTable).where(eq(teamsTable.id, params.data.teamId)).returning();
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
