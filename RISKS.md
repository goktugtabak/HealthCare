# Known Risks & Open Issues

Last updated: 2026-04-22

---

## RISK-01: Frontend runs in mock mode — not connected to backend

**Severity:** High  
**Status:** Open

The frontend (`AuthContext.tsx`, `PlatformDataContext.tsx`) reads and writes entirely from
`localStorage`-backed mock data. The `src/api/` layer (auth.ts, posts.ts, users.ts, etc.)
is built and correct but is never called by any page or context.

**Impact:** All user actions (login, register, post creation, meetings) persist only in the
browser. Reloading with a different browser or device loses all data. There is no real
authentication — passwords are ignored and email matching is the only access control.

**What needs to happen before going to production:**
1. Replace `AuthContext.tsx` login/register/logout with calls to `src/api/auth.ts`.
2. Replace `PlatformDataContext.tsx` CRUD operations with calls to the respective API modules.
3. Wire `VITE_USE_MOCK_DATA=false` in the frontend `.env` and remove the mock fallback.

---

## RISK-02: Prisma schema missing frontend-only user fields

**Severity:** Medium  
**Status:** Open — requires a migration before backend can be the source of truth

The `users` table does not have columns for fields that the frontend `User` type expects:

| Frontend field       | Prisma `users` table | Gap                        |
|----------------------|----------------------|----------------------------|
| `city`               | missing              | add `city String?`         |
| `country`            | missing              | add `country String?`      |
| `expertiseTags`      | missing              | add `expertiseTags String[]` |
| `interestTags`       | missing              | add `interestTags String[]` |
| `onboardingCompleted`| missing              | add `onboardingCompleted Boolean @default(false)` |
| `portfolioSummary`   | missing              | add `portfolioSummary String?` |
| `portfolioLinks`     | missing              | add `portfolioLinks String[]` |
| `avatar`             | missing              | add `avatar String?`       |
| `preferredContact`   | missing              | add as JSON or separate table |

**What needs to happen:**
1. Add the above fields to `backend/prisma/schema.prisma`.
2. Run `npm run db:migrate` to generate and apply the migration.
3. Update `backend/src/routes/users.js` `PATCH /me` and `POST /me/onboarding` to
   persist these fields.

---

## RISK-03: Post schema divergence between frontend and backend

**Severity:** Medium  
**Status:** Open

The frontend `Post` type and the backend `Post` Prisma model use different field names
and value shapes for the same concept:

| Frontend field          | Backend field       | Notes                                    |
|-------------------------|---------------------|------------------------------------------|
| `ownerId`               | `authorId`          | Rename in one layer                      |
| `shortExplanation`      | `description`       | Rename                                   |
| `workingDomain`         | `domain`            | Rename                                   |
| `requiredExpertise[]`   | `expertiseNeeded`   | Backend is a single string, not an array |
| `collaborationType`     | missing             | Add to schema                            |
| `confidentialityLevel`  | `confidentiality`   | Frontend: `'Public'|'Confidential'|...`, Backend enum: `public|private` |
| `expiryDate`            | `expiresAt`         | Rename + type (string vs DateTime)       |
| `autoClose`             | missing             | Add to schema                            |
| `matchTags[]`           | missing             | Derived field; compute on read           |
| `highLevelIdea`         | missing             | Add to schema                            |
| `notesPreview`          | missing             | Derived/static; not stored               |
| PostStatus values       | different casing    | Frontend: `'Active'`, Backend enum: `active` |

**What needs to happen:**
1. Decide whether to align on frontend naming or backend naming (recommend backend as
   source of truth, map in the API layer).
2. Update `schema.prisma`, add a migration, update `routes/posts.js` accordingly.

---

## RISK-04: `.edu` email validation is backend-only

**Severity:** Low  
**Status:** Open

`backend/src/services/auth.js` rejects non-`.edu` emails. The frontend register form
(`RegisterPage.tsx`) has no matching validation — users get a confusing server error
instead of an inline message.

**Fix:** Add `.edu` email pattern check to the frontend register form before submission.

---

## Fixed issues (resolved 2026-04-22)

| Issue | Fix location |
|-------|-------------|
| Prisma `new PrismaClient()` per logout request | `backend/src/routes/auth.js` — module-level singleton |
| Register rejected `fullName` (frontend sends one field, backend expected two) | `backend/src/routes/auth.js` — `fullName` is split on whitespace |
| Role mismatch (`healthcare` vs `doctor`) in register and login | `backend/src/routes/auth.js` + `backend/src/services/auth.js` — normalized on both sides |
| `/api/users` route missing | `backend/src/routes/users.js` created; registered in `backend/src/index.js` |
