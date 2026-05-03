import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const emailLower = (email as string).toLowerCase().trim();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower));
  // Always respond OK so we don't reveal whether an email exists
  if (!user) {
    res.json({ ok: true });
    return;
  }
  // Generate a secure random token, store its hash
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.insert(passwordResetTokensTable).values({ userId: user.id, tokenHash, expiresAt });

  const appDomain = process.env.APP_URL
    ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://IPLColosseum.replit.app");
  const resetUrl = `${appDomain}/reset-password?token=${rawToken}`;

  await resend.emails.send({
    from: "Colosseum <onboarding@resend.dev>",
    to: user.email,
    subject: "Reset your Colosseum password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#090c18;color:#fff;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <h1 style="margin:0;font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.03em;">Colosseum</h1>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.45);">IPL 2026 Fantasy Auction</p>
        </div>
        <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#fff;">Reset your password</h2>
        <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">
          Hi ${user.name}, we received a request to reset your password. Click the button below — this link expires in <strong style="color:#fff;">1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display:block;text-align:center;padding:14px 24px;background:#c0192c;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.01em;">
          Reset Password
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  res.json({ ok: true });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) {
    res.status(400).json({ error: "token and newPassword are required" });
    return;
  }
  if ((newPassword as string).length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const tokenHash = crypto.createHash("sha256").update(token as string).digest("hex");
  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.tokenHash, tokenHash),
        isNull(passwordResetTokensTable.usedAt),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      )
    );
  if (!record) {
    res.status(400).json({ error: "This reset link is invalid or has expired." });
    return;
  }
  const newHash = await bcrypt.hash(newPassword as string, 12);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, record.userId));
  await db.update(passwordResetTokensTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokensTable.id, record.id));
  res.json({ ok: true });
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
