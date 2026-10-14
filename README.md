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
6. Install dependencies and start both applications:

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

## Checks

Run `npm run typecheck`, `npm run build`, and `npm test` in both `web` and
`server`.
