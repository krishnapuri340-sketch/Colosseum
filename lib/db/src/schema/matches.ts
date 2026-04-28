import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  team1: text("team1").notNull(),
  team2: text("team2").notNull(),
  team1Code: text("team1_code").notNull(),
  team2Code: text("team2_code").notNull(),
  venue: text("venue").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("upcoming"),
  team1Score: text("team1_score"),
  team2Score: text("team2_score"),
  matchType: text("match_type").notNull().default("T20"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

export const contestsTable = pgTable("contests", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  name: text("name").notNull(),
  prizePool: text("prize_pool").notNull(),
  entryFee: text("entry_fee").notNull(),
  totalSpots: integer("total_spots").notNull(),
  filledSpots: integer("filled_spots").notNull().default(0),
  status: text("status").notNull().default("upcoming"),
  type: text("type").notNull().default("mega"),
  firstPrize: text("first_prize").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContestSchema = createInsertSchema(contestsTable).omit({ id: true, createdAt: true });
export type InsertContest = z.infer<typeof insertContestSchema>;
export type Contest = typeof contestsTable.$inferSelect;
