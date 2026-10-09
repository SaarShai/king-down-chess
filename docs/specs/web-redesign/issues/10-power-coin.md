# 10 · The power coin by the portrait

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Needs: 03 (met)

## Scope

- Owner choice: King powers B, a coin by the portrait. The coin shows no name. A tap reads the power and its state in the context line. Use arms it, as decision D7 says.
- Demo: `feat-king-powers` option B. The coin, emblem and diamond notches use `demo.css` lines 86–95.
- Files: `src/powers-ui.ts` and its test; `src/ui/coin.ts`; `src/ui/powers.ts`; the table and context line; the game call lines; the check helpers; the powers check; `samples/W3.mjs`.

## Plan

1. [x] Read the shown power in `coinState`: ready, armed, used, always on, waiting, no target or no power. Read uses and the full move number from the shown position and history.
2. [x] Put a coin by each portrait. Show the emblem, diamond notches, armed gold and used grey. Keep each off coin in the Tab order with `aria-disabled`. A side with no power has no coin.
3. [x] A tap reads. Legal Use arms. Cancel, Esc or a second tap disarms. A power with no legal action says why. Keep Use off in Review and before the turn press.
4. [x] March and Leap only read. Their moves stay among the ordinary moves. The shown use count sets the notches. Undo restores a use.
5. [x] Cut the cast motion and its timing module, as the fast plan says.
6. [x] Cut the coin flip, as the fast plan says. Keep today's move line.
7. [x] Remove the old power button and status. Bind the first coin to the portrait in a row. Card coins can join the row later.

## Verification

- [x] Pure tests cover ready, armed, used, always on, no power, waiting, no target and unlimited uses. They cover move 12, Undo, Review and the staged turn guard. Each new branch first fails, then passes.
- [x] The powers check has five cases: a tap reads; Use arms; Freeze; Used on move N with Undo and Review; an always-on coin only reads. It also checks no power, no target, cancel paths and the staged turn guard. It passes twice.
- [x] The full `npm test`, typecheck and all named checks pass. The plugin page keeps its default.
- [x] `W3.mjs` renders ready, armed, used and always on at 390×844 and 1440×900. Eight renders have no faults. Both contact sheets have a visual check.
- [ ] The owner's yes on the sample.

## Does not do

- No cast motion, coin flip or card coins. No new king art or turn countdown ring.

## Comments

- The rows show both coins by their portraits. A tap reads. Use arms. Cancel and Esc disarm.
- The shown position sets the uses and notches. Undo restores a use. End turn keeps the next coin off.
- Cast motion and coin flips stay out. No card coins ship. The review checks the owner's words and the fast plan.
- `npm test`: 87 files pass, 1 skips; 1,571 tests pass, 13 skip. All 50 artwork tests pass. One worker runs all test paths.
- The powers check passes twice. turn, qa, visual-design, game-screen, new-game, ux-defects, plugin-ui, plugin-ui-http, lessons and lesson-return pass.
- The M1 launcher uses this Mac. The plugin page is 4,292,542 bytes; it is 4,291,968 bytes before the W5 merge.
- The sample shows four states at phone and desktop sizes. Eight renders have no faults. Both contact sheets are 2,396 px wide.
- The sample waits for the owner's yes. No push or deploy occurs.
- The commit objects show the required trailer on all W3 commits. History stays intact.

## W3 integration

Plan: merge W3 without a fast-forward, keep the coin controls, piece reads and Home behavior, run the required checks, then push the integration branch.
Pass criteria: `npm test`, the affected browser checks of both sides, and the pre-push tests pass. The worktree is clean after the push.

The starting head is `dd9f8f3bec47b1513fc602b71db6cb2b09b1e989`. Five files have conflicts. Keep All rules beside Use and Cancel. Keep the piece read priority with the coin read, both imports, the Home refresh and board tap, and the Home key guard. Escape clears both reads. Keep single-line action labels and 44 px targets.

`npm test` passes: 91 files pass, 1 skips; 1,631 tests pass, 13 skip; all 50 board tests pass. Typecheck passes.

The supplied M1 launcher uses this Mac. All 18 named browser checks pass: powers, read-piece, verb-marks, home, visual-design, turn, qa, game-screen, new-game, ux-defects, plugin-ui, plugin-ui-http, lessons, lesson-return, special-moves, account, king-effects and workshop.

The first plugin-ui-http attempt cannot start because its test database variable is absent. The documented disposable local database is available. After schema setup and setting that variable, the check passes in 15.5 s. No timeout needs confirmation. No further source fix is required.

The sample still waits for the owner's yes.

## Board review fixes

Decision: decided by delegation (2026-10-09).
Coin size follows the strip: their coin is 44 px; your coin is 48 px.
Both coins use 44 px on short phones. The armed coin has a dark outer ring.
The powers check covers both board sides and the armed ring.
W3: 15 inspected renders, 0 faults. Tests and all required checks pass.
