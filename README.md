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

8. Apply only `supabase/migrations/009_ai_coach.sql` in the Supabase SQL
   Editor after migrations `001` through `008` are already applied. Do not
   re-run any earlier migration. This adds the RLS-protected coach conversation
   and message tables.
9. Apply only `supabase/migrations/010_admin.sql` in the Supabase SQL Editor
   after migrations `001` through `009` are already applied. Do not re-run an
   earlier migration. This adds the `is_admin()` helper and admin-only
   exercise/food writes.

## Creating the first admin

After applying `010_admin.sql`, create the first admin manually in the
Supabase SQL Editor. Replace the placeholder with the user's Auth UUID from
the Supabase Authentication users page:

```sql
update public.profiles
set role = 'ADMIN'
where id = '<user-uuid>';
```

The `profiles_prevent_role_change` trigger continues to prevent a signed-in
user from changing their own role. The SQL Editor operation above is an
administrator operation, not a client request.

## Admin authorization verification

These are verification statements only; they were not run by this
implementation. Run them with a normal authenticated user's session, an admin
authenticated user's session, and an anonymous session as indicated. Replace
the UUID and slug values with records in your project.

```sql
-- Normal authenticated user: both writes must fail with an RLS error.
insert into public.exercises
  (name, slug, description, instructions, primary_muscle, equipment,
   difficulty, movement_pattern, safety_notes)
values
  ('Unauthorized exercise', 'unauthorized-exercise', 'Test', '{Test}',
   'chest', 'bodyweight', 'beginner', 'push', 'Test');

update public.exercises
set name = 'Unauthorized edit'
where slug = '<published-or-draft-slug>';

insert into public.foods
  (name, slug, category, serving_size, unit, calories, protein, carbs, fat)
values
  ('Unauthorized food', 'unauthorized-food', 'Test', 1, 'piece', 1, 0, 0, 0);

update public.foods
set name = 'Unauthorized food edit'
where slug = '<published-or-draft-food-slug>';

-- Normal authenticated user: role escalation must fail.
update public.profiles
set role = 'ADMIN'
where id = auth.uid();

-- Normal authenticated user: the helper is callable but must return false.
select public.is_admin();

-- Anonymous session: this call must fail because execute is revoked.
select public.is_admin();

-- Admin authenticated user: this must return true and the admin writes above
-- must be allowed when their values satisfy the table constraints.
select public.is_admin();
```

The `is_admin()` function never exposes profile or Auth data; it only returns a
boolean. No delete grant or delete policy is provided for exercises or foods,
so content must be archived instead.

## Checks

Run `npm run typecheck`, `npm run build`, and `npm test` in both `web` and
`server`.

## AI Coach limits and safety

`AI_DAILY_LIMIT` defaults to 10 successful workout-generation requests per
user per UTC calendar day. `AI_COACH_DAILY_LIMIT` defaults to 20 successful
coach requests per user per UTC calendar day. Provider failures, invalid
provider responses, validation failures, and requests rejected by the limiter
are logged when applicable but do not consume either limit. No model name is
hardcoded; the server reads `AI_MODEL`.

The coach is read-only. It can store user and assistant messages, but model
output has no write path to workout, nutrition, profile, weight, or session
records. Prompts contain compact structured context only, omit identity and
secrets, delimit user-controlled text as data, and instruct the provider to
give general fitness guidance rather than medical advice.

## AI Coach RLS verification

Apply `supabase/migrations/009_ai_coach.sql` once, then run these checks in the
Supabase SQL Editor with two authenticated sessions. Replace the UUID with
User A's ID. These statements are verification queries and were not run by
this repository implementation.

```sql
-- As User A: both inserts omit user_id and must use auth.uid().
insert into public.ai_conversations (title)
values ('Test conversation')
returning id, user_id, title;

insert into public.ai_messages (conversation_id, role, content)
values ('<user-a-conversation-id>', 'user', 'Test message')
returning id, user_id, conversation_id;

-- As User B: User A's conversation must not be readable.
select * from public.ai_conversations
where id = '<user-a-conversation-id>';

-- As User B: inserting into User A's conversation must be rejected by RLS.
insert into public.ai_messages (conversation_id, role, content)
values ('<user-a-conversation-id>', 'user', 'Should be blocked');

-- As User B: direct ownership spoofing must also be rejected.
insert into public.ai_conversations (user_id, title)
values ('<user-a-uuid>', 'Should be blocked');
```

The context sent to the model contains no email, user ID, token, or model
secret. A redacted example is:

```json
{
  "goal": "build_muscle",
  "experience": "beginner",
  "targets": {"calories": 2200, "protein_g": 140, "carbs_g": 250, "fat_g": 70},
  "todays_planned_workout": {"name": "Full Body", "muscle_focus": "chest", "completed": false},
  "last_7_days_sessions": {"completed": 2, "planned": 3},
  "todays_nutrition": {"calories": 1300, "protein_g": 82, "carbs_g": 150, "fat_g": 40},
  "latest_weight_kg": 70,
  "weight_change_7d_kg": -0.5,
  "recent_messages": [{"role": "user", "content": "[redacted]"}],
  "response_locale": "en"
}
```

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
