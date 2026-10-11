# PHASE 01 — Project setup, Supabase, authentication

You are building **HFitness**. First read `AGENTS.md` (repo root). Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §3, §4, §6, §17 (profiles), §18
- `docs/UI_SPEC_USER_MVP.md` §1, §2, §4, §6, §17, §19
- Stitch screen: `docs/stitch/login-register/`

## Goal
A running skeleton: frontend + backend + Supabase, with working register/login/logout, protected routes, an app shell, and a verified Node API auth middleware.

## Prerequisites (already done by the user)
Supabase project exists; `.env` files are filled locally; `docs/` contains the specs.

## Tasks

### Repo
1. Create `web/` (Vite + React + TypeScript) and `server/` (Node + TypeScript + Express) following the layout in `AGENTS.md`.
2. Add scripts in each package: `dev`, `build`, `typecheck`, `lint` (if ESLint is set up), `test` (Vitest or similar; may contain one smoke test).
3. Add `web/.env.example` and `server/.env.example` exactly as in `AGENTS.md`. Add `.gitignore` (ignore `.env`).
4. Add a short `README.md` with run instructions.

### Database
5. Migration `supabase/migrations/001_profiles.sql`:
   - `profiles` table with the columns listed in the spec (`id` references `auth.users`, `display_name`, `role` default `'USER'`, onboarding fields nullable, `onboarding_completed` default false, timestamps).
   - Trigger to create a profile row when a user registers.
   - RLS: users can `SELECT` and `UPDATE` only their own row.
   - **Prevent users from changing `role`** (column-level privilege or a BEFORE UPDATE trigger).
6. Document in the report how to apply the migration (SQL editor or CLI).

### Backend
7. Express app with: CORS from env, JSON body parsing, `GET /api/v1/health`.
8. Auth middleware that verifies the Supabase access token and attaches the user to the request; returns 401 with the standard error format when invalid.
9. Per-request Supabase client built from the user's JWT (see `AGENTS.md` §5) and a separate service-role client helper (not used yet).
10. Central error handler and a small `AppError` class producing the standard `{ error: { code, message } }` response.
11. `GET /api/v1/me/ping` (protected) returning `{ data: { userId } }` to prove the middleware works.

### Frontend
12. Design tokens in `web/src/styles/tokens.*` (colors, typography, spacing, radius, breakpoints). Use the exact palette from `AGENTS.md` §11 (`#0B0B0D`, `#18181B`, `#EF4444`, `#F4F4F5`, `#A1A1AA`); if the Stitch screen differs, the tokens win.
12b. i18n foundation per `AGENTS.md` §11: `web/src/i18n/en.ts` (typed dictionary), a `t(key, params?)` helper, a `Locale` type (`'en' | 'vi'`) with `en` as default. **No i18n library.** Every string in the pages and components you build in this phase must come from translation keys.
13. Base UI components: Button, Input, Field (label + error), Card, Toast (or simple alert), Skeleton, EmptyState, ErrorState, Spinner.
14. Supabase client, `AuthProvider` (session state, `signUp`, `signIn`, `signOut`), `ProtectedRoute` and `PublicOnlyRoute`.
15. Pages: `/login`, `/register` matching the Stitch screen; Zod validation (email, password min length, confirm password match); loading and error states.
16. App shell for authenticated routes: desktop sidebar (Dashboard, Workout, Exercises, Nutrition, Progress, AI Coach, Profile) and mobile bottom bar (Home, Workout, Nutrition, Progress, More). Placeholder pages for every route in the spec with a clear "Coming soon" empty state. `/404` page.
17. API client wrapper that attaches the access token and unwraps `{ data }` / `{ error }`.

## Out of scope
Onboarding, profile editing, any real feature page, password reset flow, landing page, AI code, seed data.

## Acceptance criteria
- [ ] A new user can register, is logged in, sees the app shell, can log out and log in again.
- [ ] Unauthenticated users are redirected from app routes to `/login`; logged-in users are redirected away from `/login`.
- [ ] A `profiles` row is created automatically on registration.
- [ ] A user **cannot** update their own `role` (demonstrate with a failing update).
- [ ] `GET /api/v1/me/ping` returns 401 without a token and 200 with a valid token.
- [ ] No secret keys appear in `web/` or in committed files.
- [ ] `typecheck` and `build` pass in both `web/` and `server/`.

## Checks to run
`typecheck`, `build` (web and server), the smoke test, and a manual register → logout → login run.

## Report
Use the report template from `AGENTS.md` §9 and stop.
