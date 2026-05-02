import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auctionRoomStateTable = pgTable("auction_room_state", {
  roomCode:  text("room_code").primaryKey(),
  stateJson: text("state_json").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuctionRoomState = typeof auctionRoomStateTable.$inferSelect;
