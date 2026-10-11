# HFitness

HFitness is an AI-powered gym and nutrition web app built with React, Express,
TypeScript, and Supabase.

## Setup

1. Copy `web/.env.example` to `web/.env` and fill in the Supabase URL and
   publishable key.
2. Copy `server/.env.example` to `server/.env` and fill in the Supabase URL,
   publishable key, and server-only secret key.
3. Apply `supabase/migrations/001_profiles.sql` in the Supabase SQL Editor.
4. Install dependencies and start both applications:

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

