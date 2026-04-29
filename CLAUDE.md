# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HEALTH AI** is a co-creation platform where engineers and healthcare professionals connect to form interdisciplinary partnerships. The repo contains a React/TypeScript frontend and a Node.js/Express backend that are **fully integrated** end to end. Real-mode is the default; mock-mode (`VITE_USE_MOCK_DATA=true`) remains as an opt-in toggle for vitest fixtures and disconnected demos.

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev        # Dev server on port 8080 (real-mode by default)
npm run build      # Production build
npm run lint       # ESLint
npm test           # Vitest (run once)
npm run test:watch # Vitest watch mode
```

### Backend (`cd backend`)
```bash
npm run dev              # nodemon dev server on port 5000
npm test                 # Jest + Supertest (requires postgres on 5434)
npm run test:unit        # Audit-chain unit tests only
npm run db:migrate       # Prisma migrate dev
npm run db:seed          # Seed 6 users / 8 posts / 3 meetings
npm run db:studio        # Prisma Studio UI
```

### Docker
```bash
cp .env.example .env     # Edit JWT_SECRET (openssl rand -hex 48)
docker compose up --build
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
docker compose logs -f backend
docker compose down
```

Caddy serves HTTPS on `https://localhost` (internal CA → browser warns once).

## Architecture

### Frontend: dual-mode React SPA

TypeScript + React 18 + Vite. `PlatformDataContext` is the single context consumed by all UI; it transparently switches between two backends based on `isMockMode()` (read from `VITE_USE_MOCK_DATA`):

- **Real mode** (default): on mount, calls `/api/posts`, `/api/meetings`, `/api/notifications`, plus `/api/admin/users` and `/api/admin/audit-logs` for admins. Mutations call the API and update the local cache from the response. localStorage persistence and the FR-15/NFR-10 sweeps are disabled (backend cron handles them).
- **Mock mode**: Seeded from `src/data/mockData.ts`, persisted to localStorage under `health-ai-platform-data`. All previous mock behavior preserved so the 7 vitest scenarios stay green.

`AuthContext` integrates with this:
- Real-mode: bootstraps current user from `/api/auth/me` whenever an access token is present in localStorage. `loginWithCredentials({ email, password, honeypot })` calls `/api/auth/login`.
- Mock-mode: existing role-based and email-lookup login preserved (`Quick demo access` buttons visible only here).

`ChatDockContext` controls the floating chat dock visibility and active conversation.

API layer (`frontend/src/api/`) — all live: `auth.ts`, `posts.ts`, `messages.ts`, `meetings.ts`, `notifications.ts`, `users.ts`, `admin.ts`. `transforms.ts` normalizes Title Case ↔ snake_case enums at the boundary so UI components stay oblivious. `client.ts` axios instance handles JWT bearer + 401-refresh-retry + tokens in localStorage (`health-ai-access-token`, `health-ai-refresh-token`).

UI stack: shadcn/ui (Radix + Tailwind). Three.js scenes via `@react-three/fiber` on landing. Path alias `@/` → `src/`.

Key data types (`frontend/src/data/types.ts`): `User`, `Post`, `MeetingRequest`, `Message`, `Notification`, `ActivityLog`. Roles: `engineer | healthcare | admin`.

Audit log SHA-256 chain (FR-53) — `frontend/src/lib/hash.ts` uses Web Crypto `subtle.digest`; matches the backend `crypto.createHash('sha256')` chain so server and client write the same hash.

### Backend: Express + Prisma, fully aligned with frontend

- Schema (`backend/prisma/schema.prisma`): aligned with frontend types — Role: `engineer | healthcare | admin`, ProjectStage: `ideation | research | prototype | development | testing | clinical_validation`, Confidentiality 3-level, MeetingStatus adds accepted/declined, UserStatus enum with pending_deletion. New models: `PostStatusHistory`, `NDAAcceptance`. AuditLog gets hash + prevHash + retention.
- Routes: `/api/auth`, `/api/posts`, `/api/messages`, `/api/meetings`, `/api/notifications`, `/api/users`, `/api/admin`.
- Middleware: `authenticate` enforces JWT + 30-min sliding inactivity (NFR-06) + bumps `lastActiveAt` on every request. `requireVerified` honors `ALLOW_UNVERIFIED=true` for dev. `requireRole(...)` opens posts to engineer + healthcare + admin (UC-05 fix).
- Services: `audit.js` (SHA-256 chain + verifyAuditChain), `email.js` (6 templates, skips if SMTP_USER absent), `auth.js`, `posts.js`. Singleton Prisma in `lib/prisma.js`.
- Background: `jobs/sweeps.js` runs hourly auto-expire + 72h pending-deletion hard-delete via node-cron, also fires once on boot.
- Security: helmet, helmet-CSP in prod, auth-specific rate limit (10 failed attempts / 15 min / IP, NFR-07), honeypot bot rejection on register & login, JWT_SECRET runtime fail-fast in production (must be ≥ 32 chars and not a placeholder).

## Mock vs Real Mode

`VITE_USE_MOCK_DATA=false` is the default. Frontend container build args also default to `false`. Set `true` only for vitest fixtures, offline demo, or disconnected presentation.

## Test layout

- Frontend: 12 vitest tests across 2 files (`app-flows.test.tsx` + `new-pages.test.tsx`).
- Backend: 27 jest + supertest tests across 5 files (auth, posts, meetings, admin, audit-chain). Requires postgres on 5434.

## MCP Tools: code-review-graph

Use graph tools **before** file reading for structural exploration:

| Task | Tool |
|------|------|
| Explore code structure | `semantic_search_nodes` |
| Impact of a change | `get_impact_radius` |
| Find callers/callees | `query_graph` (callers_of / callees_of) |
| Find tests for a function | `query_graph` (tests_for) |
| Understand architecture | `get_architecture_overview` |

Fall back to Grep/Read only for new code, full file content, or config files.
