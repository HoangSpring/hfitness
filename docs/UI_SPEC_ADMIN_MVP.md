# UI SPEC — ADMIN (MVP)
## AI Fitness & Nutrition Platform — Course Project Edition

Version: 1.0-MVP  
Scope: 4 admin screens only. Designed to be fed to **Stitch** one screen at a time.

---

## 1. Design Direction (reusable brief)

Paste at the start of every Stitch prompt:

```
Design a professional SaaS admin dashboard for a fitness and nutrition app.
Style: clear, fast, data-dense, consistent, safe. Light or dark theme matching
the main app, compact spacing, strong status badges, clear destructive-action
buttons. Left sidebar navigation, top bar with page title and admin profile.
Not a marketing site.
```

Admin shares the same color palette and typography as the user app but uses more compact spacing and clearer table hierarchy.

---

## 2. Screen List (4 screens for Stitch)

| # | Screen | Route |
|---|---|---|
| 1 | Admin dashboard | `/admin` |
| 2 | User management (list + detail) | `/admin/users`, `/admin/users/:id` |
| 3 | Exercise management (list + editor) | `/admin/exercises`, `/admin/exercises/new`, `/admin/exercises/:id/edit` |
| 4 | Food management (list + editor) | `/admin/foods`, `/admin/foods/new`, `/admin/foods/:id/edit` |

---

## 3. Layout

### Desktop
Left sidebar: **Dashboard · Users · Exercises · Foods** (plus a "Back to app" link).  
Top bar: page title, admin profile, logout.

### Mobile
Collapsible drawer navigation; tables become cards. Desktop is the primary experience; mobile only needs to stay usable for dashboard and user lookup.

---

## 4. Admin Dashboard

KPI cards:
- Total users
- New users (7 days)
- Workouts completed today
- Meals logged today
- AI requests today
- AI failed requests today

Optional chart: user growth (30 days).

Every widget needs loading, empty and error states.

---

## 5. User Management

### List (`/admin/users`)
- Search, goal filter, pagination
- Columns: User, Email, Goal, Joined, Last active, Actions (**View**)

### Detail (`/admin/users/:id`)
Read-only cards: Profile summary · Goal · Completed workouts · Meals logged · AI requests.

Show minimal personal data. No passwords, tokens or private AI conversation text.

---

## 6. Exercise Management

### List (`/admin/exercises`)
- Toolbar: search, muscle filter, equipment filter, difficulty filter, status filter, **Add exercise**
- Columns: Image, Name, Primary muscle, Equipment, Difficulty, Status (badge), Updated, Actions
- Actions: **Edit · Publish · Archive**

### Editor (`/admin/exercises/new`, `/admin/exercises/:id/edit`)
Grouped form sections:
- Basic information (name, slug, description)
- Instructions and safety notes
- Muscles (primary, secondary)
- Equipment and difficulty, movement pattern
- Media (image URL, video URL)
- Status / publishing

Buttons: **Save draft · Publish · Archive**. Validation errors appear inline; publishing is blocked until required fields are filled.

---

## 7. Food Management

### List (`/admin/foods`)
- Toolbar: search, category filter, status filter, **Add food**
- Columns: Food, Category, Serving, Calories, Protein, Carbs, Fat, Status, Updated, Actions
- Actions: **Edit · Publish · Archive**

### Editor (`/admin/foods/new`, `/admin/foods/:id/edit`)
Sections: Food identity (name, slug, category) · Serving (size, unit) · Nutrition (calories, protein, carbs, fat) · Status.

Show a **consistency warning** (not a block) when calories look inconsistent with `protein×4 + carbs×4 + fat×9`.

Buttons: **Save draft · Publish · Archive**.

---

## 8. Tables and Forms

Tables: pagination, sorting where useful, search, loading skeleton, empty state, error state.  
Forms: grouped sections, inline validation, values preserved on error, submit disabled while saving, visible save status.

---

## 9. Destructive Action UX

For **Archive** (and any future delete):
- Confirmation modal
- Clear consequence text (e.g. "Archived exercises will no longer be available to users or the AI.")
- Cancel and Confirm buttons

---

## 10. Status Badges

| Status | Suggested look |
|---|---|
| DRAFT | neutral / grey |
| PUBLISHED | green |
| ARCHIVED | muted / amber |

---

## 11. Components to Reuse

AdminShell · Sidebar · Topbar · KPI card · ChartCard · DataTable · FilterBar · SearchInput · StatusBadge · ConfirmDialog · FormSection · EmptyState · ErrorState · LoadingSkeleton

---

## 12. Accessibility (minimum)

Keyboard navigation, visible focus, labels on inputs, accessible table structure, clear error messages, adequate contrast.

---

## 13. Using This Spec with Stitch and the Agent

1. Create the 4 screens with: **brief (§1) + screen name + component list** from the matching section.
2. Keep the same style across screens (*"Keep the same sidebar and table style as the dashboard"*).
3. Give the agent the screenshot/code of one screen at a time during **Phase 9 (9a–9d)** of the Technical Spec.

There are no separate admin UI phases.

