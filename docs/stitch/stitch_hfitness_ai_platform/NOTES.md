# Exercise library notes (list + detail)
General rules
- Stitch files are visual references only. Rewrite as React components using design
  tokens and translation keys. Do NOT hotlink Stitch image URLs; use a neutral
  placeholder when image_url is null.
- Plain, beginner-friendly English. No jargon such as "telemetry", "kinematic",
  "biomechanical protocol". Show only data that exists in the exercises table.
  Never display invented numbers, percentages or scientific claims.

LIST (/exercises)
- Implement: top bar (Logo, Exercises, Login, Get Started; when logged in render inside
  the app shell instead), title "Exercise library", search ("Search exercises"),
  filters Muscle / Equipment / Difficulty (chips come from the constants file, include
  kettlebell and band), "Clear filters", active-filter count, card grid, "Load more",
  empty state, "Showing X of N exercises" with real counts.
- Card = image or placeholder, name, primary muscle, equipment, difficulty badge,
  optionally movement pattern (e.g. "Push / Compound").
- Do NOT implement: "Kinematic Database V4.2", "Total modules ... Verified", the red
  tag line on cards, the tempo box, the three bottom feature cards, "Telemetry Labs"
  footer text, Workouts/Nutrition links and avatar in the public top bar.
- Footer: logo + copyright with the current year (computed). No fake links.

DETAIL (/exercises/:slug)
- Implement: breadcrumb/back link, media area (video only if video_url exists, else image
  or placeholder), name, difficulty + equipment badges, primary muscle, secondary muscles
  as tags, numbered instructions (steps from the data), safety notes callout with an
  icon (not color alone), "Details" card (movement pattern, equipment, difficulty,
  primary muscle), CTA card "Get your personalized plan" -> /register (logged in:
  "Back to library").
- Do NOT implement: telemetry/calibration labels, video overlay text, tempo, bench angle,
  target RPE, EMG activity distribution, "14-day adaptive trial", "Mandatory" tag.
- Unknown slug -> friendly not-found state.