# 07 · Taste options for the owner

Type: prototype
Status: open
Blocked by: 04

## Question

For each top taste item on the approval page (board layout, theme direction, king choice, card selection, quick start), what do 2–3 working options look like? Build each as a small branch with screenshots on the approval page. Do not merge.

## Motion option "Quiet" (branch `taste/motion-quiet`)

Reuse only. The selected piece shows the web lift tell (`setLifted`). On a live win, the beaten king topples (650 ms) and the end card waits for the fall; a reload shows the king down at once. A card that a live use spends gives a gold pulse while it fades (300 ms), then shows grey. Reduced motion: every final state at once. Test: `tools/plugin-motion.test.ts` (4 pass). Not merged; the owner picks between Quiet and Lively.
