# Nutrition notes
General
- Stitch files are visual references only. Rewrite as React components using design
  tokens and translation keys (AGENTS.md section 11). Do not hotlink Stitch images; use
  the app's own logo and sidebar. Plain, beginner-friendly English.
- All numbers are computed from real data. The sample numbers in the mockup are
  inconsistent and must not be copied. No health claims, no praise or diet rating text.

PAGE (/nutrition), renders inside the app shell
- Implement: title "Nutrition", date selector (previous/next, real local date, "Today"),
  a "Today's targets" card with four measures (Calories, Protein, Carbs, Fat), each
  showing consumed / target and remaining, with a progress bar. Four meal cards
  (Breakfast, Lunch, Dinner, Snack): meal subtotal (kcal and protein), list of items
  (food name, "<quantity> servings (<serving_size * quantity> <unit>)", calories and
  macros from the SNAPSHOT values), edit and delete icons, per-meal "Add food" that
  preselects that meal type, an empty state "Nothing logged yet" for empty meals.
  Primary "Add Food" button (sticky at the bottom on mobile).
- If the user has no assessment: replace the targets card with "Set up your targets in
  your profile" and a button to /profile; meals can still be logged.
- Remaining can be negative: show "over by X" in a neutral tone (icon + text, no alarm).
- Optional percentage badge only if it is calories consumed / calorie target; otherwise
  omit it.
- Do NOT implement: the top search bar, notification bell, "TODAY" pill, avatar photo,
  "Pro Plan", "Telemetry & Core" label, the "Logged / No Targets" preview toggle,
  breadcrumb text "Nutrition & Macros" (use a plain title), household measures such as
  "1 bowl" or "15 nuts" unless they exist in the data.
- Labels: "Today's targets", "Carbs", "Fat" (not "Healthy fats").

ADD FOOD (modal on desktop, bottom sheet on mobile)
- Search box "Search foods" (debounced), results list (name, serving "100 g", calories,
  protein, carbs, fat), loading skeleton, "No foods found" state.
- After selecting a food: quantity stepper in servings (greater than 0, sensible max),
  meal type chips (Breakfast, Lunch, Dinner, Snack), live preview of
  calories/protein/carbs/fat for the chosen quantity, red "Add" button, Cancel.
- Edit item: same sheet with the quantity (and meal type if simple) prefilled.
- Delete: confirmation with clear consequence.
- Do NOT add: barcode or photo scanning, recipes, water tracking, streaks, "AI meal
  plan" sections.