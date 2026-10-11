# PHASE 04 — AI workout plan (generate, review, activate)

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §10, §15, §16, §17 (plan tables, ai_requests), §18
- `docs/UI_SPEC_USER_MVP.md` §7 (Analyzing), §10, §17
- Stitch screen: `docs/stitch/workout-plan/`

## Goal
The app generates a workout plan with AI, validates it strictly against the exercise database, saves it as a DRAFT, lets the user review it, and activates it.

> This is the riskiest phase. Build in this order: provider → validation (with tests) → endpoints → UI. If you run low on budget, stop at a stable point and report what remains.

## Tasks

### Database
1. Migration `004_workout_plans.sql`: `workout_plans` (`id`, `user_id`, `name`, `goal`, `source` `AI|MANUAL`, `status` `DRAFT|ACTIVE|ARCHIVED`, `created_at`), `workout_plan_days` (`id`, `plan_id`, `day_index`, `name`, `muscle_focus`), `workout_plan_exercises` (`id`, `plan_day_id`, `exercise_id`, `position`, `sets`, `reps_min`, `reps_max`, `rest_seconds`, `notes`). RLS: users read/write only their own plans (children checked through the parent).
2. A partial unique index so a user has **at most one ACTIVE plan**.
3. Migration for `ai_requests` (`id`, `user_id`, `type`, `prompt_version`, `status`, `latency_ms`, `error_code`, `created_at`). RLS: users cannot insert/update; the server writes with the service-role client. Users may read their own rows.

### AI infrastructure (server/src/lib/ai/)
4. Provider abstraction with `generateText()` and `generateStructured(prompt, zodSchema)`, configured by `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`. Timeouts and clean error mapping (provider failure → 502 `AI_PROVIDER_ERROR`).
5. Versioned prompt constant `WORKOUT_GENERATOR_V1`. User-provided text (e.g. disliked foods are not needed here; keep only structured profile fields) must be clearly delimited as data, never as instructions.
6. Rate limiter: count the user's `ai_requests` for the current day; if `>= AI_DAILY_LIMIT` return 429 `AI_RATE_LIMIT`. Log every AI call to `ai_requests` (status, latency, error code). Never log keys, tokens or full prompts.

### Workout generation
7. `POST /api/v1/ai/workout/generate`:
   - Load profile + latest assessment (error if onboarding/assessment is missing).
   - Retrieve **eligible exercises**: `PUBLISHED` and equipment compatible with the user's equipment. Send only `id`, `name`, `primary_muscle` to the AI.
   - Ask the AI for structured JSON; parse with Zod.
   - Run **business validation** (see below). On failure retry up to **2 attempts total**, then return 422 `WORKOUT_GENERATION_FAILED` (optionally fall back to a simple template plan built in code).
   - Save as `DRAFT`, return the full plan.
8. Business validation (a pure, unit-tested module):
   - every `exercise_id` exists, is `PUBLISHED`, and equipment is compatible
   - number of days equals `days_per_week`
   - 3–8 exercises per day
   - sets 1–6, reps 1–30 (`reps_min <= reps_max`), rest 20–300 s
   - estimated duration within ±25% of `session_minutes` (use a documented estimate formula)
   - the same primary muscle is not the focus of consecutive days
   - no duplicate exercise within one day
9. Other endpoints: `GET /api/v1/workout-plans/:id` (own plan only), `POST /api/v1/workout-plans/:id/activate` (only DRAFT; archives the previous ACTIVE plan in one transaction).
10. **Unit tests** for validation covering: unknown exercise id, DRAFT/ARCHIVED exercise, equipment mismatch, wrong day count, bad sets/reps, consecutive muscle days, invalid JSON from the AI, retry exhaustion, rate limit.

### Frontend
11. Wire `/analyzing` (from Phase 02) to call generation after the assessment; show real progress, retry on failure, and a "Continue without a plan" option that goes to the dashboard.
12. `/workout`: current plan (name, goal, frequency), weekly schedule as day cards (day, focus, number of exercises, estimated duration), loading/empty/error states.
    - No plan → empty state with **Generate my plan**.
    - DRAFT plan → banner with **Review & Activate** and **Regenerate** (regenerating creates a new draft; the old draft is archived or replaced).
    - ACTIVE plan → normal view; the "Start Workout" button may be disabled until Phase 05, with a clear label.
13. `/workout/day/:dayId`: title, duration, exercise list with sets × reps, rest. Exercise names link to `/exercises/:slug`.
14. Friendly message for 429 (daily limit) and 422 (generation failed).

## Out of scope
Replacing exercises, manual plan editing, re-plan, session logging, AI Coach.

## Acceptance criteria
- [ ] Generation never saves an invalid plan; unknown/unsuitable exercises are rejected (tests prove it).
- [ ] At most 2 AI attempts per request; failures produce clear errors.
- [ ] A user has only one ACTIVE plan; activating a new one archives the old one.
- [ ] Another user cannot read or activate my plan (RLS/ownership check demonstrated).
- [ ] Daily AI limit returns 429 and every AI call appears in `ai_requests`.
- [ ] No API key in the frontend or logs.
- [ ] `typecheck`, `build`, `test` pass.

## Report
Use the template in `AGENTS.md` §9 and stop. Include a sample (redacted) generated plan and which provider/model you used.
