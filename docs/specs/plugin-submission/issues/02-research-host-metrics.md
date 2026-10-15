# 02 · ChatGPT host metrics for widgets

Type: research
Status: closed

## Question

What does ChatGPT send and do for an MCP Apps widget on iOS, Android, web and desktop: display modes, safeAreaInsets, containerDimensions and maxHeight, the composer overlay in fullscreen, inline height limits, theme, and locale? Which values must the app read for layout?

## Answer

Report: [02-chatgpt-host-metrics.md](../../../research/plugin-submission-2026-10-15/02-chatgpt-host-metrics.md) (checked: 8 claims, 2 corrected).

- No OpenAI source gives inset, header or composer numbers. The app must read the host's safe-area insets at run time. OpenAI's sample uses the insets only, with no composer gap: this confirms the fault-round-1 fix (the larger of gap and inset).
- The widget asks for fullscreen with no tap on an inline mount (`app.ts`, connect). OpenAI says to change the mode only after a user action. That is a decision for the owner (approval item D7: open fullscreen at once).
- Clamp insets to 0 or more (fault round 2, F30). Add harness personas: ChatGPT iPhone {102, 118}, no insets {0, 0}, device only {59, 34} (ticket 06).
