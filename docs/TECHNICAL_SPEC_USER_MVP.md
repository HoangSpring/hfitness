# TECHNICAL SPEC — USER (MVP)
## AI Fitness & Nutrition Platform — Course Project Edition

Version: 1.0-MVP  
Scope: User-facing product only. Reduced from the full spec so it can be finished in one semester with a free-tier coding agent.

---

## 1. Product Goal

A web app where a user can:
- Complete onboarding and get calorie/macro targets (calculated by formula).
- Browse an exercise library.
- Get an AI-generated gym plan, review it, and activate it.
- Log real workouts (sets, reps, weight) and see history.
- Log meals manually against daily targets.
- Track body weight.
- Ask an AI Coach contextual questions.

Core loop:

`Onboarding → Targets → Workout plan → Log workouts + meals → Progress → Ask AI Coach`

Core principle:

> AI recommends. Backend validates. Database stores truth. User approves meaningful changes.

---

## 2. Scope

### In scope (MVP)
- Auth (register / login / logout)
- Onboarding + profile
- Fitness assessment (BMR / TDEE / macros, deterministic)
- Exercise library (read-only for users)
- AI workout plan generation (DRAFT → user review → ACTIVE)
- Workout session logging + history
- Food search + manual meal logging + daily targets
- Weight logging + simple progress + dashboard
- **One** extra AI feature: AI Coach (read-only advice)
- Minimal admin (see Admin spec)

### Out of scope (future work — mention in report)
- AI nutrition plan
- AI food photo scanner (can replace AI Coach as the single extra AI feature if preferred)
- Re-plan engine and recommendation accept/reject workflow
- AI progress analysis
- Body measurements (only weight is tracked)
- Exercise alternatives / replace-exercise during session
- Data export and account deletion UI
- Notifications, analytics, audit logs, observability dashboards
- Multi-sport support (Gym/Strength only)

---

## 3. Technology Stack

- **Frontend:** React, TypeScript, Vite, React Router, Zod
- **Backend:** Node.js, TypeScript, Express (or similar), Zod — used only for logic-heavy endpoints (see §4)
- **Database / Auth / Storage:** Supabase (PostgreSQL, Auth, RLS)
- **AI provider:** any provider with a usable free tier (e.g. Gemini). Model and API key come from environment variables.
- **Deployment:** Frontend on Vercel; backend on any free Node-compatible host (or serverless functions).

---

## 4. Architecture Decision (simplified)

To keep the codebase small:

| Type of operation | How it is done |
|---|---|
| Simple CRUD on user-owned data (meals, weight logs, workout sets, profile) | Frontend → Supabase client directly, protected by **RLS** |
| Public/read data (exercises, foods) | Frontend → Supabase client directly (RLS allows read of PUBLISHED rows) |
| Logic-heavy or secret-holding operations | Frontend → **Node API** (verifies Supabase JWT) |

Node API is responsible for only:
1. Fitness assessment calculation
2. AI workout plan generation
3. Plan activation
4. AI Coach
5. Any admin-only aggregation that cannot be done safely with RLS

The full Route → Controller → Service → Repository layering is **not required**. Use a simple `routes / services / lib` structure.

Security rule that still applies:

> Frontend route guards are UX only. Authorization is enforced by RLS and by the Node API verifying the Supabase access token.

---

## 5. User Routes

### Public
- `/` — landing
- `/exercises`
- `/exercises/:slug`

### Auth
- `/login`
- `/register`

### Onboarding
- `/onboarding`
- `/analyzing`

### App
- `/dashboard`
- `/workout` — current plan + weekly schedule + recent workouts
- `/workout/day/:dayId` — plan day detail
- `/workout/session/:sessionId` — active workout
- `/workout/history`
- `/nutrition` — today's targets, meal list, add food
- `/progress` — weight + workout summary
- `/ai-coach`
- `/profile` — profile + preferences + logout

### System
- `/404`

---

## 6. Authentication

Supabase Auth handles registration, login, logout and session tokens.

- Email confirmation can be disabled during development.
- Password reset is optional (use Supabase default flow if time allows).
- Node API must verify the Supabase access token on every request.

---

## 7. Onboarding & Profile

Onboarding is required before entering the app (`profiles.onboarding_completed = true`).

### Steps (5)
1. **Goal** — lose weight / gain weight / build muscle / get stronger / maintain
2. **Basic info** — age, gender, height (cm), weight (kg)
3. **Training** — experience (beginner / intermediate / advanced), days per week, minutes per session
4. **Equipment** — multi-select (bodyweight, dumbbell, barbell, machine, cable, kettlebell, band)
5. **Nutrition preferences** — allergies, disliked foods, meals per day

On completion the frontend calls `POST /fitness/assessment` and then `/analyzing` → `POST /ai/workout/generate`.

---

## 8. Fitness Assessment (deterministic)

Calculated **by backend code, never by AI**.

- **BMR:** Mifflin–St Jeor
  - Male: `10×kg + 6.25×cm − 5×age + 5`
  - Female: `10×kg + 6.25×cm − 5×age − 161`
- **TDEE:** `BMR × activity factor` (derived from training days/week: ~1.375 / 1.55 / 1.725)
- **Calorie target:** TDEE adjusted by goal (e.g. −15% lose, +10% gain/build, 0% maintain)
- **Protein:** ~1.6–2.2 g/kg depending on goal
- **Fat:** ~25% of calories
- **Carbs:** remaining calories
- **Safety floor:** minimum daily calories (configurable constant, e.g. 1200 female / 1500 male)

Each calculation creates a new row in `fitness_assessments` (history is never overwritten) with input values, results and `formula_version`.

All formula constants live in one `constants` file so they can be explained in the project report.

---

## 9. Exercise Library

- Data comes from the database (seeded from an open dataset such as free-exercise-db — verify its license before use — and editable by admin).
- AI must never invent an exercise.
- Users see only `PUBLISHED` exercises.

Fields: name, slug, description, instructions, primary_muscle, secondary_muscles[], equipment, difficulty, movement_pattern, image_url, video_url, safety_notes, status.

Filters: search, muscle, equipment, difficulty.

---

## 10. AI Workout Plan

Flow:

`Request → Load profile + assessment → Retrieve eligible exercises → AI → Structured JSON → Zod → Business validation → Save DRAFT → User review → Activate`

AI receives: goal, experience, days/week, session minutes, equipment, assessment, and the **eligible exercise list** (id + name + muscle only).

Validation (all must pass):
- Every `exercise_id` exists and is `PUBLISHED`
- Exercise equipment is compatible with the user's equipment
- Sets 1–6, reps 1–30, rest 20–300 s
- Number of days matches the requested frequency
- Exercises per day within a reasonable range (e.g. 3–8)
- Estimated duration is within ±25% of requested session length
- No muscle group is trained on consecutive days (basic recovery rule)

Retry: up to **2 attempts**, then return a clear error (optionally fall back to a simple template plan).

Plan lifecycle: `DRAFT → ACTIVE → ARCHIVED`. A user has at most one ACTIVE plan; activating a new plan archives the previous one.

Plan structure: `workout_plans → workout_plan_days → workout_plan_exercises`.

---

## 11. Workout Session

Planned workout and actual workout are separate records.

User can:
- Start a session from a plan day
- Log a set (weight, reps, optional RPE)
- Edit or delete a set
- Add an extra set
- Use a rest timer (frontend only)
- Finish or abandon the session

On finish, the summary screen shows duration, total sets, total volume (Σ weight × reps), and any personal records (heaviest weight per exercise).

Statuses: `IN_PROGRESS`, `COMPLETED`, `ABANDONED`.

History: list of completed sessions with date, name, duration, volume.

---

## 12. Nutrition

### Targets
Read from the latest `fitness_assessments` row.

### Foods
Seeded table of foods (a few hundred common items, e.g. from USDA FoodData Central or a hand-made CSV). Each food has serving size, unit and per-serving calories / protein / carbs / fat. Users can search and read only `PUBLISHED` foods.

### Meals
User can: search food → choose quantity → add to a meal (breakfast / lunch / dinner / snack) → edit → delete.

Meal items store a **nutrition snapshot** (calories, protein, carbs, fat at the time of logging) so history does not change when a food is edited.

Daily summary = sum of meal items for the selected date vs. targets.

---

## 13. Progress & Dashboard

### Progress (`/progress`)
- Weight log (add / delete) and weight trend chart
- Workout summary: sessions per week, completion rate, total volume
- Nutrition summary: average calories / protein over last 7 days

Derived metrics are computed from source records (no duplicated summary tables).

### Dashboard (`/dashboard`)
- Greeting + goal
- Today's workout card (from active plan)
- Today's nutrition summary
- Weekly workout activity
- Latest weight

---

## 14. AI Coach

Contextual, **read-only** advice. It does not modify any records in the MVP.

Example questions:
- What should I train today?
- Why is my progress slow?
- What should I eat after training?

Context builder sends only relevant data:
- Goal, experience, assessment targets
- Today's planned workout
- Last 7 days of workout completion
- Today's nutrition totals
- Latest weight and 7-day weight change
- Last ~10 messages of the conversation

Answer format: short **recommendation + reason**. The AI is not a doctor; the UI shows a short disclaimer.

---

## 15. AI Common Rules

Provider abstraction (one small file):
- `generateText(prompt, options)`
- `generateStructured(prompt, zodSchema, options)`

Prompts are stored as versioned constants: `WORKOUT_GENERATOR_V1`, `COACH_V1`.

Every AI call is logged in `ai_requests` (type, status, latency, error code, prompt version). No raw secrets or tokens are logged.

**Rate limit:** per-user daily cap on AI requests (configurable, e.g. 10/day), counted from `ai_requests`. Return HTTP 429 when exceeded.

**Safety:**
- AI is not a medical diagnosis system.
- Calorie and workout parameters are bounded by backend constants.
- User text is passed as data, clearly delimited from system instructions (prompt-injection mitigation).
- AI output is never saved or shown as fact until it passes Zod + business validation.

---

## 16. API

Base URL: `/api/v1` (Node API only; simple CRUD goes through Supabase client + RLS).

### Fitness
- `GET /fitness/assessment` — latest
- `POST /fitness/assessment` — calculate and store

### Workout plans
- `POST /ai/workout/generate` — creates DRAFT plan
- `GET /workout-plans/:id`
- `POST /workout-plans/:id/activate`

### AI Coach
- `POST /ai/coach` — body: `{ conversation_id?, message }`

### Response convention

```json
{ "data": {} }
```

```json
{ "error": { "code": "WORKOUT_PLAN_NOT_FOUND", "message": "Workout plan not found." } }
```

HTTP codes used: 200, 201, 400, 401, 403, 404, 422, 429, 500.

### Direct Supabase access (RLS-protected)
- `profiles`, `weight_logs`, `meals`, `meal_items`, `workout_sessions`, `workout_sets`, `ai_conversations`, `ai_messages` — user-owned
- `exercises`, `foods` — read `PUBLISHED`
- `workout_plans`, `workout_plan_days`, `workout_plan_exercises` — read own

---

## 17. Database Tables (15)

| Table | Purpose |
|---|---|
| `profiles` | id (= auth.users.id), display_name, role (`USER`/`ADMIN`), age, gender, height_cm, weight_kg, goal, experience, days_per_week, session_minutes, equipment (text[]), allergies (text[]), disliked_foods (text[]), meals_per_day, onboarding_completed |
| `fitness_assessments` | user_id, inputs, bmr, tdee, calorie_target, protein_g, carbs_g, fat_g, formula_version, created_at |
| `exercises` | see §9 + status |
| `workout_plans` | user_id, name, goal, source (`AI`/`MANUAL`), status (`DRAFT`/`ACTIVE`/`ARCHIVED`), created_at |
| `workout_plan_days` | plan_id, day_index, name, muscle_focus |
| `workout_plan_exercises` | plan_day_id, exercise_id, position, sets, reps_min, reps_max, rest_seconds, notes |
| `workout_sessions` | user_id, plan_day_id, status, started_at, finished_at, notes |
| `workout_sets` | session_id, user_id, exercise_id, set_number, weight_kg, reps, rpe, created_at |
| `foods` | name, slug, category, serving_size, unit, calories, protein, carbs, fat, status |
| `meals` | user_id, meal_type, eaten_at |
| `meal_items` | meal_id, food_id, quantity, calories, protein, carbs, fat (snapshot) |
| `weight_logs` | user_id, weight_kg, logged_at |
| `ai_conversations` | user_id, title, created_at |
| `ai_messages` | conversation_id, user_id, role, content, created_at |
| `ai_requests` | user_id, type, prompt_version, status, latency_ms, error_code, created_at |

Equipment and muscle values are fixed enums/text lists in code, not separate tables.

---

## 18. RLS

All user-owned tables use:

`auth.uid() = user_id`

(for child tables, check ownership through the parent or store `user_id` on the child).

- `exercises` and `foods`: anyone authenticated (and public for exercises) can `SELECT` rows with `status = 'PUBLISHED'`; only `ADMIN` can write.
- `profiles.role` must **not** be updatable by the user (use a column-level restriction or a trigger).
- A user must never read another user's profile, plans, sessions, meals, weight logs or AI conversations.

---

## 19. Testing (kept small)

- **Unit:** BMR/TDEE/macro calculation; AI plan validation (invalid exercise, wrong equipment, bad sets/reps); volume/PR calculation.
- **Manual security checks:** user A cannot read user B's data; non-admin cannot write exercises/foods; invalid token rejected by Node API.
- **AI failure cases:** invalid JSON, unknown exercise id, rate limit reached.

---

## 20. Development Method

Work in small phases. For every phase:

1. The agent receives **only the current phase** (and the matching Stitch screen).
2. The agent implements it and runs typecheck/build/tests.
3. The agent reports: changes, files created/modified, commands run, results, known issues, deviations.
4. The user (or reviewer) replies PASS / PASS WITH FIXES / FAIL.
5. Only after approval does the next phase start.

The agent must not silently redesign the approved architecture.

---

## 21. Implementation Phases (10)

| # | Phase | Deliverables |
|---|---|---|
| 1 | Setup, Supabase, auth | Repo (frontend + server), Supabase project, `profiles` table + RLS, register/login/logout, route guard |
| 2 | Onboarding, profile, assessment | 5-step onboarding, profile page, `POST/GET /fitness/assessment`, unit tests for formulas |
| 3 | Exercise library | `exercises` table + seed data, public list/detail with filters |
| 4 | AI workout plan | Provider abstraction, `WORKOUT_GENERATOR_V1`, validation + retry, plan tables, generate/review/activate, `/workout` plan view, `/analyzing` |
| 5 | Workout sessions | Start/log/edit/finish/abandon session, rest timer, completion summary with PRs, history |
| 6 | Foods and meals | `foods` seed, search, meal logging, snapshot items, daily summary vs targets |
| 7 | Weight and dashboard | Weight logs, `/progress`, `/dashboard` |
| 8 | AI Coach | Context builder, `COACH_V1`, conversation storage, rate limit, `/ai-coach` |
| 9 | Minimal admin | Role guard, CRUD for exercises and foods, user list (see Admin spec) |
| 10 | Testing and deploy | RLS verification, test cases from §19, deploy frontend + backend, README |

---

## 22. Definition of Done (per phase)

- Requested functionality works end to end.
- TypeScript and build pass.
- Relevant tests pass.
- RLS/authorization verified where the phase touches user data.
- No unrelated architecture changes.
- Agent report is complete and known issues are listed.

---

## 23. Future Work (for the project report)

AI nutrition plan, AI food photo scanner, re-plan engine, recommendation workflow, AI progress analysis, body measurements, exercise alternatives, data export/delete, notifications, analytics, audit logs, push/email channels, multi-sport support.

