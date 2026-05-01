import { pgTable, serial, integer, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const predictionsTable = pgTable("predictions", {
  id:       serial("id").primaryKey(),
  userId:   integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  matchId:  text("match_id").notNull(),
  winner:   text("winner"),
  mom:      text("mom"),
  sixes:    text("sixes"),
  points:   integer("points").notNull().default(0),
  settled:  boolean("settled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [unique("predictions_user_match").on(t.userId, t.matchId)]);

export type Prediction   = typeof predictionsTable.$inferSelect;
export type InsertPrediction = typeof predictionsTable.$inferInsert;
