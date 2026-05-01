import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getUserFromRequest } from "./auth";

const router: IRouter = Router();

router.get("/profile", async (req, res): Promise<void> => {
  const userId = getUserFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user.profileData ?? {});
});

router.patch("/profile", async (req, res): Promise<void> => {
  const userId = getUserFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const patch = req.body ?? {};
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const merged = { ...(user.profileData ?? {}), ...patch };
  await db.update(usersTable).set({ profileData: merged }).where(eq(usersTable.id, userId));
  res.json(merged);
});

export default router;
