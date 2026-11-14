# AGENTS.md — HFitness

> Put this file in the **root of the repository**. Re-read it at the start of every phase.

## 1. Project

**HFitness** is an AI-powered gym & nutrition web app (course project, MVP scope).  
UI language: **English**. Users are gym beginners to intermediates.

Core loop: `Onboarding → Targets → AI workout plan → Log workouts + meals → Progress → AI Coach`

Source of truth for scope: `docs/TECHNICAL_SPEC_USER_MVP.md`, `docs/TECHNICAL_SPEC_ADMIN_MVP.md`.  
Source of truth for UI: `docs/UI_SPEC_USER_MVP.md`, `docs/UI_SPEC_ADMIN_MVP.md`, plus Stitch screenshots/code in `docs/stitch/<screen-name>/`.

If this file conflicts with a spec, **stop and ask** instead of choosing silently.

## 2. Stack

- **web/** — React + TypeScript + Vite, React Router, Zod, Supabase JS client
- **server/** — Node.js + TypeScript + Express, Zod (logic-heavy endpoints only)
- **supabase/** — SQL migrations (`migrations/`), seed data (`seed/`)
- Database/Auth: Supabase (PostgreSQL, Auth, RLS)
- AI: provider abstraction in `server/src/lib/ai/` (free-tier provider, configured by env)

## 3. Repository layout

```text
hfitness/
├── AGENTS.md
├── README.md
├── docs/                  # specs + stitch screens
├── web/
│   └── src/
│       ├── app/           # router, providers, layout
│       ├── features/      # auth, onboarding, workout, nutrition, progress, coach, admin, exercises
│       ├── components/ui/ # reusable UI components
│       ├── lib/           # supabase client, api client, utils
│       └── styles/        # design tokens
├── server/
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── lib/           # ai provider, supabase clients, errors, constants
│       ├── middleware/    # auth, error handler, rate limit
│       └── server.ts
└── supabase/
    ├── migrations/        # numbered: 001_..., 002_...
    └── seed/
```

## 4. Golden rules (never break)

1. **AI recommends. Backend validates. Database stores truth.** AI output is never saved or shown as fact before Zod + business validation.
2. **AI must never invent an exercise.** Only `PUBLISHED` exercise IDs from the database are allowed in plans.
3. **BMR / TDEE / calorie / macro targets are calculated by code, never by AI.**
4. **RLS on every user-owned table** (`auth.uid() = user_id`). Users can never read another user's data.
5. **`profiles.role` cannot be changed by the user.** Admin is set manually in the database.
6. **Frontend route guards are UX only.** Real authorization = RLS + server token verification.
7. **Secrets stay on the server.** `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` must never appear in `web/` or in logs. Never commit `.env`.
8. **Meal items store nutrition snapshots.** Editing a food must not change history.
9. **Do not add features outside the current phase.** No new libraries unless the phase needs them (state why in the report).
10. **Do not redesign approved architecture.** If something seems wrong, report it as a deviation/question.

## 5. Server conventions

- Per-request Supabase client built from the **user's JWT** so RLS applies. Use the service role client only for: inserting `ai_requests`, counting AI usage, and admin aggregates.
- Every user-owned table that the web client inserts into must have `user_id DEFAULT auth.uid()` (the client must not be trusted to send `user_id`), in addition to the RLS policy `auth.uid() = user_id`.
- Response format:
  - Success: `{ "data": ... }`
  - Error: `{ "error": { "code": "SOME_CODE", "message": "Human readable." } }`
- HTTP codes: 200, 201, 400, 401, 403, 404, 422, 429, 500.
- Validate all input with Zod. Central error handler. No `console.log` of tokens, keys or full prompts.
- Base path: `/api/v1`.

## 6. Frontend conventions

- Branding, design tokens and localization rules are in **§11**. Follow them in every phase.
- Use **design tokens** (colors, spacing, radius, typography) defined once in `web/src/styles/tokens.*`. No repeated hard-coded values.
- Every data screen has: **loading (skeleton), empty, error with retry**.
- Forms: inline Zod validation, keep values on error, disable submit while sending, success feedback.
- Match the Stitch screenshot/code for the screen being built. Convert to React components using existing UI components; do not paste raw exported HTML as a single blob.
- Accessibility minimum: labels, keyboard navigation, visible focus, readable contrast.

## 7. Environment variables

`web/.env.example`
```

```

`server/.env.example`
```
PORT=3001
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://supabase.com/dashboard/project/odmfyqdfihtzhsibscbq/settings/api-keys
SUPABASE_ANON_KEY=sb_publishable_h5_PVbuxh82NGSW_NUr2Tw_WrnLQwnW
SUPABASE_SERVICE_ROLE_KEY=sb_secret_s17z3PrEHLm8I778QxCIWw_Dex91MTB
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
AI_DAILY_LIMIT=10
```

## 8. Working method

For every phase:

1. Read this file and the phase prompt. Read only the spec sections the prompt lists.
2. Briefly state your plan (files you will create/modify) before coding.
3. Implement **only** the phase scope.
4. Run: typecheck, lint (if configured), build, and the tests the phase requires. Fix failures.
5. Write the report below. Be honest about anything not working.
6. Stop. Wait for the reviewer's PASS / PASS WITH FIXES / FAIL.

## 9. Report template (required at the end of every phase)

```
# Phase XX Report

## Summary
(2–4 sentences)

## Changes
- ...

## Files created
- ...

## Files modified
- ...

## Migrations
- ...

## Commands run and results
- `npm run typecheck` → ...
- `npm run build` → ...
- `npm test` → ...

## How I verified it manually
- ...

## Acceptance criteria
- [x] / [ ] each criterion from the phase prompt

## Known issues
- ...

## Deviations from spec / questions
- ...
```

## 10. Definition of Done

- Phase functionality works end to end.
- Typecheck and build pass; required tests pass.
- RLS/authorization verified where user data is touched.
- No unrelated changes; no secrets committed.
- Report is complete and lists known issues.

## 11. Branding & Internationalization

### Branding
- Product name: **HFitness**.
- Visual direction: modern, premium gym and fitness platform.
- Core palette (dark theme):

| Token role | Value |
|---|---|
| Primary background | `#0B0B0D` |
| Card background | `#18181B` |
| Primary accent | `#EF4444` |
| Primary text | `#F4F4F5` |
| Secondary text | `#A1A1AA` |

- Define these colors and all other design tokens (spacing, radius, typography, shadows, borders, breakpoints, motion durations) **once, centrally** in `web/src/styles/tokens.*`. Components use tokens only. Avoid repeated hard-coded colors, sizes or radii in components.
- Because the accent is red, **never rely on color alone** to communicate errors or destructive actions; pair color with an icon and/or text. Define separate semantic tokens for success, warning and error states.
- Check text contrast on accent backgrounds. Light text on `#EF4444` is borderline for small text, so use larger or semi-bold labels on accent buttons, or adjust the label color token.
- If a Stitch design uses different colors, **these tokens win**. Adapt the design to the tokens and mention it in the report.

### Internationalization (i18n)
- English (`en`) and Vietnamese (`vi`) are supported. Every new user-facing string must have both `en` and `vi` keys; the `i18n:check` parity test enforces this.
- The frontend must be **prepared for future Vietnamese (`vi`)** from Phase 01, but full Vietnamese translations are **not required** in the MVP unless a phase explicitly includes them.
- Keep user-facing text **out of components**. All UI strings live in centralized translation files using stable keys (for example `auth.login.title`, `nutrition.addFood.button`). Components reference keys through a single translation helper. Do not scatter hardcoded English strings through JSX.
- Do **not** introduce an i18n library unless the current phase requires it. A small typed dictionary (`web/src/i18n/en.ts`) plus a `t(key, params?)` helper and a locale type (`'en' | 'vi'`) is enough for the MVP. If you add a library, explain why in the phase report.
- Server errors: keep stable error `code` values. The frontend maps codes to translation keys; server `message` text stays in English and is not shown directly when a mapped key exists.
- Format dates, numbers and units with `Intl` APIs using the active locale; do not hand-build formatted strings.
- Layouts must tolerate **Vietnamese diacritics** and text that can be **30–40% longer** than English: no fixed-width text containers, allow wrapping, avoid clipping in buttons, tabs and nav items. Use a font that supports the Latin Extended and Vietnamese character sets.
- Content stored in the database (exercise names, instructions, food names) stays in English for the MVP and is not translated.
- **AI Coach:** build the prompt so a response-language instruction can be supplied. When localization support is implemented, the coach responds in the user's selected language. In the MVP the language is English.
- Do not add a language switcher or a locale column in the database until a phase asks for it.
