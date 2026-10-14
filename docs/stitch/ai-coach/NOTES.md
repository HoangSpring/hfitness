# AI Coach notes
General
- Stitch files are visual references only. Rewrite as React components using design
  tokens and translation keys (AGENTS.md section 11). Use the app's own sidebar and logo
  (with "AI Coach" active); do not hotlink Stitch images. Plain, beginner-friendly
  English. Make sure the HTML declares UTF-8 and that sample text with the bullet
  character renders correctly (the mockup shows "â€¢" which is an encoding bug).
- The conversation text in the mockup is invented sample content. The real coach only
  uses the data supplied by the context builder; never hardcode sample advice or sample
  numbers in the UI.

Implement
- Layout: conversation list on the left (New chat button, chats grouped by date as
  "Today" and "Earlier", one shared icon, title and time; delete action with
  confirmation), chat area on the right. On mobile the list opens from a menu button.
- Chat header: the conversation title only.
- Messages: user messages in a card, coach messages with a small coach icon and two
  labelled sections "Recommendation" and "Why" when the reply follows that format
  (render as plain text; if the reply does not follow the format, render it as one
  block). Timestamps formatted with Intl.
- Typing indicator while waiting; input with send (Enter sends, Shift+Enter newline),
  character counter (max 1000), disabled while a request runs; always-visible
  disclaimer: "AI Coach gives general fitness guidance, not medical advice."
- Suggested prompt chips (empty chat only): "What should I train today?", "Why is my
  progress slow?", "What should I eat after my workout?".
- States: empty chat, loading history, error with a "Try again" button that resends the
  last message, daily limit reached (input disabled with the friendly message), no
  conversations yet.
- Render all assistant text as plain text with line breaks and simple lists; never inject
  HTML.

Do NOT implement
- The top search bar, notification bell, "TODAY" pill, avatar photo, "Pro Plan",
  "Telemetry & Core", the "INSPECT: Active Chat / Empty State / Error State / Daily
  Limit" preview bar, "Telemetry Node", "Syncing with workout telemetry", "AI Coach
  Ready" status, "4 active logs", the "Focus: ..." line, per-topic conversation icons,
  the refresh and three-dot buttons (unless they perform a real action), and any claim
  that the coach adjusts routines.
- Title is "AI Coach" with the subtitle "Ask about your training, nutrition and
  progress". No model names, no "powered by", no attachments, no voice input.