# Landing page notes
- Stitch files are visual references only. Rewrite in React with design tokens and
  translation keys. Do not hotlink Stitch image URLs; use placeholders or neutral
  illustrations. Plain, beginner-friendly English.
- Implement: top bar (Logo, Features [scrolls to section], Exercises, Log in,
  Get Started; no avatar), hero ("Personalized gym training and nutrition powered by
  AI.", buttons "Get Started" -> /register and "Explore Exercises" -> /exercises),
  3 steps (Tell us about you / Get your plan / Track your progress), 4 feature cards
  (AI workout plan, Exercise library, Nutrition tracking, Progress tracking), FAQ
  (4 items), final CTA, simple footer with the current year.
- Hero visual: a static, clearly illustrative preview of "Today's workout" and
  "Nutrition today" with sample data. Do NOT show "Live metrics", "Neuromuscular
  readiness", "Protocol_07" or any metric the product does not have.
- Feature copy must match the MVP: plans are generated from goal, schedule and
  equipment (no automatic adaptation); nutrition targets are calculated from the profile
  with a standard formula; progress = weight, workouts and nutrition summaries.
- Do NOT implement: the "0.05s Metric latency" and "100% Custom adaptation" stats, the
  secondary tag lines on feature cards, Resources and Legal footer columns, "© 2025",
  testimonials, pricing, user counts.
- Logged-in users visiting "/" are redirected to /dashboard.