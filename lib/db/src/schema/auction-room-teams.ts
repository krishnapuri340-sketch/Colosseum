import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const auctionRoomTeamsTable = pgTable("auction_room_teams", {
  id:       serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  userId:   integer("user_id"),
  teamName: text("team_name").notNull(),
  color:    text("color").notNull(),
  isHost:   boolean("is_host").notNull().default(false),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuctionRoomTeam = typeof auctionRoomTeamsTable.$inferSelect;
