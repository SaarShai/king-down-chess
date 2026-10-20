# Keep the result when a rematch board load fails

Type: task
Status: resolved

## Plan and scope

Extend the existing compiled `plugin-ui-http` rematch journey. Keep its lost successful rematch reply and same-command retry. Refuse the first subsequent `kingdown_resume` before the board load. Check that the old result and its recovery remain visible on phone and desktop, then retry Resume.

This adds one fault to the existing local host and repairs the existing result recovery. It adds no product endpoint and changes no CSP, result policy or service transaction.

## Acceptance

- The accepted rematch names a new game, but a failed Resume keeps the finished game and End screen.
- The old result title, reason and recovery control stay visible at 390 by 844 and 1280 by 800. Retain a screenshot of each.
- Recovery opens the same new game on the same board.
- The lost rematch reply still retries one command ID. Resume runs twice with identical arguments; recovery sends no extra rematch.
- Existing colour, route and no-read-by-game-ID assertions remain.

## Existing evidence reused

- `tools/plugin-ui-check.mjs` already checks successful solo and friend rematches, lost rematch replies, colour preservation/swap, result data read failure and small-screen result actions.
- `tools/plugin-app.test.ts` checks held result reads, held rematch Resume with navigation away, failed end reads and recovery on the result card or board. A held successful Resume does not prove a failed board load.
- `src/match/results.db.test.ts` and U07 ticket 02 cover accepted terminal receipts and one set of result effects. This browser slice does not repeat those database assertions.

## Verification state

`node --check tools/plugin-ui-check.mjs` and `git diff --check` pass. No test, build, browser or deploy runs in this worktree for this change. The next scheduled compiled HTTP check supplies the acceptance evidence; this ticket stays open until that check passes.

## Confirmed recovery fault

The integrated compiled run `app-iyECZN` reaches this case and fails. A failed Resume leaves no retained step. The next End render sends Resume again automatically, so the old result and recovery cannot remain visible. This is a product fault, not a reason to remove the new assertion.

The fix uses the existing retained command and Retry path. Its error belongs to the finished game whose `rematch_game_id` names the new board. After remount, Retry resolves the saved short tag against that accepted rematch ID; the widget still stores no full game ID. End initiates this selection once and leaves retry to the retained step.

Two focused source-harness cases reproduce the missing Retry before the product change, with and without a remount (`/tmp/kingdown-u07-rematch-recovery-red-final.log`). A pure selector case independently reproduces the missing result scope. Earlier source-test setup attempts failed before this condition and are not counted as the regression.

Independent review identifies the permanent-refusal case: Resume names the new game, but its error must appear on the old result. A third source case reproduces the hidden refusal (`/tmp/kingdown-u07-rematch-refusal-red.log`). Scope that notice to the finished game that names this rematch. Keep no pending retry after a definitive refusal and send no automatic Resume loop.

The repaired source checks pass all 30 tests in `src/account-game/state.test.ts` and `tools/plugin-rematch-recovery.test.ts`, full typecheck and 54 artwork checks. Independent review finds no remaining should-fix in refusal scope, saved-ID privacy, late reply handling or retry. The full compiled journey and staging remain the closure gate.

## Integrated acceptance

Compiled `plugin-ui-http` passes on source `9f719633`, run `app-dpkaQp`, in 235.8 seconds. It passes the complete journey and final browser error assertion. The run log and phone/desktop failed-rematch images are retained in the parent project `evidence/staging-shared-mechanics/`. This resolves the focused fault; the U05 parent still owns final staging acceptance.
