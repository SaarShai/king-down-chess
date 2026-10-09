# 11 · The move story: one sentence in player words, and a Review state

Status: built (the separate W2 review and sample review wait)
Blocked by: 03, 04

## Scope

- Owner choice: the move history at rest, A, one line (ticket 03 gives the line). This ticket gives its words and the open story. Advisors: show an old move in a clear Review state. Decision D12 (d): no chips, scrubber or ghost, and no "B as a Menu choice".
- Demo: `feat-move-story` option A (`tell()` 42–91, the line 168–176).
- Files: `src/move-text.ts` (new `storyLine`; `describeMove` does not change here) and test; `src/main.ts` (the Moves line, the list rows, `showPly`, `#moment`); `index.html`; `src/style.css`; `tools/app-ui.mjs` (the `lanMoves` body reads the data field); new `tools/verify-move-story.mjs`.

## Plan

1. [ ] `storyLine(pre, move, voice)` (pure): an icon, a verb (step, take, shot, shove, swap, bites ×N, power, mate) from `momentKind` and the move, and a sentence of 8 words or fewer. Voice "Your/Their" against the computer and in a link game; "White/Black" on one device.
2. [ ] The Moves line shows the piece icon, the verb badge, the sentence, "Move N" and the chevron.
3. [ ] The open list: one row for each ply with the piece icon, the verb and an event icon. A Haste turn is two rows under one number. Each row keeps its LAN text in a data field, so Copy moves, links and the checks keep LAN.
4. [ ] A row tap enters Review: the Moves header shows ◀ ▶ and "Back to game"; the board plays that move once and shows it; the live game waits. A tap on a piece reads it in the shown position (spec §4.10). Only "Back to game" or Esc goes back.
5. [ ] The one line replaces the finished-move caption of `#moment`. The preview words of `moment.ts` feed the target sentence of ticket 08.
6. [ ] Undo removes the line of the undone ply and shows the line before it, with no other words.
7. [ ] `lanMoves(page)` in `tools/app-ui.mjs` reads the data field. Every check that reads `#moves` goes through it (the list is in ticket 00), so no assertion line changes.

## Verification

- [ ] `src/move-text.test.ts`: `storyLine` has 8 words or fewer for each verb and uses the right voice; a Freeze names the side that froze, not the frozen piece.
- [ ] New check `move-story`: the line text at rest; rows = plies; a row tap enters Review; ◀ ▶ and Back to game work; a tap on a piece in Review reads it and stays in Review; Esc goes back; Copy moves gives LAN.
- [ ] The checks pass through `lanMoves`; `npm test` and `npm run check:browser` pass. `plugin-ui` does not change (`describeMove` stays).
- [ ] Rendered sample, 390×844 and 1440×900: the line after a shot, a shove and bites ×3; the list open; Review with a piece read. The owner's yes, with the date, in Comments.

## Risks

- The screen reader keeps the full `describeMove` sentence; the line must not be a second live region.

## Does not do

- No chips, no scrubber, no notation switch, no ghost replay over the live board (D12).

## Comments

W2 builds only the part kept by [the fast plan](../fast-plan.md), §2.
- Use `describeMove`, piece icons, row icons and LAN data fields.
- Keep Review and add Back to game. A piece tap stays in Review.
- Cut `storyLine`, verb badges, the arrow header and the new check.
- All checks pass; see 03 for test results and samples. The separate review and sample review wait.
