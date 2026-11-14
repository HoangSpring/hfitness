# Landing hero notes
- code.html is a standalone static reference. Do NOT paste it into the app. Rewrite header and
  hero as React components using the central design tokens and translation keys
  (AGENTS.md section 11). Its :root tokens duplicate ours: reuse existing tokens and add only the
  missing ones (accent-hover, card-2, line, radius, gap, col) to the central tokens file.
- Implement only: floating header and the hero (copy column + animated 3-column mosaic).
  Keep the other landing sections (How it works, Features, FAQ, final CTA, footer) unchanged.
  The page scrolls normally.
- Do NOT use: the remote placeholder image URL (gstatic stitch-placeholder), inline <style> or
  inline <script>, data-auth attribute toggling, DOM cloning with appendChild, element ids used as
  hooks, or "Today"/phone/search/ticket extras (none exist).
- BUG TO FIX: in screen.png the headline lines are clipped ("NUTRITION" shows "NUTRITIOI", "AI"
  shows "A|"). Cause: .headline-line has overflow hidden + nowrap and the column is too narrow.
  No glyph may ever be clipped at any width.
- Copy (render from translation keys): eyebrow "GYM TRAINING / NUTRITION / PROGRESS"; headline
  lines "Personalized" / "gym training" / "and nutrition" / "powered by AI."; paragraph "Tell us your
  goal, schedule and equipment. HFitness builds your gym plan, calculates your nutrition targets,
  and helps you track workouts, meals and weight in one place."; primary "Get Started" (/register);
  secondary "Explore Exercises" with a 32px arrow circle (/exercises); header: Features, Exercises,
  Log in, Get Started. Logged in: header and hero primary CTA show "Go to Dashboard" (/dashboard)
  and "Log in" disappears.
- Mosaic: three columns, five tiles each, alternating scroll directions, 15 s linear loop, columns
  offset (+86px, -12px, +86px), fade mask at top and bottom. Tile kinds: red, graphite, dark, light
  (label "HFITNESS"), icon tile (inline SVG + label "Workout plan"), photo tiles.
  Photo tiles use /media/hero/exercise-N.jpg, alt="", lazy, decoding async; when missing or failing
  to load show the graphite gradient with a faint "HF" mark. Never invent or hotlink photos.