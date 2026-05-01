/**
 * auction-ws.ts
 *
 * WebSocket hub for live auction sync.
 * Path: /api/ws/auction?room=<code>&host=1
 *
 * Protocol:
 *   Host → Server:  { type:"state",   payload: AuctionSnapshot }
 *   Server → Member:{ type:"state",   payload: AuctionSnapshot }
 *   Server → *:     { type:"presence",members: number }
 */
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server as HttpServer } from "http";
import { logger } from "../lib/logger";

interface Room {
  host:      WebSocket | null;
  members:   Set<WebSocket>;
  lastState: object | null;
}

const rooms = new Map<string, Room>();

function getRoom(code: string): Room {
  if (!rooms.has(code)) {
    rooms.set(code, { host: null, members: new Set(), lastState: null });
  }
  return rooms.get(code)!;
}

function broadcastPresence(room: Room) {
  const count = (room.host ? 1 : 0) + room.members.size;
  const msg = JSON.stringify({ type: "presence", members: count });
  if (room.host?.readyState === WebSocket.OPEN) room.host.send(msg);
  for (const m of room.members) {
    if (m.readyState === WebSocket.OPEN) m.send(msg);
  }
}

export function attachAuctionWS(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: "/api/ws/auction" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url      = new URL(req.url ?? "/", "ws://localhost");
    const roomCode = url.searchParams.get("room") ?? "";
    const isHost   = url.searchParams.get("host") === "1";

    if (!roomCode) {
      ws.close(1008, "No room code");
      return;
    }

    const room = getRoom(roomCode);

    if (isHost) {
      room.host = ws;
      logger.info({ roomCode }, "Auction host connected");
    } else {
      room.members.add(ws);
      logger.info({ roomCode, members: room.members.size }, "Auction member connected");
      if (room.lastState) {
        ws.send(JSON.stringify({ type: "state", payload: room.lastState }));
      }
    }

    broadcastPresence(room);

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as { type: string; payload?: object };
        if (msg.type === "state" && isHost && msg.payload) {
          room.lastState = msg.payload;
          for (const member of room.members) {
            if (member.readyState === WebSocket.OPEN) {
              member.send(JSON.stringify({ type: "state", payload: msg.payload }));
            }
          }
        }
      } catch {
        /* ignore malformed frames */
      }
    });

    ws.on("close", () => {
      if (isHost) {
        room.host = null;
        logger.info({ roomCode }, "Auction host disconnected");
      } else {
        room.members.delete(ws);
        logger.info({ roomCode, members: room.members.size }, "Auction member disconnected");
      }
      broadcastPresence(room);
    });

    ws.on("error", () => {
      if (!isHost) room.members.delete(ws);
    });
  });

  logger.info("Auction WebSocket server attached at /api/ws/auction");
}
