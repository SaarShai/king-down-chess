# Repair two draw faults

Status: resolved

Class C. Owner decision, 2026-11-22. Repair both faults in one change.

- Keep play open when a legal sequence can give mate. The audit position permits `Ba6-b7`.
- Reset the 50-move count when an Ogre pushes a pawn. Search uses the same check as the game.
- Keep each engine archive. Replay the same line on the old and new workers to check their results.

The public game tests give both bishop mates and reset the Ogre pawn push at count 99. Both compiled workers replay their own results. The type check, 5,668 scoped tests, balance check, documentation checks, and plugin and web browser journeys pass.

The independent review reads tree `74901f7da364e0f167b4035b0d2303417b5159c2` on base `96ba0f0f6dd2d2fb8d48091aec390f08256bcba8`. The repair covers the last search path and two archive paths. The same reviewer clears the repairs at tree `aee65e3f4539bc528b4fb8a8ffd8a0f7f35a1e5e`. Only this ticket changes after that review.

Browser and iOS solo saves replay on the installed build. An old draw can reopen on reload. A release needs a decision on those saves and the two-account staging pass. The waiting-Guard lab draw and the Maester pawn-swap count remain separate cases.
