# Admin exercises notes (list + editor)
General: same rules as admin-dashboard/NOTES.md.

LIST
- Implement: title "Exercises", status counts only if cheap and real (Total / Published /
  Drafts / Archived), search (name or slug), filters Muscle / Equipment / Difficulty /
  Status using the shared constants, "Add exercise", table (image or placeholder, name +
  slug, primary muscle with secondary muscles below, equipment, difficulty, status badge
  with text, updated, actions Edit / Publish / Archive), pagination and empty state.
- Seeded exercises have no images: show a neutral placeholder. Publish is available for
  Draft and Archived items (re-publish allowed); Archive only for Draft and Published.
- Do NOT implement: "Catalog Management // Exercise Registry", "biomechanical targeting"
  wording, the Populated/Empty toggle.

EDITOR
- Implement the sections Basic info (name, slug with live uniqueness check, description),
  Instructions (numbered steps, add / remove / reorder), Safety notes, Muscles (primary
  select from constants, secondary tags from constants), Details (equipment, difficulty,
  movement pattern from constants), Media (image URL and video URL, optional), Status
  (Draft / Published / Archived with their descriptions). Buttons: Save draft, Publish,
  Archive (confirmation dialog with a clear consequence: "Archived exercises disappear
  from the library and from new AI plans. Existing plans and logs are kept."). Inline Zod
  validation; publish blocked until name, slug, primary muscle, equipment, difficulty and
  at least one instruction are present. Buttons disabled while saving; visible save
  status; warn on unsaved changes.
- URLs: accept only https URLs (reject javascript: and data: URLs); show the image
  preview only if the URL loads, with no claim of verification.
- Do NOT implement: "REF-EX-4092", "Biomechanical Specification & Platform Execution
  Registry", "PRIMARY INDEX", "KINEMATIC VECTOR", "Biomechanical Specs" (use "Details"),
  "Last saved ... by Admin" (use "Last updated <date>" only), image dimensions text, "Valid
  secure HTTPS video stream verified", the helper line about a mobile warning banner, and
  muscle names that are not in the shared constants (for example "Chest (Clavicular
  Head)").