# HFitness

HFitness is an AI-powered gym and nutrition web app built with React, Express,
TypeScript, and Supabase.

## Setup

1. Copy `web/.env.example` to `web/.env` and fill in the Supabase URL and
   publishable key.
2. Copy `server/.env.example` to `server/.env` and fill in the Supabase URL,
   publishable key, and server-only secret key.
3. Apply `supabase/migrations/001_profiles.sql`, `002_fitness_assessments.sql`,
   and `003_exercises.sql` in the Supabase SQL Editor, in that order. The
   migration grants only public read access to published exercises; it does not
   grant public write access.
4. Run the idempotent exercise seed from the `server` directory. It reads the
   server-only Supabase credentials from `server/.env`, validates every row
   before writing, upserts by `slug`, and prints the status counts:

```powershell
cd server
npm run seed:exercises
```

The two `ZZ Hidden...` rows are deliberately DRAFT/ARCHIVED and should not
appear in the public library. Never print or commit the service-role key.
5. Apply only the next migration, `supabase/migrations/007_foods_meals.sql`, after
   the earlier migrations have been applied. Then seed the approximate food data
   from the `server` directory:

```powershell
cd server
npm run seed:foods
```

The food values are hand-written **APPROXIMATE** values and have not been
verified. The seed validates rows, warns about large calorie/macro differences,
and upserts by slug. Never print or commit the service-role key.
6. Apply only `supabase/migrations/008_weight_logs.sql` in the Supabase SQL
   Editor after the earlier migrations are already applied. Do not re-run an
   earlier migration. This creates the RLS-protected weight log table and
   grants `select`, `insert`, `update`, and `delete` to `authenticated` only.
7. Install dependencies and start both applications:

```powershell
cd web
npm install
npm run dev
```

```powershell
cd server
npm install
npm run dev
```

The web app runs at `http://localhost:5173` and the API at
`http://localhost:3001`.

## Checks

Run `npm run typecheck`, `npm run build`, and `npm test` in both `web` and
`server`.

## Progress metric definitions

- Weeks start on Monday. The web app creates Monday-to-Sunday boundaries from
  the user's local browser date, so a week crossing a month boundary remains
  one local week.
- Completion rate is completed sessions this week divided by the profile's
  `days_per_week`, capped at 100%.
- 7-day weight change is the latest entry minus the closest entry at least
  seven days older. If no such entry exists, the UI shows **Not enough data**
  rather than zero.
- Nutrition averages use only days with at least one logged meal. The UI also
  shows `Days logged X of 7` and compares the averages with the latest
  assessment targets. Without targets, it shows an empty state.
- For bodyweight workouts, a period where every logged weight is zero (or
  empty) is displayed as total reps rather than `0 kg`.
- The dashboard workout rule is: resume an `IN_PROGRESS` session; otherwise
  choose the day after the most recent `COMPLETED` session, wrapping around
  the active plan's day list; choose day 1 when there is no completed session.
  Without an active plan, the dashboard links to `/workout` to generate one.
  Any day remains startable from `/workout`.

## Weight log SQL verification

Run the following checks in the Supabase SQL Editor using two authenticated
sessions (User A and User B). Replace the UUID and JWT setup with the SQL
Editor authentication mechanism available in your project; these statements
are verification queries, not migration steps.

```sql
-- As User A: user_id is omitted and defaults to auth.uid().
insert into public.weight_logs (weight_kg, logged_on)
values (72.5, current_date)
returning id, user_id, weight_kg, logged_on;

-- As User A: the same date updates the existing row instead of creating one.
insert into public.weight_logs (weight_kg, logged_on)
values (71.9, current_date)
on conflict (user_id, logged_on)
do update set weight_kg = excluded.weight_kg
returning id, user_id, weight_kg, logged_on;

-- As User B: User A's row must not be visible or mutable.
select * from public.weight_logs where user_id = '<user-a-uuid>';
update public.weight_logs set weight_kg = 70 where user_id = '<user-a-uuid>';
```
