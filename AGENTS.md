# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**HEALTH AI** is a co-creation platform where engineers and healthcare professionals connect to form interdisciplinary partnerships. The repo contains a React/TypeScript frontend and a Node.js/Express backend, but they are currently **decoupled** — the frontend runs entirely on mock data by default.

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev        # Dev server on port 8080
npm run build      # Production build
npm run lint       # ESLint
npm test           # Vitest (run once)
npm run test:watch # Vitest watch mode
```

### Backend (`cd backend`)
```bash
npm run dev            # nodemon dev server on port 5000
npm test               # Jest unit tests
npm run test:integration # Jest integration tests (requires DB)
npm run db:migrate     # Prisma migrate dev
npm run db:seed        # Seed database
npm run db:studio      # Prisma Studio UI
```

### Docker
```bash
docker-compose up --build   # Start all services
docker-compose logs -f backend
docker-compose down
```

## Architecture

### Frontend: Mock-first React SPA

The frontend is a **TypeScript + React 18 + Vite** app. All state is in-memory/localStorage — no live backend calls when `VITE_USE_MOCK_DATA=true` (the default).

**Context layer** (`frontend/src/contexts/`):
- `PlatformDataContext` — single source of truth for all entities (users, posts, messages, meetings, notifications). Seeded from `src/data/mockData.ts`, persisted to localStorage under `health-ai-platform-data`.
- `AuthContext` — wraps `PlatformDataContext`; stores current user id in localStorage under `health-ai-current-user`. Login is by role or email lookup against mock users — no password check.
- `ChatDockContext` — controls the floating chat dock visibility and active conversation.

**API layer** (`frontend/src/api/`): Axios client in `client.ts` with JWT bearer token injection and automatic 401 → token-refresh → retry logic. Each file (`auth.ts`, `posts.ts`, `messages.ts`, etc.) exports typed async functions. These are **currently unused** because the frontend reads from context instead; they exist for future backend integration.

**Routing** (`frontend/src/App.tsx`): React Router v6. `ProtectedRoute` enforces auth, onboarding completion, and admin role. Onboarding is required before accessing any authenticated route (except `/onboarding` itself).

**UI stack**: shadcn/ui components (Radix UI primitives + Tailwind). Three.js scenes via `@react-three/fiber` are used on the landing page and as decorative elements. Path alias `@/` maps to `src/`.

**Key data types** (`frontend/src/data/types.ts`): `User`, `Post`, `MeetingRequest`, `Message`, `Notification`, `ActivityLog`. Roles: `engineer | healthcare | admin`.

### Backend: Express + Prisma (not yet integrated with frontend)

Node.js/Express with Prisma ORM and PostgreSQL. Uses CommonJS (`require`/`module.exports`). JWT auth, bcrypt passwords, Winston logging, express-rate-limit, helmet.

Routes: `/api/auth`, `/api/posts`, `/api/messages`, `/api/admin`. The Prisma schema lives at `backend/prisma/schema.prisma`.

## Mock vs Real Mode

Set `VITE_USE_MOCK_DATA=false` in `frontend/.env` to enable real API calls. Check `isMockMode()` in `frontend/src/api/client.ts` — individual API modules use this flag to decide whether to return mock data or call the backend.

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
