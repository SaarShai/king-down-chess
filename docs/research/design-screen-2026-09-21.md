# Design-rule screen — 2026-09-21

Model jev-1.13.0, 3 runs, median probability; controls passed in every run. "ask" = top answer below 0.6 or "arguable": the owner decides with the rule quoted. Rules 1 and 6 are code and lookup. Rule 3 is partly a firing-rate measurement: pilot 200 games before trusting "satisfies".
The **owner** column holds labels written by the agent from measured history (the owner declined to label, 2026-09-21): r2 from what the piece measurably does (Templar never holds the capital, Strike and Flight are draw engines or escapes), r3 from when its reach arrives, r4 from the owner's rejection of per-game counters and multi-clause rules, r5 from the shipped move set. Treat them as provisional labels, not owner judgments. Agreement with the screen: 25 of 32 cells; disagreements are Reaver r2, Catapult r4, Squire r4, Ogre r4, Strike r2, Flight r2 and r5.
Filling the **owner** column (per rule: s / a / f) to turn this into labels; the screen is not evidence and does not reject anything.

| piece | status | r2 sharp job | r3 reach earned | r4 one sentence | r5 new move | owner |
|---|---|---|---|---|---|---|
| CONTROL Reaver (orthogonal step) | control_pass | ask (arguable 0.47) | satisfies 0.86 | satisfies 0.87 | satisfies 0.75 | a s s s |
| CONTROL guard one capture per lifetime | control_fail | fails 0.95 | satisfies 0.80 | fails 0.82 | fails 0.94 | f s f f |
| Catapult | lab | satisfies 0.74 | satisfies 0.79 | satisfies 0.77 | satisfies 0.88 | s s a s |
| Squire | proposed | fails 0.94 | satisfies 0.62 | satisfies 0.61 | ask (satisfies 0.54) | f s a s |
| Ogre | lab | ask (arguable 0.39) | satisfies 0.92 | satisfies 0.86 | satisfies 0.61 | s s a s |
| Templar | lab | fails 0.73 | satisfies 0.65 | satisfies 0.67 | fails 0.69 | f s s f |
| King power: Strike | proposed | ask (satisfies 0.56) | fails 0.64 | fails 0.80 | satisfies 0.77 | f f f s |
| King power: Flight | proposed | ask (fails 0.54) | satisfies 0.62 | fails 0.71 | ask (satisfies 0.55) | f s f a |
