# UI SPEC — USER (MVP)
## AI Fitness & Nutrition Platform — Course Project Edition

Version: 1.0-MVP  
Scope: Public pages + authenticated user app. Designed to be fed to **Stitch** one screen at a time.

---

## 1. Design Direction (reusable brief)

Paste this block at the start of every Stitch prompt:

```
Design a premium, modern AI fitness and nutrition web app.
Style: clean, athletic, data-driven, confident, strong visual hierarchy.
Dark theme with one vivid accent color, rounded cards, large readable numbers,
minimal clutter.
Avoid: generic gym stock-photo look, excessive gradients, cartoonish UI,
dense enterprise-style screens.
Desktop: left sidebar navigation. Mobile: bottom navigation.
```

Principles:
- The next action on every screen should be obvious.
- Keep the same colors, typography, spacing and component style across all screens.

---

## 2. Responsive Strategy

- **Desktop:** sidebar navigation, large content canvas, cards, charts.
- **Mobile:** bottom navigation (`Home | Workout | Nutrition | Progress | More`), compact cards, sticky primary buttons, full-screen active workout.

---

## 3. Screen List (12 user screens for Stitch)

| # | Screen | Route |
|---|---|---|
| 1 | Landing page | `/` |
| 2 | Login / Register | `/login`, `/register` |
| 3 | Onboarding (5 steps) | `/onboarding` |
| 4 | Dashboard | `/dashboard` |
| 5 | Exercise library (+ detail) | `/exercises`, `/exercises/:slug` |
| 6 | Workout plan (+ day detail) | `/workout`, `/workout/day/:dayId` |
| 7 | Active workout (+ completion summary) | `/workout/session/:sessionId` |
| 8 | Workout history | `/workout/history` |
| 9 | Nutrition (today + add food) | `/nutrition` |
| 10 | Progress | `/progress` |
| 11 | AI Coach | `/ai-coach` |
| 12 | Profile | `/profile` |

Small supporting screens (can be simple, no Stitch needed): Analyzing, 404.

Recommended Stitch order: Dashboard → Login/Onboarding → Workout plan → Active workout → Nutrition → Progress → AI Coach → Landing → the rest.

---

## 4. Navigation

### Public top bar
Logo · Exercises · Login · Get Started

### App sidebar (desktop)
Dashboard · Workout · Exercises · Nutrition · Progress · AI Coach · Profile (account area at the bottom)

### Mobile bottom bar
Home · Workout · Nutrition · Progress · More (Exercises, AI Coach, Profile)

---

## 5. Landing Page

Sections: Hero · How it works (3 steps) · Features (AI workout, exercise library, nutrition, progress) · FAQ (short) · CTA · Footer.

Hero message: *Personalized gym training and nutrition powered by AI.*

Primary CTA: **Get Started** · Secondary CTA: **Explore Exercises**

---

## 6. Login / Register

- Login: email, password, Login button, link to Register.
- Register: email, password, confirm password, Create account button, link to Login.
- States: loading, inline field errors, general error.

---

## 7. Onboarding

Multi-step with a progress indicator and Back / Continue buttons.

1. **Goal** — cards: Lose weight, Gain weight, Build muscle, Get stronger, Maintain
2. **Basic info** — age, gender, height, weight
3. **Training** — experience level, days per week, minutes per session
4. **Equipment** — multi-select chips/cards
5. **Nutrition** — allergies, disliked foods, meals per day

Each step: clear title, one-line explanation, input area.

### Analyzing screen (`/analyzing`)
Progress animation with steps: Analyzing profile → Calculating targets → Selecting exercises → Building workout.  
Never show "done" before the AI call really completes. On failure: clear message + **Retry**.

---

## 8. Dashboard

Primary question: **What should I do today?**

Sections:
- Greeting + current goal with progress
- **Today's workout** card (name, duration, number of exercises, **Start** button)
- **Nutrition summary** (calories, protein, carbs, fat with progress indicators)
- Weekly workout activity (small chart)
- Latest weight
- AI Coach shortcut / one-line tip

---

## 9. Exercise Library

- Search, muscle filter, equipment filter, difficulty filter
- Exercise cards: image, name, primary muscle, equipment, difficulty
- Pagination or infinite scroll
- Detail page: media, name, muscle, equipment, difficulty, instructions, safety notes, CTA (public) or back-to-plan (logged in)

---

## 10. Workout Plan

### Plan page (`/workout`)
- Plan name, goal, frequency
- Weekly schedule as day cards (day, muscle focus, number of exercises, estimated duration)
- Today's session highlighted with **Start Workout**
- Recent workouts list
- If the plan is a DRAFT: banner with **Review & Activate** and **Regenerate**
- If no plan exists: empty state with **Generate my plan**

### Day detail (`/workout/day/:dayId`)
Title, duration, exercise list with sets × reps, rest time. Primary CTA: **Start Workout**.

---

## 11. Active Workout

The most important screen. Keep it minimal and thumb-friendly.

Display:
- Workout progress (exercise X of Y)
- Current exercise name and target sets × reps
- Previous performance for this exercise
- Set rows: set number, weight, reps, optional RPE, **Complete** button
- Rest timer after completing a set

Actions: Add set · Edit/delete set · Next exercise · Finish workout · Abandon (with confirmation)

### Completion summary
Duration · completed exercises · total sets · total volume · personal records · buttons **Done** and **View history**.

Avoid decorative animation during logging.

---

## 12. Workout History

List (optionally calendar) of completed sessions: date, workout name, duration, total volume. Tap to open a read-only summary.

---

## 13. Nutrition

Primary question: **How close am I to today's target?**

- Calories / protein / carbs / fat with progress and remaining values
- Date selector (today by default)
- Meal list grouped by breakfast / lunch / dinner / snack
- Primary CTA: **Add Food**

### Add Food (modal / bottom sheet)
Search box → results (name, serving, calories, protein, carbs, fat) → choose quantity and meal type → Add.

Meal item actions: edit quantity, delete.

---

## 14. Progress

Single page with three sections:
- **Weight:** chart + **Add weight** button + list with delete
- **Workouts:** sessions per week, completion rate, total volume
- **Nutrition:** average calories and protein over 7 days

Charts need labels, tooltips and an empty state with a short explanation.

---

## 15. AI Coach

- Message list, input box, suggested prompts:
  - What should I train today?
  - Why is my progress slow?
  - What should I eat after my workout?
- Answers show **recommendation + reason**
- Small, always-visible disclaimer: advice is not medical advice
- Loading state while the AI replies; friendly message when the daily limit is reached

---

## 16. Profile

Grouped cards (not one long form): Personal information · Body information · Goal · Training preferences · Nutrition preferences · Equipment. Includes **Save** and **Logout**.

---

## 17. Global UI States

Every screen needs: loading (skeleton), empty, error with retry, and no blank screens.  
Forms: inline validation, preserved values after errors, disabled submit while sending, success feedback.

---

## 18. Accessibility (minimum)

Keyboard navigation, visible focus, labels on inputs, readable contrast, comfortable touch targets.

---

## 19. Components to Reuse

Button · Input · Select · Chip · Card · Badge · Tabs · Modal / BottomSheet · Toast · Progress bar/ring · Skeleton · EmptyState · ErrorState · StatCard · ExerciseCard · WorkoutDayCard · MealCard · ChatMessage · Timer

Define colors, typography, spacing and radius once as design tokens; avoid hard-coded repeated values.

---

## 20. Using This Spec with Stitch and the Agent

1. Create each screen in Stitch with: **brief (§1) + screen name + main question + component list** from the matching section.
2. Keep later screens consistent: *"Keep the same style, colors, typography and sidebar as the Dashboard screen."*
3. Save a screenshot (and exported code if available) per screen.
4. When a backend phase needs a screen, give the agent the screenshot/code of **only that screen** and tell it to implement the UI in React using the existing design tokens.

There are no separate UI phases; UI is implemented inside the matching phase of the Technical Spec.

