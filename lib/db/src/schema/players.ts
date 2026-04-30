import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  team: text("team").notNull(),
  teamCode: text("team_code").notNull(),
  role: text("role").notNull(),
  credits: real("credits").notNull().default(8.0),
  points: real("points").notNull().default(0),
  selectionPercentage: real("selection_percentage").notNull().default(0),
  avatar: text("avatar"),
  battingAvg: real("batting_avg"),
  bowlingAvg: real("bowling_avg"),
  recentForm: text("recent_form"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

export const teamsTable = pgTable("teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  matchId: integer("match_id").notNull(),
  captain: text("captain").notNull(),
  viceCaptain: text("vice_captain").notNull(),
  players: text("players").array().notNull(),
  totalCredits: real("total_credits").notNull().default(0),
  totalPoints: real("total_points"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teamsTable).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamsTable.$inferSelect;
