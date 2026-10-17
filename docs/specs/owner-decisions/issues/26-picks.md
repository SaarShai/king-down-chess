# Ticket 26: the owner's board and layout picks

Status: claimed
Type: task

## Scope

Build the owner's picks G2 a, Q3 b and Q6 b on `claude/od-picks`. The
approval page is 2026-10-17. Build nothing else.

The next part adds G1 a and G3 a. G2, Q3 and Q6 stay as built.

## G1 and G3 plan

1. Put the target words before the rule for an armed card or power. Use the
   approved words for a square target and for a piece with a destination.
2. Keep the approved shove and swap preview. The first tap or drag onto your
   own piece shows the result. The second tap plays it. A tap on another square
   ends the preview and only selects or reads that square.
3. Test the words, marks, draft state, drag, keyboard and cancel paths. Check
   320 x 568, 393 x 852 with touch, and 1280 x 800 on the built page.
4. Prove the new tests fail on the old source. Run `npx tsc --noEmit`,
   `npm test` and the required `plugin-ui` runner. Commit on `claude/od-picks`.

Pass criteria: target words come first; only the previewed move has marks; a
tap elsewhere plays no move; a second target tap adds one draft step; no move
is sent before End turn. All required checks pass with their current limits.

## G1 and G3 build

- G1 uses the approved target words for a square target and for a piece with
  a destination. The card or power rule follows those words.
- G3 shows only the previewed shove or swap. A second target tap adds the
  draft step. An empty square clears the selection. An enemy piece opens its
  rule in the context line. Your own piece becomes selected. None of these
  other taps plays a move. A drag onto your own target piece shows the preview.
- Escape, Cancel, Undo, a stale board and a new board state clear the preview.
  The tests also check keyboard play and an armed Sky Lift swap.
- The built-page check covers both target word forms, shove and swap, a tap
  elsewhere, a drag and one Undo at all three required screen sizes.

The old source fails all nine new board tests. The other 76 board tests pass.
The log is `tests-26-board-before.txt` in the lane's scratch folder. The type
check and full test suite run next. No test or check time limit changes.

Taste: no new choice. The build uses G1 a and G3 a as approved, including the
drag rule. G2, Q3 and Q6 need no further change.

The first completed browser check finds that the long armed card rule makes
the draw row grow in short landscape. The armed text now keeps the existing
two-line height. The rule scrolls after the target words. A test checks the
row height, board size and scroll. This uses one CSS rule. It needs no saved
size or resize handler. The type check passes after this fix.

The next browser run passes the row-size check. The new 320 px case then finds
a check helper fault: `boardBox()` requires a width above 250 px. A small phone
can have a smaller board. The helper now waits for stable, nonzero bounds.
The tap, drag and draft checks still test the board through its visible squares.
The 10 s limit stays the same.

## Build

- G2 a "Dim to 0.85": a spent card coin dims to 0.85, not 0.7. The coin still
  opens its read sheet, so its word must reach 4.5 to 1. The rule is
  `#game-table .coin.card-coin[data-state='used']`. The spend pulse ends at
  0.85 too, so the coin does not step in brightness when the class goes.
- Q3 b "Larger board, page scroll": a draw offer keeps the board's size. The
  board screen makes the reply row with no board shrink: `board.ts` holds the
  board's height from the last render with no reply, pins it through
  `--board-floor`, and the screen scrolls to the replies. A fresh mount with an
  offer keeps a 210 px floor.
- Q6 b "Add a side margin and whole-word tabs": a segment name wraps only
  between words. On a 197 px (200% zoom) screen the four Collection names keep
  one line inside their labels at the small token size. The narrow status text
  keeps 12 px at each side. The side margin is already the default on this
  branch (`#context-line { margin: 0 12px }`); the rule pins it.

## Choices

- Q3: the pin uses the board's own last size, not the fixed 210 px floor. The
  210 px floor alone did not hold the board at 393 x 852 (345 to 300 px).
- Q3: the scroll applies at 899 px and under, in both orientations. The phone
  portrait rows and the short landscape rows keep the behavior.
- Q6: the smaller size is `--fs-xs` (12.5 px). "Powers" fits its label with
  about 4 px on each side.
- Q6: the side margin is a guard. This branch has no zero-margin rule, so the
  test passes before and after the change.

## The Q6 base

The Q6 item is a follow-up to the system-font build (D5 b) on `claude/od-look`
(`e63b2d98`). That branch is based on `fc45bd6f`, before the merged board, home,
end and send-turn lanes. A merge of it into `claude/od-picks` would revert those
lanes. This build keeps only the two CSS changes that the pick names. They work
in the current type.

## Tests

- `tools/plugin-motion.test.ts`: a spent card coin has an opacity of 0.85.
  Fails before the change (0.7).
- `tools/plugin-ui-style.test.ts`: the built CSS holds the 0.85 rule and the
  spend keyframe ends at 0.85. Fails before the change.
- `tools/plugin-board.test.ts`: a draw offer keeps the board width at 320 x 568
  and 393 x 852; the screen is a scroll container; the reply stays inside it.
  Fails before the change (113 to 68 px at 320 px, 345 to 300 px at 393 px).
- `tools/plugin-board.test.ts`: the narrow status text keeps 12 px at each side
  at 320 x 568 and 393 x 852. Guard: passes before and after.
- `tools/plugin-menus.test.ts`: at 197 px each Collection tab name stays inside
  its label, on one line, at 12.5 px. Fails before the change
  ("Powers left: expected 0 to be greater than or equal to 2").

## Review (26-css)

A review said that the pinned board height goes stale when the screen size changes during a draw
offer. It named `src/plugin/screens/board.ts:350-351` and `src/plugin/app.css:248`, and it expected
the board to keep its portrait height after a turn to landscape. The finding is refuted.

- The `@container table-screen (max-height: 480px)` grid at `app.css:248` sits inside
  `@media (max-width: 899px) and (orientation: portrait)` (`app.css:229`). It does not apply in
  landscape.
- In landscape at 852 x 393 the wide table applies (`src/ui/table.css:62`). Its board row is
  `minmax(0, 1fr)`, so it never reads `--board-floor`.
- A probe on the harness page measured the offer at 393 x 852: the board holds 410.66 px and the
  inline `--board-floor` is 410.65625 px. After the turn to 852 x 393 the inline value stays, but
  the board re-fits to 213 px in a 245 px screen, and the board screen does not overflow
  (`scrollHeight` = `clientHeight` = 245). No strip, reply or bar falls below the fold.
- In portrait the pin keeps the board's size and the screen scrolls. That is pick Q3 b, from
  L2 b: "the board keeps its size and the page scrolls to the replies." A re-measure on a resize
  would change the size the pick asks to keep.

No code change answers this finding. The Checks section holds the run facts.

## Test stability (gold pulse)

The full `npm test` after the review found one red test: `plugin-motion.test.ts`
"gives a spent card a short gold pulse", at both motion settings, in 4 of 7 runs.
A probe showed the cause: the coin element is detached at the read. `strips()`
rebuilds the coin row on a poll (a profile read and a computer-move timer both
call it), and Chromium reads no computed style from a detached element, so
`opacity` came back empty.

The test now polls until an attached coin reads 0.85. Five isolated runs pass. A
control run with the rule at 0.7 still fails with `expected '0.7' to be '0.85'`,
so the check keeps its strength.

## Checks

Head `90b0a503`.

- `npm test` passes. 165 test files pass, 12 skip; 2728 tests pass, 3 are
  expected fail, 144 skip. Log:
  `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/od-picks/npmtest-9.txt`.
- The `plugin-ui` browser check passes at `90b0a503` (148.4 s, M1 runner, exit 0).
  The first run hit the known `end fits at 360px` flake; the rerun passes. Logs:
  `.../lanes/od-picks/checks-26-css-10.txt` (pass) and `checks-26-css-9.txt` (flake).
