# TECHNICAL SPEC — ADMIN (MVP)
## AI Fitness & Nutrition Platform — Course Project Edition

Version: 1.0-MVP  
Scope: Minimal admin only. Implemented as **Phase 9** of the user spec.

---

## 1. Admin Goal

Give one admin the minimum tools to keep the platform's content healthy:
- Manage the **exercise** library.
- Manage the **food** database.
- See a **list of users** (read-only).
- See a small **dashboard** of counts.

Admin is a privileged area and must never rely on frontend-only authorization.

---

## 2. Scope

### In scope
- Role guard (`USER` / `ADMIN`)
- Admin dashboard with a few aggregate counts
- User list and user detail (read-only)
- Exercise CRUD with DRAFT / PUBLISHED / ARCHIVED
- Food CRUD with DRAFT / PUBLISHED / ARCHIVED

### Out of scope (future work)
- User suspend / restore
- Muscle / equipment / activity management (these are fixed lists in code)
- Workout program/template management
- Nutrition data-quality admin pages
- AI monitoring, AI metrics and error pages
- Analytics
- Notifications
- System settings and feature flags
- Content management (FAQ, articles)
- Audit logs
- SUPER_ADMIN / CONTENT_ADMIN roles

---

## 3. Roles and Authorization

- Roles: `USER`, `ADMIN`, stored in `profiles.role`.
- The first admin is created manually (set `role = 'ADMIN'` in the database).
- Users must **not** be able to change their own `role` (column restriction or trigger).
- Never trust localStorage, query parameters, client-supplied roles or hidden UI.

Authorization is enforced in two places:
1. **RLS policies** using a helper function `is_admin()` that checks `profiles.role` of `auth.uid()`.
2. Any Node endpoint used by admin must verify the token and the admin role before running.

Frontend route protection (`/admin/*`) is UX only.

---

## 4. Architecture (simplified)

| Operation | How |
|---|---|
| Exercise / food CRUD | Admin frontend → Supabase client, protected by RLS (`is_admin()` required for INSERT / UPDATE) |
| User list / user detail | Postgres **view or RPC function** restricted to admins (does not expose passwords, tokens or secrets) |
| Dashboard counts | Postgres **RPC function** restricted to admins, returning aggregates only |

No separate admin service layer is required.

---

## 5. Admin Routes

- `/admin` — dashboard
- `/admin/users`
- `/admin/users/:id`
- `/admin/exercises`
- `/admin/exercises/new`
- `/admin/exercises/:id/edit`
- `/admin/foods`
- `/admin/foods/new`
- `/admin/foods/:id/edit`

Non-admin users who open these routes are redirected to `/403` (or `/404`).

---

## 6. Admin Dashboard

Aggregate counts only (no raw personal data):
- Total users
- New users in last 7 days
- Workout sessions completed today
- Meals logged today
- AI requests today
- AI failed requests today (from `ai_requests`)

Optional: simple user-growth chart for the last 30 days.

---

## 7. User Management (read-only)

Admin can:
- List users with pagination, search by name/email, filter by goal
- View a user's summary

List columns: display name, email, goal, joined date, last active.

User detail shows: profile summary, goal, number of completed workouts, number of meals logged, number of AI requests.

Never exposed: passwords, auth tokens, secrets, raw private content (e.g. full AI conversation text).

Pagination is mandatory.

---

## 8. Exercise Management

Admin can create, edit, publish and archive exercises.

Fields: name, slug (unique), description, instructions, primary_muscle, secondary_muscles[], equipment, difficulty, movement_pattern, image_url, video_url, safety_notes, status.

Statuses: `DRAFT`, `PUBLISHED`, `ARCHIVED`.

Rules:
- Publishing requires: name, slug, primary_muscle, equipment, difficulty, instructions.
- Exercises referenced by workout plans or sets are **archived, not hard-deleted**.
- Users and the AI only ever see `PUBLISHED` exercises.

---

## 9. Food Management

Admin can create, edit, publish and archive foods.

Fields: name, slug (unique), category, serving_size, unit, calories, protein, carbs, fat, status.

Rules:
- Publishing requires all four nutrition values and a serving size.
- Show a **consistency warning** (not a hard block) when `calories` differs strongly from `protein×4 + carbs×4 + fat×9`.
- Foods referenced by meal items are **archived, not hard-deleted**. (Meal items keep nutrition snapshots, so history is unaffected.)

---

## 10. Data Access Summary

| Table | USER | ADMIN |
|---|---|---|
| `exercises` | read PUBLISHED | read all, insert, update |
| `foods` | read PUBLISHED | read all, insert, update |
| `profiles` | own row only (cannot edit `role`) | read all via restricted view/RPC |
| Other user-owned tables | own rows only | aggregate counts via RPC only |

---

## 11. Validation

- Use Zod on the frontend forms and (where a Node endpoint is used) on the server.
- Database constraints: unique slugs, non-negative nutrition values, valid enum values for status/difficulty.

---

## 12. Testing

- A non-admin user cannot insert/update `exercises` or `foods` (RLS test).
- A non-admin user cannot call admin RPC functions or open admin data.
- A user cannot change their own `role`.
- Admin can create → publish → archive an exercise and a food.
- Publish is rejected when required fields are missing.
- A DRAFT or ARCHIVED item is not visible to normal users.

---

## 13. Implementation (Phase 9, in four steps)

| Step | Work |
|---|---|
| 9a | `is_admin()` function, RLS policies, role guard on `/admin/*`, admin shell (sidebar + topbar) |
| 9b | Exercise list + editor + publish/archive |
| 9c | Food list + editor + publish/archive + consistency warning |
| 9d | Dashboard counts + read-only user list/detail |

Each step is reported back for PASS / FAIL review like any other phase.

---

## 14. Definition of Done

- Feature works.
- Authorization verified with a non-admin account.
- Validation works.
- Typecheck and build pass.
- No privilege escalation possible (role cannot be self-edited).
- Agent report is complete and known issues are listed.

