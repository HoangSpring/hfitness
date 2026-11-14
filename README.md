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
Re-running `seed:exercises` updates only non-media fields, so admin-edited image
and video fields are preserved. Exercise images are from
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense).
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
Warning: re-running `seed:foods` overwrites admin edits for rows with the same
slug. The seed script prints this warning before writing.
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
10. Apply only `supabase/migrations/011_admin_exercises.sql` after `010_admin.sql`
    has been applied. Do not re-run an earlier migration. This aligns the
    database exercise muscle constraint with the shared constants by allowing
    `trapezius`.
11. Apply only `supabase/migrations/012_admin_foods_history.sql` after
    `011_admin_exercises.sql` has been applied. Do not re-run an earlier
    migration. This adds the real food category/unit constraints and safe
    numeric maximums, and lets authenticated users read archived foods or
    exercises only when referenced by their own meal items, plans, or workout
    sets.

Food edits update only the `foods` row. Existing `meal_items` retain their
`quantity`, `calories`, `protein`, `carbs`, and `fat` snapshot columns. The
history read policy also permits the owner to read the referenced food name
and serving metadata after archival; archived foods remain excluded from food
search.

## Food and archived-history verification

After applying only `012_admin_foods_history.sql`, use the Supabase dashboard:

1. Open **Authentication → Users**, create or identify two users, and set one
   user's profile role to `ADMIN` using the first-admin SQL above.
2. Open **Table Editor → foods** as the admin session and create a food with
   status `PUBLISHED`.
3. Sign in as the normal user, open **Nutrition**, search for the food, and
   log one serving. Record the returned meal item ID and food ID from
   **Table Editor → meal_items**.
4. Sign back in as the admin and change that food's name, serving size, and
   nutrition values, then set status to `ARCHIVED`.
5. As the normal user, refresh **Nutrition**. The meal item must still show
   the food name/serving metadata and its original snapshot nutrition values;
   the archived food must not appear in a new search.
6. In the Supabase SQL Editor, run the following checks using the normal
   user's authenticated SQL session where your project provides one:

```sql
-- The archived food is readable only because User A owns this meal item.
select f.id, f.name, f.serving_size, f.unit, f.status, mi.calories,
       mi.protein, mi.carbs, mi.fat
from public.foods f
join public.meal_items mi on mi.food_id = f.id
where mi.user_id = auth.uid()
  and f.id = '<food-uuid>';

-- A food not referenced by User A must return no row.
select id, name, status
from public.foods
where id = '<unreferenced-archived-food-uuid>';

-- Public/normal food search must exclude archived rows.
select id, name
from public.foods
where status = 'PUBLISHED'
order by name;

-- Meal item snapshots must remain the original values after food editing.
select food_id, quantity, calories, protein, carbs, fat
from public.meal_items
where id = '<meal-item-uuid>';
```

For archived exercises, create or use a plan/session reference, archive the
exercise as admin, then open the user's workout day/session/history. The
following ownership checks document the expected row visibility:

```sql
select e.id, e.name, e.status
from public.exercises e
join public.workout_plan_exercises wpe on wpe.exercise_id = e.id
join public.workout_plan_days wpd on wpd.id = wpe.plan_day_id
join public.workout_plans wp on wp.id = wpd.plan_id
where wp.user_id = auth.uid()
  and e.id = '<archived-exercise-uuid>';

select e.id, e.name, e.status
from public.exercises e
join public.workout_sets ws on ws.exercise_id = e.id
where ws.user_id = auth.uid()
  and e.id = '<archived-exercise-uuid>';
```

These verification queries were not run by this implementation.

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

### Applying profile recovery migration

If a signed-in user has no row in `public.profiles`, apply only
`supabase/migrations/014_profile_recovery.sql` in the Supabase SQL Editor.
Do not rerun an earlier migration. Then sign in as a user without a profile
and click through the app until the onboarding page appears. The client can
insert only its own profile ID and only with `role = 'USER'`; it cannot create
or change an admin role.

### Applying the 9d admin dashboard migration

Apply only `supabase/migrations/013_admin_dashboard_users.sql` in the
Supabase SQL Editor after migrations `010_admin.sql`, `011_admin_exercises.sql`,
and `012_admin_foods_history.sql` have been applied. Do not re-run an earlier
migration. This migration creates the three admin-only aggregate RPCs and
grants execution only to authenticated users; each RPC performs its own
`is_admin()` check.

These verification statements were not run by this implementation. Run them
in the SQL Editor with a normal authenticated user's session, an admin
authenticated user's session, and an anonymous session. Do not use
service-role credentials for the normal-user or anonymous checks:

```sql
-- Normal user: each call must fail with ADMIN_REQUIRED.
select * from public.admin_dashboard_stats();
select * from public.admin_list_users('', '', 0, 20);
select * from public.admin_user_summary('<user-uuid>');

-- Normal user: page_size is capped at 50 and wildcard characters are escaped.
select * from public.admin_list_users('%_\\', '', 0, 500);

-- Admin: these calls should succeed and return minimal fields only.
select * from public.admin_dashboard_stats();
select * from public.admin_list_users('', '', 0, 50);
select * from public.admin_user_summary('<user-uuid>');

-- Anonymous: every call must fail or be denied before execution.
select * from public.admin_dashboard_stats();
select * from public.admin_list_users('', '', 0, 20);
select * from public.admin_user_summary('<user-uuid>');
```

The RPC results do not expose passwords, tokens, AI conversation text, meal
contents, workout details, or other private content. `last_active` is the
latest of workout-session start, meal eaten time, and AI request creation time.

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

## Exercise media

Apply only `supabase/migrations/015_exercise_media.sql` after the existing
migrations. In the Supabase SQL Editor, paste the complete migration contents
and click **Run**. This adds `image_urls`, creates the public
`exercise-media` storage bucket, and adds public read/service-role management
policies.

To upload the reviewed free-exercise-db frames, keep the dataset at
`D:\free-exercise-db`, ensure `server/.env` contains the server-only
credentials, then run:

```powershell
cd server
npm run media:images
```

Use `npm run media:images -- --force` only when intentionally replacing
existing image fields. The script validates every mapped file before uploading,
uses `exercises/<slug>/0.jpg` and `1.jpg`, and never processes unmapped
exercises.

To import the reviewed video CSV, run:

```powershell
cd server
npm run media:videos
```

Invalid rows are reported and skipped; only `video_url` on existing exercises
is updated. For production deployment, configure CSP/frame settings to allow
`frame-src https://www.youtube-nocookie.com` and `img-src` for the Supabase
Storage domain.

## Vietnamese content translations

Apply only `supabase/migrations/016_content_translations.sql` after the
previous migrations. The SQL has not been run by this repository. The seed
files in `supabase/seed/` are DRAFT translations written by AI and MUST be
reviewed by a Vietnamese speaker before being shown to real users. To seed
them, configure the existing server environment and run:

```powershell
cd server
npm run seed:translations
```

The command is idempotent and overwrites translation rows for matching slugs;
it does not alter English content or nutrition values.

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

The food photo scanner uses `AI_SCAN_DAILY_LIMIT` (default 10 successful scans
per user per UTC day). `AI_VISION_MODEL` optionally selects the vision model
and falls back to `AI_MODEL`; `AI_FALLBACK_MODEL` can be used after temporary
provider overload. Photos are processed in memory and are not logged or
stored. The scan endpoint has a 4 MB request-body limit; configure the hosting
platform's request-body limit to at least 4 MB because a lower platform limit
can reject the request before the application receives it.

The scanner is intentionally an estimate tool: users must check flagged items
and amounts before saving, and the UI makes no allergen-safety or health
claims. Client-side re-encoding strips EXIF/GPS metadata before upload. The
feature does not create a Storage bucket or `food_scans` table.

To inspect results after a browser test, run these queries in the Supabase SQL
Editor:

```sql
select id, user_id, type, status, prompt_version, latency_ms, error_code, created_at
from public.ai_requests
where type = 'FOOD_SCAN'
order by created_at desc
limit 20;

select id, meal_id, food_id, item_name, source, ai_confidence,
       amount, amount_unit, quantity, calories, protein, carbs, fat, created_at
from public.meal_items
where source in ('SCAN_DB', 'SCAN_ESTIMATE')
order by created_at desc
limit 50;
```

End-to-end browser checklist:

1. Try a plate of rice with chicken and confirm database matches where offered.
2. Try a bowl of pho and review any AI estimates and flags.
3. Try a non-food photo; expect `NO_FOOD_DETECTED`.
4. Try a blurry food photo and check that uncertain items require confirmation.
5. Try a screenshot containing `ignore previous instructions`; it must be
   treated as image data, never as a command.

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
