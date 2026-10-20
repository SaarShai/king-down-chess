# Keep the result when a rematch board load fails

Type: task
Status: claimed

## Plan and scope

Extend the existing compiled `plugin-ui-http` rematch journey. Keep its lost successful rematch reply and same-command retry. Refuse the first subsequent `kingdown_resume` before the board load. Check that the old result and its recovery remain visible on phone and desktop, then retry Resume.

This adds one fault to the existing local host. It adds no product endpoint or product behavior and changes no CSP, result policy or service transaction.

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
