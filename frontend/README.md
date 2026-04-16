# Health AI Frontend

Frontend application for the **HEALTH AI Co-Creation Platform**.

This project is a React + TypeScript single-page application built with Vite. It currently runs on **mock data and local state**, and is focused on demonstrating the role-based user experience for healthcare professionals, engineers, and admins.

## Overview

The frontend covers the main platform flows:

- Public landing page
- Login and registration screens
- Role-based authenticated navigation
- Dashboard and exploration flows
- Post creation, editing, and detail views
- Meetings, notifications, and profile pages
- Admin pages for users, posts, logs, and stats

Authentication is currently mocked in the frontend. There is **no backend integration yet**.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI primitives
- React Router
- TanStack React Query
- Vitest + Testing Library
- Lucide icons

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The app runs on:

```text
http://localhost:8080
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - create a production build
- `npm run build:dev` - build with development mode
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode
- `npm run preview` - preview the built app

## Authentication and Demo Roles

Authentication is handled in `src/contexts/AuthContext.tsx` and is currently frontend-only.

Supported roles:

- `engineer`
- `healthcare`
- `admin`

Current behavior:

- Submitting the login form logs in as `engineer` by default
- The login page also provides quick demo access buttons for all 3 roles
- Protected pages are wrapped by a simple `ProtectedRoute`
- Logging out clears the in-memory user state

Mock users are loaded from:

```text
src/data/mockData.ts
```

## Application Routes

### Public routes

- `/` - landing page
- `/login` - login page
- `/register` - registration page

### Authenticated user routes

- `/dashboard` - main dashboard
- `/explore` - browse collaboration posts
- `/my-posts` - current user's posts
- `/posts/:id` - post detail page
- `/create-post` - create post form
- `/edit-post/:id` - edit post form
- `/meetings` - meeting requests and schedule flow
- `/profile` - user profile
- `/notifications` - notifications page

### Admin routes

- `/admin` - admin dashboard
- `/admin/users` - user management
- `/admin/posts` - post management
- `/admin/logs` - activity logs
- `/admin/stats` - platform statistics

### Fallback

- `*` - not found page

## Project Structure

```text
frontend/
  src/
    components/        Reusable app components
    components/ui/     shadcn/ui and Radix-based UI primitives
    contexts/          React context providers
    data/              Mock data and shared TypeScript types
    hooks/             Reusable hooks
    lib/               Utilities
    pages/             Route-level page components
    test/              Test setup and example tests
    App.tsx            Router and providers
    main.tsx           Application entry point
    index.css          Global styles and theme tokens
```

## Key Frontend Concepts

### 1. Mock-data-first development

The current frontend is designed for iterative UI development without a backend. Core entities such as users, posts, notifications, and meeting requests live in:

```text
src/data/mockData.ts
src/data/types.ts
```

This keeps page development fast and makes it easy to replace the data layer later.

### 2. Role-based UI

Navigation and page access are role-aware. The shell and sidebar adapt based on the active user role.

Related files:

- `src/components/AppShell.tsx`
- `src/components/Sidebar.tsx`
- `src/components/TopNav.tsx`
- `src/components/app-shell-nav.ts`

### 3. Reusable UI building blocks

The project uses shared building blocks for badges, cards, filters, confirmations, and dialogs.

Examples:

- `src/components/PostCard.tsx`
- `src/components/RoleBadge.tsx`
- `src/components/StatusBadge.tsx`
- `src/components/FilterComponents.tsx`
- `src/components/MeetingRequestModal.tsx`
- `src/components/ConfirmationModal.tsx`

### 4. Styling approach

Styling is based on:

- Tailwind utility classes
- design tokens in `src/index.css`
- reusable UI primitives under `src/components/ui`

The codebase also uses the `@` alias for `src`, configured in `vite.config.ts`.

## Notes for Contributors

- Prefer extending existing components instead of rewriting pages from scratch
- Keep state local unless a shared context is clearly needed
- Use mock data for new UI work unless backend integration is explicitly added
- Reuse existing badges, buttons, modals, and shell components where possible
- Follow the current route structure instead of creating parallel page flows

## Testing

Vitest is configured and basic test scaffolding already exists:

- `src/test/setup.ts`
- `src/test/example.test.ts`
- `vitest.config.ts`

Run tests with:

```bash
npm run test
```

## Future Integration Notes

When a backend is introduced, the main replacement points will likely be:

- `src/contexts/AuthContext.tsx` for real authentication
- `src/data/mockData.ts` for API-backed data fetching
- page-level local state for mutations and persistence
- React Query hooks for server state management

## Quick Start for UI Work

If you are continuing frontend development:

1. Start from the relevant route in `src/pages/`
2. Check whether a reusable component already exists in `src/components/`
3. Keep new UI logic mock-data driven
4. Verify role-specific behavior using quick login on the login page
5. Run `npm run build` or `npm run test` before handing off changes
