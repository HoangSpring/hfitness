# Admin users notes (list + detail)
General: same rules as admin-dashboard/NOTES.md (page-title top bar, no preview toggles,
no invented data, tables never clip).

LIST
- Implement: title "Users", search (name or email, parameterized with escaped wildcards),
  goal filter using the app's REAL goal values (Lose weight, Gain weight, Build muscle, Get
  stronger, Maintain), table (Name, Email, Goal, Joined, Last activity, View), real
  pagination (page size 10-50) and "Showing X to Y of N users" with real counts, loading,
  empty and error states.
- Use the admin RPC only; email may be read from auth.users inside the RPC only.
- Do NOT implement: the three stat cards (Total registered / Active 7d / New today), the
  breadcrumb "Telemetry // Platform Registry", the descriptive subtitle about telemetry
  and cohorts, goal chips named Muscle Growth / Fat Loss / Strength & Power / Endurance &
  Stamina, fake user ids such as "usr_8921a" (show nothing or the first 8 characters of
  the real id), avatars beyond simple initials.

DETAIL (read-only)
- Implement: back link, name, email, "Joined" date, "Last activity", and four cards:
  Profile (goal, experience, days per week, session minutes), Completed workouts (count),
  Meals logged (count), AI requests (count). Counts only.
- Do NOT implement (privacy and invented data): "Verified User", Tier, "Status:
  Compliant", Sync state, "TELEMETRY LIVE", "READ-ONLY AUDIT" badge, Equipment/Split rows,
  volume lifted, average duration, completion rate, "Target pace", daily calories, protein
  target, peak timing, variance, latency, tokens billed, "Last topic key", and the entire
  "Recent Activity Telemetry" table (meal contents, workout names, weights, AI coach
  sessions or topics). Never show meal contents, weights, workout details or AI
  conversation text. No suspend, delete, export or impersonation buttons.