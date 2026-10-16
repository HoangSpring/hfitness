# Admin dashboard notes
General (applies to all admin screens)
- Stitch files are visual references only. Rewrite as React components using design tokens
  and translation keys (AGENTS.md section 11). Use the app's own logo; do not hotlink
  Stitch images. Plain English, compact admin style.
- The top bar shows the PAGE TITLE (not "Admin Dashboard" on every page), the admin's display
  name with an "ADMIN" badge, and Log out. Sidebar: Dashboard, Users, Exercises, Foods and
  "Back to app". No "ACTIVE" badges, no "Telemetry Core" labels, no version numbers.
- All sample numbers, names, ids and timestamps in the mockups are invented. All data comes
  from the database. Never show a claim that the system does not actually check.
- Remove every state-preview toggle (Populated / Loading / Empty / Error / View state).
  Build real loading, empty and error states.
- Tables must never clip actions: allow horizontal scroll on small screens or collapse
  columns; mobile can turn rows into cards.

Implement
- KPI cards (six, counts only): Total users, New users (7 days), Workouts completed today,
  Meals logged today, AI requests today, AI failed requests today. No deltas, percentages,
  "active right now", latency or "rate" lines unless computed by the admin RPC.
- One chart "New users, last 30 days" (line or bars, labeled axes, tooltip). Optional small
  summary of total and peak only if computed.
- Each widget has its own loading, empty and error state; one failing widget must not break
  the page.

Do NOT implement
- "LIVE STREAM", auto-refresh, "Platform telemetry, real-time activity, AI inference
  latency logs", the "Service Mesh" panel, "Recent Platform Activity" event stream,
  "Cohorts across mobile and web client instances", "Rolling 30D" badge.