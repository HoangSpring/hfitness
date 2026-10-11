# PHASE 03 — Exercise library and landing page

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §9, §17 (exercises), §18
- `docs/UI_SPEC_USER_MVP.md` §4, §5, §9, §17
- Stitch screens: `docs/stitch/landing/`, `docs/stitch/exercise-library/`

## Goal
A public, searchable exercise library backed by seeded data, plus the public landing page.

## Tasks

### Database
1. Migration `003_exercises.sql`: table `exercises` — `id`, `name`, `slug` (unique), `description`, `instructions` (text or text[]), `primary_muscle`, `secondary_muscles` text[], `equipment`, `difficulty`, `movement_pattern`, `image_url`, `video_url`, `safety_notes`, `status` (`DRAFT` / `PUBLISHED` / `ARCHIVED`, default `DRAFT`), `created_at`, `updated_at`. Add CHECK constraints for status/difficulty and indexes on slug, primary_muscle, equipment, status.
2. RLS: anyone (including anonymous) may `SELECT` rows where `status = 'PUBLISHED'`. **No write policies yet** (admin policies come in Phase 09).
3. Fixed value lists (muscles, equipment, difficulty, movement patterns) as shared constants in code — **not** separate tables. Put them in one file in `server/src/lib/constants/` and mirror in `web/src/lib/constants/`.

### Seed
4. Seed script `supabase/seed/seed_exercises.*`:
   - If `supabase/seed/exercises.json` exists, map it into the table schema (document the mapping and any field the dataset lacks).
   - If it does not exist, create a hand-written seed of **at least 60 exercises** covering all muscle groups and all equipment types, with realistic instructions and safety notes. Use `image_url` placeholders if no images are available.
   - Seeded exercises are `PUBLISHED`. Script must be re-runnable (upsert by slug).
5. Document how to run the seed in the README.

### Frontend
6. `/exercises`: search box (debounced), muscle / equipment / difficulty filters, exercise cards (image, name, primary muscle, equipment, difficulty), server-side pagination (or "load more"), loading skeleton, empty state ("No exercises match your filters" + clear filters), error with retry. Filters reflected in the URL query string.
7. `/exercises/:slug`: media, name, muscle, equipment, difficulty, instructions, safety notes. Unknown slug → friendly not-found state. CTA: "Get started" if logged out, "Back to library" if logged in.
8. These routes are **public**; when logged in they render inside the app shell, when logged out inside a public layout (top bar: Logo · Exercises · Login · Get Started).
9. Landing page `/`: Hero, How it works (3 steps), Features, short FAQ, CTA, Footer. Hero text: "Personalized gym training and nutrition powered by AI." Primary CTA "Get Started" → `/register`; secondary "Explore Exercises" → `/exercises`. Logged-in users visiting `/` are redirected to `/dashboard`.
10. Query exercises directly through the Supabase client (no new Node endpoints).

## Out of scope
Admin editing, alternatives/replace-exercise, favorites, workout plans.

## Acceptance criteria
- [ ] Seeded exercises appear; only `PUBLISHED` rows are visible to anonymous users (demonstrate that a DRAFT row is hidden).
- [ ] Search and all three filters work together and survive page refresh via the URL.
- [ ] Detail page works by slug; invalid slug shows a clean not-found state.
- [ ] Landing page matches the Stitch design and CTAs route correctly.
- [ ] Seed script is idempotent.
- [ ] `typecheck` and `build` pass.

## Report
Use the template in `AGENTS.md` §9 and stop.
