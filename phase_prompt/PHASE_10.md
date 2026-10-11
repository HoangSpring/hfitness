# PHASE 10 — Testing, security check and deployment

First read `AGENTS.md`. Then read only:
- `docs/TECHNICAL_SPEC_USER_MVP.md` §15, §18, §19, §22
- `docs/TECHNICAL_SPEC_ADMIN_MVP.md` §3, §12

## Goal
Prove the app is correct and safe enough for a course demo, deploy it, and leave a clean README.

> Do **not** add new features in this phase. Fix bugs only; list anything larger as a known issue.

## Tasks

### 1. Test review
1. Run all existing tests. List what is covered: fitness calculations, plan validation, volume/PR, nutrition calculation, progress metrics, coach context builder.
2. Fill obvious gaps with small unit tests (do not chase coverage numbers).

### 2. RLS / security verification
3. Write a repeatable script or documented SQL/test suite using **two normal test users and one admin** that proves:
   - user A cannot read or write user B's: profile, assessments, workout plans/sessions/sets, meals/items, weight logs, AI conversations/messages, `ai_requests`
   - a normal user cannot insert/update `exercises` or `foods`
   - a normal user cannot change their own `role`
   - a normal user cannot call admin RPC functions
   - DRAFT/ARCHIVED exercises and foods are not visible to normal users
   - the Node API returns 401 for missing/invalid tokens
4. Check the AI endpoints: rate limit returns 429; invalid AI JSON never produces a saved plan; unknown exercise id is rejected.
5. Secret hygiene: search the repo and the built frontend bundle for service-role keys, AI keys and `.env` files; confirm `.gitignore`; confirm logs contain no tokens/keys/full prompts.
6. Server hardening basics: CORS limited to the frontend origin, request body size limit, Zod validation on every endpoint, secure headers (e.g. helmet), a general request rate limit.
7. Record results in `docs/SECURITY_CHECKS.md` as a table: check → how tested → result.

### 3. Quality pass
8. Walk through the full user journey manually: register → onboarding → analyzing → plan activation → start/finish a workout → log meals → add weight → dashboard → AI Coach → logout. Then the admin journey. Fix small bugs; list the rest.
9. Check every screen on mobile width and desktop width; fix broken layouts only.
10. Confirm all screens have loading, empty and error states and no blank screens.

### 4. Deployment
11. Deploy `web/` to Vercel (SPA fallback so deep links work, environment variables set in the dashboard).
12. Deploy `server/` to a Node-compatible host (or serverless functions). Set environment variables there; set `CORS_ORIGIN` to the deployed frontend URL.
13. Configure Supabase Auth site URL / redirect URLs for the deployed frontend.
14. Apply all migrations and seeds to the production Supabase project (or document why the same project is used). Create the first admin per the Phase 09 instructions.
15. Smoke-test the deployed app end to end.

### 5. Documentation
16. `README.md`: what HFitness is, features, architecture diagram (simple text/ASCII or Mermaid), tech stack, local setup, environment variables, how to run migrations and seeds, how to run tests, deployment steps, demo accounts (without real secrets), known issues, future work (from the spec §23).
17. `docs/DEMO_SCRIPT.md`: a 5–8 minute demo flow listing the screens to show and the sample data to prepare.

## Out of scope
New features, refactors for style, performance tuning beyond obvious problems.

## Acceptance criteria
- [ ] All tests pass; the security checks table is complete and honest (failures listed, not hidden).
- [ ] No secrets in the repo or frontend bundle.
- [ ] The deployed frontend and backend work together; deep links and login persist after refresh.
- [ ] Full user and admin journeys work on the deployed app.
- [ ] README and demo script exist and are accurate.
- [ ] `typecheck` and `build` pass for `web/` and `server/`.

## Report
Use the template in `AGENTS.md` §9 and stop. Include the deployed URLs and the security checks table.
