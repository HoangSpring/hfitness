# PHASE 09 — Minimal admin (steps 9a–9d)

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_ADMIN_MVP.md` (whole file — it is short)
- `docs/TECHNICAL_SPEC_USER_MVP.md` §9, §12 (exercises/foods fields), §17, §18
- `docs/UI_SPEC_ADMIN_MVP.md` (whole file)
- Stitch screens: `docs/stitch/admin-dashboard/`, `docs/stitch/admin-users/`, `docs/stitch/admin-exercises/`, `docs/stitch/admin-foods/`

## Goal
A small, secure admin area: manage exercises and foods, view users read-only, and see aggregate stats.

> This phase has four steps. **Do them one at a time and report after each step** (use the report template; a short report per step is fine). Do not start the next step until the previous one is approved. If you run low on budget, stop at the end of a step.

---

## Step 9a — Role guard, RLS, admin shell

1. Migration `009_admin.sql`:
   - `is_admin()` SQL function (SECURITY DEFINER, stable) returning true when `profiles.role = 'ADMIN'` for `auth.uid()`.
   - RLS policies for `exercises` and `foods`: admins can `SELECT` all rows and `INSERT`/`UPDATE`; no hard `DELETE` policy.
   - Re-verify that a normal user still cannot change `profiles.role`.
2. Frontend: `AdminRoute` guard (checks the profile role; redirects non-admins to `/403`), `/403` page, admin shell (sidebar: Dashboard, Users, Exercises, Foods + "Back to app"; top bar with title, admin profile, logout), placeholder admin pages. Remember: the guard is UX only — real protection is RLS/RPC.
3. Document how to create the first admin (SQL: set `role = 'ADMIN'` for a user in `profiles`).

**9a acceptance:** admin sees the shell; non-admin is redirected; a non-admin direct Supabase insert into `exercises` fails (demonstrate).

---

## Step 9b — Exercise management

1. List `/admin/exercises`: search, filters (muscle, equipment, difficulty, status), pagination, columns (image, name, primary muscle, equipment, difficulty, status badge, updated, actions), actions Edit / Publish / Archive.
2. Editor `/admin/exercises/new` and `/:id/edit`: grouped sections (basic info, instructions & safety, muscles, equipment & difficulty & movement pattern, media URLs, status). Buttons **Save draft / Publish / Archive**. Zod validation with inline errors; slug auto-generated from the name and unique.
3. **Publish validation:** name, slug, primary muscle, equipment, difficulty and instructions are required.
4. Archive uses a confirmation modal with a clear consequence message. No hard delete.
5. Verify that DRAFT/ARCHIVED exercises disappear from the public library and from AI plan generation.

**9b acceptance:** create → save draft → publish → visible publicly → archive → hidden; publish with missing fields is rejected.

---

## Step 9c — Food management

1. List `/admin/foods`: search, category and status filters, pagination, columns (food, category, serving, calories, protein, carbs, fat, status, updated, actions).
2. Editor `/admin/foods/new` and `/:id/edit`: identity, serving, nutrition, status; Save draft / Publish / Archive.
3. **Consistency warning** (not a block) when `calories` differs strongly from `protein×4 + carbs×4 + fat×9` (choose and document a tolerance, e.g. 15%).
4. Publish requires serving size and all four nutrition values. Archive with confirmation; no hard delete.
5. Verify that editing a food does not change existing `meal_items` snapshots.

**9c acceptance:** same lifecycle as exercises; warning appears for contradictory values; history unaffected by edits.

---

## Step 9d — Dashboard and read-only users

1. Postgres **RPC functions** (SECURITY DEFINER, each starting with an `is_admin()` check that raises an error otherwise):
   - `admin_dashboard_stats()` → total users, new users (7 days), workouts completed today, meals logged today, AI requests today, AI failed requests today (and optionally a 30-day user growth series).
   - `admin_list_users(search, goal, page, page_size)` → display name, email, goal, joined date, last active.
   - `admin_user_summary(user_id)` → profile summary, goal, completed workouts count, meals logged count, AI requests count.
   These return **aggregates/minimal fields only** — never passwords, tokens, AI conversation text, meal contents or any secrets.
2. Frontend: `/admin` dashboard (KPI cards + optional chart; loading/empty/error per widget), `/admin/users` (search, goal filter, pagination), `/admin/users/:id` (read-only summary cards).

**9d acceptance:** non-admin calling any admin RPC gets an error (demonstrate); no sensitive data is exposed; pagination works.

---

## Out of scope (whole phase)
User suspend/restore, audit logs, analytics pages, notifications, settings/feature flags, workout program management, AI monitoring pages, muscle/equipment/activity management.

## Overall acceptance criteria
- [ ] Only admins can write `exercises`/`foods` or call admin RPCs; verified with a normal user account.
- [ ] Users cannot escalate their own role.
- [ ] Publish/archive rules work; nothing is hard-deleted.
- [ ] Admin screens match the Stitch designs and handle loading/empty/error states.
- [ ] `typecheck`, `build`, `test` pass.

## Report
Use the template in `AGENTS.md` §9 after **each step** (9a, 9b, 9c, 9d) and stop after each.
