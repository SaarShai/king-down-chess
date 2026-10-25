# 05 · Stress and technical QA

Type: task
Status: closed

## Question

Run the QA protocol's technical steps (state sync, actions between two people, network and lifecycle, tool calls, abuse, soak, CSP, performance) and report faults with repro steps.

## Answer

Codex stress QA at a7edf54a (steps 0 and 16–25 of the plugin QA protocol): no blocker, 1 major, 2 minor. The 150-move soak (heap +9.52%), 500 random inputs, rules counts, state races and abuse checks pass.

- Major: a late move reply leaves the board frozen with no warning (approval F31).
- Minor: an idle board uses about 71% of one CPU core (F32).
- Minor: offline Start shows "ProtocolError: Failed to fetch" (F33).
All three go to fault round 3. Real-host checks stay open.
