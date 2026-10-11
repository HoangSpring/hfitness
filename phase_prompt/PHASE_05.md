# PHASE 05 — Workout sessions and history

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §11, §17 (workout_sessions, workout_sets), §18
- `docs/UI_SPEC_USER_MVP.md` §10 (Start button), §11, §12, §17
- Stitch screens: `docs/stitch/active-workout/`, `docs/stitch/workout-history/`

## Goal
The user can start a workout from the active plan, log real sets, finish or abandon the session, see a summary with volume and personal records, and browse history.

## Tasks

### Database
1. Migration `005_workout_sessions.sql`:
   - `workout_sessions` (`id`, `user_id`, `plan_day_id` nullable, `status` `IN_PROGRESS|COMPLETED|ABANDONED`, `started_at`, `finished_at`, `notes`).
   - `workout_sets` (`id`, `session_id`, `user_id`, `exercise_id`, `set_number`, `weight_kg`, `reps`, `rpe` nullable, `created_at`). Add CHECK constraints (weight >= 0, reps 1–100, rpe 1–10).
2. RLS: `auth.uid() = user_id` on both tables. For `workout_sets`, the `WITH CHECK` must also confirm the referenced session belongs to the same user.
3. Partial unique index: a user can have **at most one IN_PROGRESS session**.

### Logic (pure, unit-tested)
4. Utilities in `web/src/lib/` (or shared): `calculateVolume(sets)` = Σ weight × reps, `findPersonalRecords(currentSets, previousSets)` (heaviest weight per exercise; compare with all earlier completed sessions), `calculateDuration`.
5. Unit tests for the three utilities, including empty sessions and ties.

### Frontend
6. **Start Workout** (on `/workout` and `/workout/day/:dayId`): creates a session from the plan day (or resumes the existing IN_PROGRESS one) and navigates to `/workout/session/:sessionId`.
7. `/workout/session/:sessionId` — match the Stitch design; mobile-first, large touch targets, minimal distraction:
   - progress (exercise X of Y), current exercise name, target sets × reps, **previous performance** for that exercise (latest completed session)
   - set rows with weight, reps, optional RPE, **Complete** button; edit and delete a set; **Add set**
   - rest timer starts after completing a set (frontend only; uses the planned rest seconds; can be skipped)
   - Next/Previous exercise navigation
   - **Finish workout** (confirm if there are exercises with no logged sets) and **Abandon** (confirmation modal)
   - input is saved as the user goes (no data loss on refresh)
8. Completion summary (same route or a clear view after finishing): duration, completed exercises, total sets, total volume, personal records, buttons **Done** and **View history**.
9. `/workout/history`: list of completed sessions (date, workout name, duration, total volume), newest first, with pagination or load more; tapping opens a read-only summary. Loading, empty ("No workouts yet") and error states.
10. All data access goes through the Supabase client with RLS (no new Node endpoints). Wrap multi-step writes sensibly and handle errors with a visible message.
11. Block starting a second session while one is IN_PROGRESS (offer Resume / Abandon).

## Out of scope
Replacing exercises mid-session, editing past sessions, charts (Phase 07), AI.

## Acceptance criteria
- [ ] A full flow works: start → log several sets (including edit/delete/add) → finish → summary → appears in history.
- [ ] Abandoned sessions are not shown as completed and do not count toward volume.
- [ ] Only one IN_PROGRESS session per user (enforced by the database).
- [ ] Refreshing the page mid-session keeps all logged sets.
- [ ] Another user cannot read or write my sessions or sets (RLS check demonstrated).
- [ ] Volume and PR logic covered by tests.
- [ ] `typecheck`, `build`, `test` pass.

## Report
Use the template in `AGENTS.md` §9 and stop.
