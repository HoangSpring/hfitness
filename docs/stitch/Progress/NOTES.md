# Progress notes
General
- Stitch files are visual references only. Rewrite as React components using design
  tokens and translation keys (AGENTS.md section 11). Use the app's own sidebar and logo
  (with "Progress" as the active item); do not hotlink Stitch images. Plain,
  beginner-friendly English. Units: kg. All numbers come from real data; the sample
  numbers in the mockup are inconsistent and must not be copied.

Implement
- Title "Progress", range selector (30 days / 90 days).
- Weight: latest weight with 7-day change ("Not enough data" when it cannot be
  computed), "Change over period" (first vs latest entry in the range, only when at
  least 2 entries), "Entries this period" (count). Line chart titled "Weight over time"
  with labeled axes (kg, dates), tooltip on hover/tap, points only (no smoothed
  trendline). Works with 0, 1 and many entries. "Add weight" button opens a dialog
  (date defaults to today, no future dates, kg 20-400). Entries list (date, kg, delete
  icon with confirmation). One entry per date: saving an existing date updates it.
  Empty state "No weight entries yet. Add your first one to start tracking."
- Workouts: "Workouts this week" as "X of Y" (Y = days_per_week from the profile),
  "Completion rate" (= completed sessions this week / days_per_week, capped at 100%),
  "Total volume this week" in kg, or "Total reps this week" when all logged weights are
  0 or empty (bodyweight). Bar chart "Sessions per week" for the last 8 weeks (weeks
  start on Monday, local time), current week labelled "This week". Empty state "Finish a
  workout to see your stats."
- Nutrition: "Days logged X of 7" with a 7-day dot strip, four cards (Calories, Protein,
  Carbs, Fat): 7-day average over logged days vs target, with a progress bar and a
  percentage. If there are no targets, show a short empty state linking to /profile.
  Empty state "Log meals to see your averages."

Do NOT implement
- The top search bar, notification bell, "TODAY" pill, avatar photo, "Pro Plan",
  "Telemetry & Core", breadcrumb "Progress" text styling, the "Populated / Empty State"
  preview toggle, and the highlighted "Nutrition" sidebar item (a mockup bug).
- "Weight Telemetry", "30-day smoothed", the trendline, "Morning fasting", times of day
  on entries, "Calculated using morning weigh-ins", "Scale calibrated", the "Weigh-in
  frequency" card with a target, "Target: > 3/wk", "On Target" badges, "Up +450 kg vs
  last week" unless computed, "Adherence window: optimal", and the sentences "Consistent
  logging improves baseline calorie precision" and "Consistent protein intake
  maintained".
- Labels: "Add weight" (not "Log Weight"), "Fat" (not "Healthy fats" / "Average fats"),
  "Carbs", "Sessions per week" (not "Weekly Session Frequency / training blocks").
- No body fat, predictions, streaks, badges, readiness or recovery scores, AI analysis.