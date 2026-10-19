# 37 Owner picks: card names and Resume

Status: ready-for-human
Branch: claude/k-picks
Base: 4692477c1669db14782e0058126ad291e1664ba8

The owner approves K1 a and K2 a on 2026-10-17. The build uses the ticket in the task brief.

## Plan and checks

1. Add built-page checks. Show both failures on the base code before the build.
2. Extend the card strip rules to 440 px. Check both player names, the second coin row, and the bar at 402 × 714, 412 × 790, and 440 × 760. Check cards with and without king powers.
3. Put Resume and its detail on two lines in one button. Check full text, the accessible name, a 48 px height, and two buttons in one row at 390 × 844, 402 × 714, and 440 × 760. Keep the column below 340 px.
4. Run `npx tsc --noEmit` and `npm test`. Run `plugin-ui` through the named runner. The existing checks cover 320 × 568 and desktop layout.
5. Record the results and taste choices. Commit each complete part. Do not push or merge.

## Evidence

The final base check uses commit `63767598`. The app CSS and markup match `4692477c` (`git diff --exit-code 4692477c -- src/plugin/app.ts src/plugin/app.css` passes). The M1 runner exits 1 in 109.5 s. Both K1 and K2 fail before the build.

- K1: at 402 px without powers, the opponent name needs 81 px but gets 66 px. Your name needs 109 px but gets 86 px. With powers, your name gets 56 px. The coins stay in the name row. All six card cases have the expected four or five coins.
- K2: Resume stays on one line and is cut at 390, 402, and 440 px. The 48 px button height and the 320 px column pass.
- The first two base runs expose faults in the new test data. The final test waits for the host read and uses the valid always-on March power with cards.
- Base runner log: `scratchpad/lanes/k-picks/checks-base-3.txt` in the task scratch folder.

## Build

K1 merges the three existing card-row rules into one rule through 440 px. It applies to both strips. The base check shows that both names need the change. The zoom rules below 320 px and the desktop rules stay in place.

K2 puts Resume on the first line and its existing game detail in a `small` element on the second line. The button keeps both lines in its accessible name. The other home labels keep one line. The small line uses `--fs-xs` and normal weight. Long game names can wrap. The label helper uses text nodes so game names cannot become markup.

K1 is built in `d23eb6bf`. K2 is built in `b68bd406`.

## Check results

- `npx tsc --noEmit`: pass on `58755bab`.
- `npm test`, with `VITEST_MAX_WORKERS=1` and the required local test database URL: pass on `58755bab`. All 188 files pass. There are 3,051 passing tests, one expected failure, and eight skipped tests. All 51 document checks pass. The full run takes 1,169.14 s. The log is `scratchpad/lanes/k-picks/npm-test-4.txt`.
- `plugin-ui`, through the required runner: pass on this Mac at `5cabcc57` in 142.2 s. K1 passes at 402 × 714, 412 × 790, and 440 × 760, with cards alone and with powers. K2 passes at 390 × 844, 402 × 714, and 440 × 760. The Resume button is 53 px high. Its full accessible name passes. The 320 px home column and the existing small-phone and desktop checks pass. The log is `scratchpad/lanes/k-picks/checks-build-2.txt`.
- The app files and the browser check files still match `5cabcc57`. Later commits update unit checks and this ticket.
- `git diff --check 4692477c`: pass.

## Check repairs

The first full run finds nine checks for the old Resume text, single player row, and board width. The updated checks use the approved text and two rows. The 393 px board with host insets is 303 px wide, in place of 345 px.

Later parallel runs hit a workshop test timeout, a database role-lock deadlock, and a missed win-animation text state. The workshop file passes alone (12 tests). The database file passes alone (11 tests). No test or check time limit changes.

The motion file also exposes a random-hand fault: its pulse check can deal four cards with no legal move. The check now picks four fixed cards, which include a legal start move. It uses the existing label-click method for the card mode. All 19 motion tests pass alone. The full suite then passes with one worker.

## Taste choices and scope

The second Resume line uses the existing 12 px small-text token at normal weight. A long game detail can wrap so its words stay whole. There is no other new taste choice.

Both parts of ticket 37 are built. No part remains. The server code has no change, so `plugin-ui-http` is not required. The branch is ready for the owner's review.
