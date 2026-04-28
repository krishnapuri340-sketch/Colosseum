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

## DB Schema (lib/db/src/schema/)

- `users` — email, passwordHash, name, isAdmin
- `matches` + `contests` — DB matches (legacy, seeded)
- `players` + `teams` — fantasy players/teams
- `leaderboard` + `activity` — stats tables

## Key Files

- `artifacts/cricket-fantasy/src/lib/ipl-constants.ts` — team logos, colors, scoring rules
- `artifacts/cricket-fantasy/src/context/AuthContext.tsx` — auth state
- `artifacts/api-server/src/routes/auth.ts` — JWT auth routes
- `artifacts/api-server/src/routes/ipl.ts` — live IPL data proxy

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — API server dev
- `pnpm --filter @workspace/cricket-fantasy run dev` — frontend dev
