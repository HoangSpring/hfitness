# PHASE 02 — Onboarding, profile, fitness assessment

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §7, §8, §16 (Fitness), §17 (profiles, fitness_assessments), §18, §19
- `docs/UI_SPEC_USER_MVP.md` §7 (Onboarding, Analyzing), §16 (Profile), §17
- Stitch screens: `docs/stitch/onboarding/`, `docs/stitch/profile/`

## Goal
After registering, the user completes a 5-step onboarding. The backend calculates BMR/TDEE/calorie and macro targets deterministically and stores them as a historical snapshot. The user can later edit their profile.

## Tasks

### Database
1. Migration `002_fitness_assessments.sql`: table `fitness_assessments` (`id`, `user_id`, input snapshot fields: age, gender, height_cm, weight_kg, goal, experience, days_per_week; results: `bmr`, `tdee`, `calorie_target`, `protein_g`, `carbs_g`, `fat_g`; `formula_version`; `created_at`). RLS: user can `SELECT` own rows; inserts are done by the server (user JWT with an INSERT policy `auth.uid() = user_id`).
2. Make sure `profiles` has all onboarding columns (goal, experience, days_per_week, session_minutes, equipment text[], allergies text[], disliked_foods text[], meals_per_day, age, gender, height_cm, weight_kg). Add a migration only if something is missing.

### Backend (pure logic first)
3. `server/src/lib/constants/fitness.ts`: all formula constants (activity factors, goal adjustments, protein g/kg per goal, fat %, calorie floor per gender, `FORMULA_VERSION = "v1"`). Add comments explaining each constant (these will be explained in the project report).
4. `server/src/services/fitness.service.ts` — **pure functions**: `calculateBmr` (Mifflin–St Jeor), `calculateTdee`, `calculateTargets`. Clamp calories to the safety floor. Ensure `protein×4 + carbs×4 + fat×9 ≈ calories` (small rounding tolerance).
5. Zod input schema (age 14–90, height 120–230 cm, weight 30–250 kg, enums for goal/experience/gender, days 1–7).
6. Endpoints (protected):
   - `POST /api/v1/fitness/assessment` — reads the user's profile, calculates, **inserts a new row**, returns it.
   - `GET /api/v1/fitness/assessment` — latest assessment or 404 `ASSESSMENT_NOT_FOUND`.
7. **Unit tests** for the calculation (male/female, each goal, calorie floor, macro/calorie consistency, invalid input).

### Frontend
8. Onboarding at `/onboarding`, 5 steps (Goal → Basic info → Training → Equipment → Nutrition preferences), progress indicator, Back/Continue, per-step Zod validation, state preserved when going back. Match the Stitch design.
9. On finishing: save the profile (`onboarding_completed = true`), call `POST /fitness/assessment`, then go to `/analyzing`.
10. `/analyzing`: progress screen with the steps from the spec. In this phase it only waits for the assessment call; leave a clearly marked hook where Phase 04 will call workout generation. Never show a "done" state before the call finishes; on failure show a message and **Retry**.
11. Redirect rules: logged-in user with `onboarding_completed = false` → `/onboarding`; completed users opening `/onboarding` → `/dashboard`.
12. `/profile`: grouped cards (Personal, Body, Goal, Training, Nutrition, Equipment) with edit + Save; if body/goal fields changed, offer to **recalculate targets** (calls `POST /fitness/assessment`). Logout button.
13. Show the user's current targets (calories, protein, carbs, fat) on the profile page.

## Out of scope
AI workout generation, dashboard content, nutrition logging, password reset.

## Acceptance criteria
- [ ] New user is forced through onboarding; completed user is not.
- [ ] Assessment rows are inserted (never overwritten) and the latest one is returned by GET.
- [ ] Calculations match hand-checked examples in the tests; calorie floor is enforced.
- [ ] User cannot read another user's assessments (RLS check demonstrated).
- [ ] Profile edits persist; recalculating creates a new assessment row.
- [ ] Forms validate inline and keep values after errors.
- [ ] `typecheck`, `build`, `test` pass.

## Report
Use the template in `AGENTS.md` §9 and stop.
