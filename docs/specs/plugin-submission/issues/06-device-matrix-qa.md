# 06 · Device and settings matrix

Type: task
Status: in-progress
Blocked by: 04

## Question

Run the main journeys on simulated devices (320, 375, 393, 430/440 phones; Android 360/412; iPad; desktop with the side panel) and settings (dark, large text, reduced motion, another locale, touch and mouse), and report faults with screenshots.

## Progress

- Round 1 (Chromium, commit 2e7f6295, 27 host copies × 7 journeys, two passes): the journeys complete on 26 of 27 copies. At 200% zoom on a 393 px phone the board is 3–31 px (M1). Other faults: an 82 px board at 820 × 600 (M2), Profile rows at 320 px (M3), 36 px touch rows on iPad (M4), two "Waiting" rows that look the same (M7) and mixed date styles (M8). Dark mode (M14) and the board growth when the Abort note goes (M15) are taste items. Fault round 4 fixes M1, M3–M5 and M7–M11, M13.
- Round 2 (Sol, WebKit 26.6 and Chromium 153 on the M1, 1a18046f, 46 cases × 2 passes): 8 round 1 findings are fixed (M2, M4, M5, M7–M11) and no new fault shows. Open: M1, the 3 px board at 200% zoom on a 393 px phone (it goes to the next fault round); M13, the W mark at 4.1:1 on the darkest iPad parchment (round 5); M3, M6 and M12, names that end in '…' (accepted). Reports: docs/qa/reports-2026-10-15/06-device-matrix-round-1.md and 06-device-matrix-round-2.md.
