# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**HEALTH AI** is a co-creation platform where engineers and healthcare professionals connect to form interdisciplinary partnerships. The React/TypeScript frontend and Node.js/Express backend are **fully integrated** end to end. Real-mode is the default; `VITE_USE_MOCK_DATA=true` remains as an opt-in toggle for vitest fixtures and disconnected demos.

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev        # Dev server on port 8080 (real-mode by default)
npm run build      # Production build
npm run lint       # ESLint
npm test           # Vitest (run once)
```

### Backend (`cd backend`)
```bash
npm run dev              # nodemon dev server on port 5000
npm test                 # Jest + Supertest (requires postgres on 5434)
npm run test:unit        # Audit-chain unit tests only
npm run db:migrate       # Prisma migrate dev
npm run db:seed          # Seed 6 users / 8 posts / 3 meetings (Demo123!)
```

### Docker
```bash
cp .env.example .env  # Edit JWT_SECRET (openssl rand -hex 48)
docker compose up --build
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

Caddy serves HTTPS at `https://localhost` (internal CA self-signed for local dev).

## Architecture

### Frontend: dual-mode SPA

`PlatformDataContext` (`frontend/src/contexts/PlatformDataContext.tsx`) is the single context — it switches between API-backed and mock-backed implementations based on `isMockMode()`. Real-mode fetches `/api/posts`, `/api/meetings`, `/api/notifications` (and admin-only `/api/admin/users` + audit logs) on mount and re-fetches after each mutation. Mock-mode preserves existing optimistic in-memory behavior so the 7 baseline vitest scenarios stay green.

`AuthContext` real-mode: bootstraps current user from `/api/auth/me` when an access token is present. `loginWithCredentials({ email, password, honeypot })` hits `/api/auth/login`. Mock-mode keeps the role-based "Quick demo access" buttons (hidden in real-mode UI).

API layer (`frontend/src/api/`) is fully wired and uses `transforms.ts` to translate Title Case ↔ snake_case enums at the request/response boundary.

Audit log hash chain uses Web Crypto SHA-256 (`frontend/src/lib/hash.ts`), matching the backend's Node `crypto.createHash` chain.

### Backend: Express + Prisma + node-cron

- Schema aligned with frontend: Role `engineer | healthcare | admin`, ProjectStage 6-state, Confidentiality 3-level, MeetingStatus 6-state, UserStatus enum. New models `PostStatusHistory`, `NDAAcceptance`. AuditLog with hash + prevHash + retention.
- Routes: `/api/auth`, `/api/posts`, `/api/messages`, `/api/meetings`, `/api/notifications`, `/api/users`, `/api/admin`.
- Middleware: 30-min sliding inactivity timeout, RBAC, optional dev-bypass for verified-only routes.
- Audit service: SHA-256 hash chain + `verifyAuditChain()`. CSV export streams with hash + prevHash columns.
- Background sweeps via `node-cron`: hourly auto-expire (FR-15) + 72h hard-delete for pending_deletion accounts (NFR-10).
- Security: helmet, auth-specific rate limit (NFR-07), honeypot rejection (NFR-08), production JWT_SECRET hard-fail.

## Mock vs Real Mode

Default is `VITE_USE_MOCK_DATA=false`. Set to `true` only for vitest, offline demo, or disconnected presentation.

## Test layout

- Frontend: 12 vitest tests (`app-flows` + `new-pages`).
- Backend: 27 jest + supertest tests (auth, posts, meetings, admin, audit-chain). Requires postgres on 5434.

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
