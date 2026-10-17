# 04 · Fault round 1

Type: task
Status: closed

## Question

Fix the clear faults found so far: the double composer reserve and the orientation rule (board-size workflow), and the fix-round regressions (cut rule hints, clipped lines, the read-failure screen, seconds in start times). Each fix first fails a test.

## Answer

Done and merged into `claude/plugin-ui-iphone` (b15de1b7, 66738a7b, fbd76f99). Record: [ticket 23](../../chatgpt-mvp/issues/23-fault-round-1.md).

- Board at the owner's iPhone copy (393 × 852, insets 102/118): 247 → 302 px. Small phone (320 × 568, 63/84): 0 → 156 px (seat) and 158 px (board).
- Rule and state text is never cut; the board takes what the text leaves. Floors are the measured sizes, rounded down to 5 px.
- Start times show hours and minutes; a "·" never ends a line (Play and Profile); the read error shows once.
- Checks: M1 full test (149 files) and plugin UI check pass; database checks pass; read-piece flaked once on the M1 and passed 3 of 3 on rerun.
- Astra review: no blocker; the Profile separator should-fix is fixed. Two notes go on: a draw offer or a long error leaves a tiny board on very short frames (a layout choice, approval item L0); an 820 × 600 landscape frame gives an 82 px board (fault round 3).
