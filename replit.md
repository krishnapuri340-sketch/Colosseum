# Colosseum — Cricket Fantasy App

## Overview

IPL fantasy cricket platform. Dark space-themed UI. pnpm monorepo with a React+Vite frontend and Express 5 API backend.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24 | **TypeScript**: 5.9
- **Frontend**: React + Vite, Tailwind, Framer Motion, Recharts, Wouter routing
- **Backend**: Express 5, PostgreSQL + Drizzle ORM, Zod validation
- **Auth**: JWT in HTTP-only cookie, bcrypt password hashing
- **API codegen**: Orval (OpenAPI spec → React Query hooks + Zod types)

## Key Services

| Service | Port | Path |
|---------|------|------|
| API Server | 8080 | `/api` |
| Cricket Fantasy Web | 19147 | `/` |

## Auth Flow

- `POST /api/auth/signup` — create account (name, email, password)
- `POST /api/auth/login` — login (email, password) → sets `cricstrat_token` cookie
- `GET /api/auth/me` — returns logged-in user
- `POST /api/auth/logout` — clears cookie
- All app pages behind auth guard; `/login` and `/register` are public

## Live IPL Data

- `GET /api/ipl/matches` — pulls from IPL S3 feed (real-time, 70 matches, IPL 2026)
- `GET /api/ipl/standings` — IPL points table
- `GET /api/ipl/scorecard/:matchId` — raw scorecard from S3
- `GET /api/ipl/points/:matchId` — calculated fantasy points per player

## Pages

- `/` — Dashboard (stats widgets, upcoming matches)
- `/matches` — Live Match Centre (real IPL data from S3 feed)
- `/contests` — Contest browser
- `/players` — Player browser with role/team filters
- `/my-teams` — Team management
- `/leaderboard` — Rankings table
- `/guide` — Scoring rules, IPL team directory, how-to-play

## Auction Module (Full)

### Flow
- **Create** (`/auction/create`) → host sets name/budget/maxPlayers/format → room code issued
- **Join** (`/auction/join`) → member enters invite code → picks team name
- **AuctionRoom** (`/auction/room`) — main live auction UI
- **AuctionComplete** (`/auction/complete`) — final results page with rosters

### AuctionRoom stages
1. **Prep** — host manages player pool (exclude players) + watchlist; waits for ≥2 teams
2. **Auction** — tile reveal → bidding → sold/unsold → next player cycle
3. **Done** — host clicks "View Final Results" → navigates to AuctionComplete

### Key features
- `buildQueue(mode, excl[])` — shuffled player order respecting exclusions
- `PlayerPoolPanel` — host-only modal to exclude players before auction (strikethrough UI)
- `WatchlistPanel` — star players you want to target
- `saveSnap()` — persists full auction state JSON to DB on every sold/unsold/start
- Rejoin support: on mount, loads saved state from DB before falling back to teams API
- `maxPlayersPerTeam` constraint — team bid buttons disabled when squad is full
- `doComplete()` — host-only; POSTs final state, marks room `status=complete`, redirects
- WS broadcast includes `excluded[]` + `maxPlayers` so members see accurate state

### DB Tables
- `auction_rooms` — room settings (budget, maxPlayers, format, status)
- `auction_room_teams` — registered teams per room
- `auction_room_state` — full JSON snapshot (upserted after each action)

### API Endpoints (auction-rooms.ts)
- `POST   /api/auction/rooms` — create/upsert room
- `GET    /api/auction/rooms/:code` — look up room
- `GET    /api/auction/rooms/:code/teams` — list teams
- `POST   /api/auction/rooms/:code/teams` — register team
- `GET    /api/auction/rooms/:code/state` — load saved snapshot
- `PUT    /api/auction/rooms/:code/state` — upsert snapshot
- `POST   /api/auction/rooms/:code/complete` — finalise auction

### WS Hub (`/api/ws/auction`)
- Host → server → members (in-memory broadcast, no persistence needed; state is in DB)
- Payload includes: roomStage, phase, nominated, bidValue, leadId, teams, log, excluded, maxPlayers

## DB Schema (lib/db/src/schema/)

- `users` — email, passwordHash, name, isAdmin
- `matches` + `contests` — DB matches (legacy, seeded)
- `players` + `teams` — fantasy players/teams
- `leaderboard` + `activity` — stats tables
- `auction_rooms` — auction room settings + status
- `auction_room_teams` — per-room team registrations
- `auction_room_state` — full JSON auction state snapshot

## Key Files

- `artifacts/cricket-fantasy/src/lib/ipl-constants.ts` — team logos, colors, scoring rules
- `artifacts/cricket-fantasy/src/context/AuthContext.tsx` — auth state
- `artifacts/api-server/src/routes/auth.ts` — JWT auth routes
- `artifacts/api-server/src/routes/ipl.ts` — live IPL data proxy
- `artifacts/cricket-fantasy/src/pages/AuctionRoom.tsx` — full auction UI (2000+ lines)
- `artifacts/cricket-fantasy/src/pages/AuctionComplete.tsx` — final results page
- `artifacts/api-server/src/routes/auction-rooms.ts` — all auction REST routes

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — API server dev
- `pnpm --filter @workspace/cricket-fantasy run dev` — frontend dev
