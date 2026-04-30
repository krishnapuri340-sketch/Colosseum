# Threat Model

## Project Overview

Colosseum is an IPL fantasy cricket application built as a pnpm monorepo with a React + Vite frontend (`artifacts/cricket-fantasy`) and an Express 5 API (`artifacts/api-server`) backed by PostgreSQL via Drizzle ORM (`lib/db`). Users create accounts, maintain fantasy teams, view contests, and consume live IPL data proxied from a public S3 feed. Authentication is implemented with JWTs stored in an HTTP-only cookie.

Production assumptions for this scan: only production-reachable code matters; `NODE_ENV` is `production`; TLS is provided by the platform; `artifacts/mockup-sandbox` is a dev-only sandbox unless separate production reachability is demonstrated.

## Assets

- **User accounts and sessions** — email addresses, bcrypt password hashes, JWT session cookies, and admin flags in `users`. Compromise enables impersonation and account takeover.
- **User-created fantasy data** — teams, contest participation, rankings, and user-linked leaderboard records. Integrity matters because the product is centered on personal fantasy state and standings.
- **Application secrets** — database credentials and `SESSION_SECRET`. Compromise allows database access or forged sessions.
- **Operational data from external IPL feeds** — live match and scorecard data fetched server-side from S3. It is lower sensitivity but can influence availability and trust in displayed results.

## Trust Boundaries

- **Browser to API** — all frontend traffic crosses from an untrusted browser into `artifacts/api-server/src/routes/*`. The server must not rely on frontend route guards for auth or authorization.
- **API to PostgreSQL** — route handlers read and mutate application data through Drizzle. Any auth bypass at the API layer exposes the backing tables.
- **API to external IPL feed** — `artifacts/api-server/src/routes/ipl.ts` fetches remote S3 resources. This boundary matters for availability, parser safety, and upstream trust.
- **Authenticated user to unauthenticated user** — the product intent is that app functionality is behind login, but this boundary must be enforced server-side, not just in React.
- **Regular user to admin** — `users.isAdmin` exists, so any admin-only operations must be checked server-side even if they are not yet fully built out in the UI.
- **Production to dev-only artifacts** — `artifacts/mockup-sandbox` should usually be ignored in production scans unless it becomes reachable from deployed routes or build outputs.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/index.ts`, `artifacts/cricket-fantasy/src/App.tsx`
- **Highest-risk code areas:** `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/routes/teams.ts`, `artifacts/api-server/src/routes/contests.ts`, `artifacts/api-server/src/routes/ipl.ts`, `artifacts/api-server/src/app.ts`
- **Public vs authenticated vs admin:** frontend routes are gated in `artifacts/cricket-fantasy/src/App.tsx`, but API routes must be treated as public unless `artifacts/api-server` enforces checks; state-changing routes are currently especially sensitive because auth, ownership, and origin checks are not centralized; `users.isAdmin` implies an admin boundary not yet broadly enforced in the API
- **Dev-only areas:** `artifacts/mockup-sandbox/**` under current assumptions

## Threat Categories

### Spoofing

The application authenticates users with a JWT in the `cricstrat_token` cookie. The API must require a valid session on all user-specific or state-changing operations, and session signing must fail closed if `SESSION_SECRET` is absent. A default or guessable signing secret would let an attacker mint arbitrary sessions.

### Tampering

Fantasy team management, contest creation/joining, and any future privileged flows must be validated and authorized on the server. Client-side guards and client-controlled request bodies are not trustworthy. The system must ensure only the intended user can create, modify, or delete their own fantasy state, and only privileged actors can perform administrative mutations.

### Information Disclosure

Account metadata, leaderboard data, activity feeds, and any user-linked records returned by the API must be scoped deliberately. Because the frontend includes credentials on API requests, the API must not combine permissive cross-origin access with credentialed cookies. Error responses should avoid leaking internals beyond what is necessary for operators, especially on upstream proxy routes that currently surface fetch target details.

### Denial of Service

Public endpoints such as login, signup, and live IPL proxy routes can be abused for brute force or request flooding. Authentication routes need rate limiting, and external feed fetches must continue to use bounded timeouts and avoid attacker-controlled destinations.

### Elevation of Privilege

The main privilege-escalation risks are missing server-side authorization, missing ownership enforcement for user-created records, misconfigured session signing, and unvalidated identifiers crossing into trusted proxy paths. The backend must not assume that frontend route protection or hidden UI controls enforce privilege boundaries.