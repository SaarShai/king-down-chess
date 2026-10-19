# 07 · Taste options for the owner

Type: prototype
Status: in-progress
Blocked by: 04

## Question

For each top taste item on the approval page (board layout, theme direction, king choice, card selection, quick start), what do 2–3 working options look like? Build each as a small branch with screenshots on the approval page. Do not merge.

## Motion option "Quiet" (branch `taste/motion-quiet`)

Reuse only. The selected piece shows the web lift tell (`setLifted`). On a live win, the beaten king topples (650 ms) and the end card waits for the fall; a reload shows the king down at once. A card that a live use spends gives a gold pulse while it fades (300 ms), then shows grey. Reduced motion: every final state at once. Test: `tools/plugin-motion.test.ts` (4 pass). Not merged; the owner picks between Quiet and Lively.

## Motion option "Lively" (branch `taste/motion-lively`)

Quiet, plus: the four cards deal once when a Cards game starts live (560 ms); the side in check gets one red pulse (600 ms); after the seat, the board opens when both are Ready (320 ms); a new king choice turns its emblem over once (320 ms); a live win plays the web end ceremony (topple 650 ms, "King Down" 480 ms, the card rises 320 ms; at most 1.5 s; a tap skips). Settings has a Sound switch, off by default, kept per device; the tap that turns it on unlocks audio (`src/render/sfx.ts`). Reduced motion: every final state at once. Tests: `tools/plugin-motion.test.ts` (14 pass); the 44 px coin check now measures after the deal.

## Progress

- J1 play menu: built as taste/play-hall (a94174ea, one hall) and taste/play-shortcuts (d2e83d8d, shortcuts). Taps today / a / c: quick computer 3 / 2 / 2; friend with Cards 5 / 4 / 5; resume 2 / 2 / 2; random 3 / 3 / 2. Comparisons are on the approval page (J1).
- C1 stone look: taste/stone-a (5e1b77ec) and taste/stone-b (0dfc0e25), three rounds.
- Motion (L3, C3, C4): taste/motion-quiet and taste/motion-lively (1c5a032d).
- L0 board layout: taste/layout-a (d925bb68), taste/layout-b (6c430888), taste/layout-c (454dec63).
- J2, D2, J3 quick start: taste/quick-start (67efc794). New player to first move: 7 taps → 3.
- J8 first-game teaching (research report 05, option A): taste/teach-notes (bcaf866c), notes in Beginner games only.
- J0 combined preview of the recommended picks: taste/recommended (2ca46584). An Opus UX journey review of it is in work.
- Word items W3–W6 and decisions D13–D15 are on the approval page as text options.
