# Ticket 26: the owner's CSS and layout picks (G2, Q3, Q6)

Status: claimed
Type: task

## Scope

Build the owner's picks G2 a, Q3 b and Q6 b on `claude/od-picks`. The
approval page is 2026-10-17. Build nothing else.

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

No change is made. The full `npm test` and the browser checks stay green on the untouched code.

## Checks

Filled in after the full `npm test` and the browser checks.
