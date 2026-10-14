# Workout history notes
- Stitch files are visual references only. Rewrite as React components using design
  tokens and translation keys (AGENTS.md section 11). Plain, beginner-friendly English.
  Show only real data. Do not hotlink Stitch images; use the app's own logo component.
- Page renders inside the app shell (real sidebar, no top search bar).
- Implement: title "Workout history" with a short subtitle, list of COMPLETED sessions
  newest first. Row: date (formatted with Intl, real dates), plan day name, duration,
  total volume, number of exercises completed, chevron to expand/open a read-only detail
  (date and time, duration, total volume, sets completed, and per exercise the logged
  sets as "Set n: kg x reps"). "Load more" plus "Showing X of N workouts" using real
  counts. Empty state: "No workouts yet. Start your first workout from your plan." with
  a "Go to my plan" button. Loading skeleton and error state with Retry.
- Bodyweight sessions (all weights 0/empty): show total reps instead of volume.
- Do NOT implement: the top search bar ("Search telemetry, movements, bio-metrics"),
  the notification bell, the "TODAY" pill, "Pro Plan", the "Telemetry & Core" sidebar
  label, "Log archive" and "Read-only telemetry" labels, the "Preview: Logged /
  Empty state" toggle, "Logged timestamp / Precise time / Session load / Accumulated
  effort" labels (use Date, Duration, Total volume, Sets completed), and the "Repeat
  this workout" button (out of scope).
- PR badges in history are optional; only show them if computed from real data without
  extra complexity.