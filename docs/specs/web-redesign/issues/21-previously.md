# 21 · Link games: Previously

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: none

## Scope

- Owner choice: Online play A, Previously. The friend's move plays once, with one line and See again.
- Follow [the fast plan](../fast-plan.md#21--previously--simplify-w11). Use `describeMove` for both move lines.
- Keep the link question and error alerts. W1 holds the send words; W2 holds the context line.

## Plan

1. [x] Find the friend's last turn from the side before each ply. Keep Haste, a free mark and move, Rage, and Rally whole.
2. [x] Draw the board before the friend's turn. After the link question and board load, wait 300 ms and play the turn once with its sounds. Stop on a game or review change.
3. [x] Show Previously with the friend's move line, your last move above it, and See again. During replay, the board takes no move.
4. [x] With Motion Off or reduced motion, show the same line without replay or See again. A first link has no prior move line. An incomplete link does not replay.
8. [x] A reload does not replay; the link leaves the address.

## Verification

- [x] Pure tests cover a plain move, Haste, a free mark and move, a free pass, Rage, Rally, the first link, and motion rules.
- [x] Context tests cover rank, both lines, and the replay action.
- [x] The three `link-game` cases cover play once, See again, and the Undo limit. They also check Motion Off, refresh, and reload. The W1 link checks still run.
- [x] Typecheck, the full unit tests, and the named browser checks pass. The new check passes twice.
- [x] One Previously still is captured at phone 390×844 and desktop 1440×900. Both contact sheets pass the review.
- [ ] The owner's yes on the sample.

## Risks

- A game change can stop the replay. Replay reads history and does not change it.
- A link carries the army and kings, not the full rules.

## Does not do

- No open-link sheet, resignation line, alert change, new send words, or video.
- No live play, chat, or invite before the first move.

## Comments

Previously uses the real move animation and sounds; See again keeps the same history.
The fast plan cuts the sheet, resignation line, alert change, send words, and video.
Typecheck passes. Unit tests: 1545 pass; 13 skip. Motion tests: 50 pass.
Browser checks pass: link-game, painted-game, ux-defects, game-screen, their-turn.
The new link-game check passes twice; existing W1 link checks remain.
The defect check waits for replay to end before board input.
The supplied M1 script selects this Mac after its M1 window closes.
Both sample sheets are inspected; the sample waits for the owner's yes.
Merge d9ede53 keeps conflict notes after its credit line; history stays intact.
