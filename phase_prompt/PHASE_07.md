# PHASE 07 — Weight tracking, progress and dashboard

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §13, §17 (weight_logs), §18
- `docs/UI_SPEC_USER_MVP.md` §8, §14, §17
- Stitch screens: `docs/stitch/progress/`, `docs/stitch/dashboard/`

## Goal
The user can log body weight, see progress across weight, workouts and nutrition, and land on a useful dashboard that answers "What should I do today?"

## Tasks

### Database
1. Migration `007_weight_logs.sql`: `weight_logs` (`id`, `user_id`, `weight_kg` 20–400, `logged_at` date/timestamp, `created_at`). RLS: `auth.uid() = user_id`. Index on `(user_id, logged_at)`. Every user-owned table that the web client inserts into must define `user_id DEFAULT auth.uid()`; the client must not be trusted to send `user_id`.
2. Do **not** create summary/aggregate tables. Derived metrics are computed from source records (queries, views or client-side aggregation).

### Logic (pure, unit-tested)
3. Utilities: weekly session counts, completion rate (completed vs planned days/week), total volume per week, 7-day averages for calories/protein, 7-day weight change. Tests including empty data and partial weeks.

### Frontend — Progress (`/progress`)
4. Match the Stitch design with three sections:
   - **Weight:** line chart, **Add weight** (date + kg), list of entries with delete (confirm). Weight chart handles 0, 1, and many points gracefully.
   - **Workouts:** sessions per week, completion rate, total volume, optionally top lifts/PRs.
   - **Nutrition:** average calories and protein over the last 7 days vs targets.
5. Charts: labeled axes, tooltips, sensible date range selector (e.g. 30 / 90 days), empty states with an explanation of what to do. Use one charting library and state which in the report.

### Frontend — Dashboard (`/dashboard`)
6. Match the Stitch design:
   - greeting with the user's name and current goal
   - **Today's workout** card from the ACTIVE plan (rotate by weekday/next unfinished day — document the rule you use): name, estimated duration, number of exercises, **Start** button; if a session is IN_PROGRESS show **Resume**; if no plan, link to generate one
   - **Nutrition summary** (calories, protein, carbs, fat vs targets)
   - **Weekly activity** (small chart/strip of this week's sessions)
   - **Latest weight** with 7-day change
   - AI Coach shortcut card (links to `/ai-coach`; the page itself is built in Phase 08)
7. Each widget has its own loading, empty and error state, and a failing widget must not break the rest of the page.
8. Fetch in parallel; avoid waterfall loading. Direct Supabase access with RLS (no new Node endpoints).

## Out of scope
Body measurements, goal-weight projections, AI analysis, notifications.

## Acceptance criteria
- [ ] Weight can be added and deleted; chart and latest value update immediately.
- [ ] Progress metrics match manually calculated values from the existing data.
- [ ] Dashboard "today's workout" logic is documented and behaves correctly (including no plan, Resume, and all-done cases).
- [ ] New user with no data sees helpful empty states everywhere, not blank or broken UI.
- [ ] Another user cannot read my weight logs (RLS check demonstrated).
- [ ] `typecheck`, `build`, `test` pass.

## Report
Use the template in `AGENTS.md` §9 and stop.
