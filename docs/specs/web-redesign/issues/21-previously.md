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
Typecheck passes. Unit tests: 1567 pass; 13 skip. Motion tests: 50 pass.
Browser checks pass: link-game, painted-game, ux-defects, game-screen, their-turn, menu-extra.
The new link-game check passes twice; existing W1 link checks remain.
The defect check waits for replay to end before board input.
The supplied M1 script selects this Mac after its M1 window closes.
Both sample sheets are inspected; the sample waits for the owner's yes.
Merge W10 keeps seals at the turn press.
Merge d9ede53 keeps conflict notes after its credit line; history stays intact.


## W11 integration

Plan: merge W11 without a fast-forward. Keep Previously, Home, piece reads, and power coins. Run the unit tests and the browser checks of both sides, then push the integration branch.
Pass criteria: the unit tests, browser checks, and pre-push tests pass. The worktree is clean after the push.

The starting head is `2a1c1cf8f8412a3bbca96008cfa20afdaa12341c`.
Five files have conflicts. Keep all context actions, both sets of context tests, both table state fields, and both sets of check helpers. Keep Home refresh and first-deal choice. Review stops Previously and closes Home. Reset clears the coin read and Previously. The coin code replaces the old power button code.


`npm test` passes after the check fix: 92 files pass, 1 skips; 1,645 tests pass, 13 skip. All 50 board tests pass. Typecheck passes.

The supplied M1 launcher selects this Mac. All 22 named browser checks pass: link-game, painted-game, ux-defects, game-screen, their-turn, menu-extra, powers, read-piece, verb-marks, home, visual-design, turn, qa, new-game, plugin-ui, plugin-ui-http, lessons, lesson-return, special-moves, account, king-effects, and workshop.

The lesson-return check takes its first board snapshot during Previously. Wait for the link replay to finish before that snapshot. The repaired check passes for both looks at phone and desktop sizes. The account check detects that check edit during its run; its clean rerun passes. No timeout needs confirmation. The plugin HTTP check uses the documented disposable local database.

The sample still waits for the owner's yes.

## Batch 3 sheet fixes

Decision: decided by delegation (2026-10-09).
Both turn lines name every ply, joined with Then. Five expectations change.
The friend line comes first. You follows. Long turns scroll without a clamp.
W11 adds See again with Motion Normal and a long Haste turn at 320 px.
Tests: 1,666 pass; 13 skip. All 50 scene tests pass.
Samples: 128 renders across W2, W4, W9, W11 and W12; zero faults. All are inspected.
All nine required browser checks pass. Typecheck and the doc checks pass.

## Batch 3 repair 2

Items 1 and 2: decided by delegation (2026-10-09).

The short phone uses 14 px Previously words. A full Haste turn with See again fits the 57 px context row. The browser and W11 check this longer case.
The first line names the main take, else the last move, in at most 8 words.
The detail names every ply without rule text or a repeated mover. You follows.
At 320x568, You hides; the friend text has no scroll box or cut glyphs.
Tests pass: 1700 unit tests and 50 scene tests. The link-game check passes.
W11 adds a Haste turn with takes under the 2017 rules, where Haste can take.

Item 3: decided by delegation (2026-10-09). Sacrifice names the pawn and returned piece. Stationary acts and entries name their piece. Each bite appears in the full detail. Text uses line-height 1.25. Detail hides when the fixed row has no room. W11 adds a four-bite turn at all three sizes. Unit and link-game checks pass.

Item 3 also covers an empty Rescue mark and a pass-only link from a held turn. Each test uses a legal engine act. Rescue names the king's side when no target piece remains. The pass names the piece that stays. The summary has no blank name and the pass-only link does not throw.

## Small repair

Decision: decided by delegation (2026-10-09).
Sacrifice uses traded and the correct article. Growth names the card draw.
Rescue uses the requested plain sentence. Its full sentence has nine words with Previously; this one exact requested form has that cap. All other new summaries have eight words or fewer with Previously.
Power and card names use the Guide names and plain card names. Code suffixes do not appear.
Stationary Archer takes keep Rage or Haste. A Reaver take names its landing square.
The new Haste promotion turn needs at least four lines at 320 by 568. The check requires a hidden whole detail row, a three-line height limit and full visible glyphs above Moves.
Unit tests first fail for Sacrifice articles, new summaries, stationary powers and the Reaver landing. All text tests then pass.
