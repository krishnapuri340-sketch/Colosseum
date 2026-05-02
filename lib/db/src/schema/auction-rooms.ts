import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const auctionRoomsTable = pgTable("auction_rooms", {
  id:              serial("id").primaryKey(),
  code:            text("code").notNull().unique(),
  name:            text("name").notNull(),
  hostUserId:      integer("host_user_id"),
  budget:          integer("budget").notNull().default(100),
  maxPlayers:      integer("max_players").notNull().default(15),
  format:          text("format").notNull().default("classic"),
  topScoring:      boolean("top_scoring").notNull().default(false),
  topScoringCount: integer("top_scoring_count").notNull().default(11),
  captainVC:       boolean("captain_vc").notNull().default(true),
  status:          text("status").notNull().default("lobby"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuctionRoom = typeof auctionRoomsTable.$inferSelect;
