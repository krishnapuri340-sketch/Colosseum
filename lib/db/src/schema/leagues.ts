import { pgTable, serial, text, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";

export interface LeagueSquadEntry {
  name:    string;
  team:    string;
  role:    string;
  credits: number;
  price:   number;
  tier:    string;
}

export const leaguesTable = pgTable("leagues", {
  id:           serial("id").primaryKey(),
  code:         text("code").notNull().unique(),
  name:         text("name").notNull(),
  format:       text("format").notNull().default("classic"),
  budget:       integer("budget").notNull().default(100),
  squadSize:    integer("squad_size").notNull().default(15),
  captainVC:    boolean("captain_vc").notNull().default(true),
  hostUserId:   integer("host_user_id"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leagueMembersTable = pgTable("league_members", {
  id:          serial("id").primaryKey(),
  leagueId:    integer("league_id")
                 .notNull()
                 .references(() => leaguesTable.id, { onDelete: "cascade" }),
  userId:      integer("user_id"),
  teamName:    text("team_name").notNull(),
  color:       text("color").notNull(),
  isHost:      boolean("is_host").notNull().default(false),
  squadJson:   jsonb("squad_json").$type<LeagueSquadEntry[]>().notNull(),
  budgetSpent: real("budget_spent").notNull().default(0),
  joinedAt:    timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export type League        = typeof leaguesTable.$inferSelect;
export type LeagueMember  = typeof leagueMembersTable.$inferSelect;
