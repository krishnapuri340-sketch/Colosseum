import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

const JWT_SECRET = process.env.SESSION_SECRET!;
const COOKIE_NAME = "cricstrat_token";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

function signToken(userId: number) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function getUserFromRequest(req: any): number | null {
  // Check Authorization: Bearer header first (iOS localStorage fallback)
  const authHeader: string | undefined = req.headers?.["authorization"];
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearerToken || req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
    return payload.sub;
  } catch {
    return null;
  }
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password and name are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const emailLower = (email as string).toLowerCase().trim();
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, emailLower));
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: emailLower,
    passwordHash,
    name: (name as string).trim(),
  }).returning();
  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.status(201).json({ id: user.id, email: user.email, name: user.name, token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password, rememberMe } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const emailLower = (email as string).toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await bcrypt.compare(password as string, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const keep = rememberMe !== false;
  const token = signToken(user.id);
  const opts = keep ? COOKIE_OPTS : { ...COOKIE_OPTS, maxAge: undefined };
  res.cookie(COOKIE_NAME, token, opts);
  // Return token in body when remember=true so iOS can store it in localStorage
  res.json({ id: user.id, email: user.email, name: user.name, ...(keep ? { token } : {}) });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  const userId = getUserFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if ((newPassword as string).length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const valid = await bcrypt.compare(currentPassword as string, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const newHash = await bcrypt.hash(newPassword as string, 12);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(COOKIE_NAME, { path: "/", sameSite: "lax", secure: true });
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = getUserFromRequest(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
});

export default router;
