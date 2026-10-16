# Admin foods notes (list + editor)
General: same rules as admin-dashboard/NOTES.md.

LIST
- Implement: title "Foods", counts (Total / Published / Drafts / Archived) only if real,
  search (name or slug), category filter using the REAL categories in the foods table,
  status filter, "Add food", table (name + slug, category, serving, calories, protein,
  carbs, fat, status badge with text, updated, actions Edit / Publish / Archive),
  pagination, empty state. Real slugs (not "food/..." prefixes). Units are g, ml or piece
  as stored.
- Do NOT implement: "Telemetry Telemetry", "Telemetry Core", "v2.4.1", the "ACTIVE"
  sidebar badge, the "View state" toggle, "+14 this wk", the advanced-filters icon, and
  fake percentages.

EDITOR
- Implement: Identity (name, slug, category), Serving (size, unit g / ml / piece),
  Nutrition per serving (calories, protein, carbs, fat; non-negative numbers), Status
  (Draft / Published / Archived), buttons Save draft, Publish, Archive (confirmation).
  A NON-BLOCKING warning banner only when calories differ from protein x4 + carbs x4 + fat
  x9 by more than 20 percent: "Calories differ a lot from protein x4 + carbs x4 + fat x9.
  Please check the values." Publish requires serving size and all four values. Editing a
  food never changes existing meal items.
- Do NOT implement: "Auto-Correct" button (never overwrite values automatically),
  Dietary Fiber and Sodium fields (not in the MVP schema), "Metabolic Tier", the
  "Metabolic Density" card (Protein ratio, Caloric density, "Anabolic Index"), "Audit
  Provenance" timeline (USDA sync, manual override), the "Admin Protocol" text,
  "Athletic Field Measure (Visual Reference)" household-measure field, "Biochemical
  Category", "Biometric Macronutrients", "Reference Mass / Vol", "Calibration Matrix",
  auto-save text, "UUID-FD-09418" and "Telemetry core record #FD-09418" ids, and the
  duplicate bottom buttons "Discard Changes" / "Save & Commit" (keep one Save draft /
  Publish / Archive set plus Cancel).
- Plain labels: Name, Slug, Category, Serving size, Unit, Calories, Protein (g), Carbs
  (g), Fat (g), Status.