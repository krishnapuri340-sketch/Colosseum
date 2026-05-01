import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { attachAuctionWS } from "./routes/auction-ws";

const TEST_EMAILS = [
  "test@example.com",
  "test_ipl_1777385983472@cricstrat.com",
  "test_ipl2_1777386145841@cricstrat.com",
  "demo_snap@cricstrat.com",
  "demo@colosseum.app",
];

async function purgeTestAccounts(): Promise<void> {
  try {
    const placeholders = TEST_EMAILS.map((_, i) => `$${i + 1}`).join(", ");
    const res = await pool.query<{ id: number }>(
      `SELECT id FROM users WHERE email IN (${placeholders})`,
      TEST_EMAILS,
    );
    const ids = res.rows.map((r) => r.id);
    if (ids.length === 0) return;
    const idPlaceholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await pool.query(
      `DELETE FROM predictions WHERE user_id IN (${idPlaceholders})`,
      ids,
    );
    await pool.query(
      `DELETE FROM users WHERE id IN (${idPlaceholders})`,
      ids,
    );
    logger.info({ count: ids.length }, "Purged test/demo accounts");
  } catch (err) {
    logger.warn({ err }, "Could not purge test accounts (non-fatal)");
  }
}

if (!process.env["SESSION_SECRET"]) {
  throw new Error(
    "SESSION_SECRET environment variable is required but was not provided.",
  );
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);
attachAuctionWS(server);

purgeTestAccounts().then(() => {
  server.listen(port, () => {
    logger.info({ port }, "Server listening");
  });

  server.on("error", (err) => {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  });
});
