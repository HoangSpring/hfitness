# Active workout + summary notes
General
- Stitch files are visual references only. Rewrite as React components using design
  tokens and translation keys (AGENTS.md section 11). Do not hotlink Stitch images.
- Plain, beginner-friendly English. Show only data that exists. Never display invented
  numbers, praise text or scientific claims.

SESSION (/workout/session/:sessionId)
- Implement: top bar (back, plan day name, running elapsed time computed from
  started_at, Finish), progress "Exercise X of Y" with segmented bar and "Next: <name>",
  exercise card (name, primary muscle tag, target "N sets x min-max reps", previous
  performance line from the user's latest COMPLETED session or "No previous data"),
  set table (set number, kg, reps, optional RPE, Complete button; completed rows show
  their values with a check, NOT strikethrough; edit and delete per row), "Add extra
  set", rest timer (appears after completing a set, uses the planned rest seconds,
  "+30 s" and "Skip"), Previous exercise / Next exercise, "Abandon workout".
- Tip text under the previous-performance line: show the exercise's safety_notes
  (first sentence) only if present; otherwise show nothing.
- RPE input must match the database column type and the CHECK constraint (1-10); do not
  accept values the column cannot store (if integer, whole numbers only).
- Dialogs: "Finish workout" (when some exercises have no logged sets, list how many) and
  "Abandon workout" (clear consequence: this session will not appear in history). Both
  need Cancel and Confirm.
- Do NOT implement: "Toggle New User State", the "Inspect workout modals / Preview ..."
  buttons, any decorative preview controls.

SUMMARY (after Finish)
- Implement: check icon, "Workout complete", "<day name> finished" (no praise or
  evaluation text), four stat cards: Duration, Exercises completed (X of Y that have at
  least one logged set), Total sets, Total volume (sum of weight x reps, kg).
- If every logged weight is 0 or empty (bodyweight workout), replace the Volume card
  with Total reps; never show "0 kg" as an achievement.
- Personal records section: exercises whose heaviest weight today beats all earlier
  COMPLETED sessions (ties are not records; no PRs when weights are 0). Empty state
  "No new records this time".
- Exercise breakdown: per exercise name, number of sets, top set (weight x reps),
  volume; PR marker as an icon plus the text "PR", not color alone.
- Buttons: "Done" -> /workout and "View history" -> /workout/history.
- Do NOT implement: "Session telemetry archived", "Solid execution...", "Work & top
  sets", "Accumulated load", the "Detected / Empty state" toggle.