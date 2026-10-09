# 17 · Home is the table

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 03, 05, 06 (the warn line), 11 (`storyLine`)

## Scope

- Owner choice: Home A, the table (with the Today card folded into one Today line).
- Demo: `feat-home` option A (`index.html` 15–52; `home.js` 189–221, 236–247, 263–311, 344–351, 548–553; renders `table-*`, `table-finished-*`).
- Files: new `src/ui/home.ts`; `src/main.ts` (the title decision, `openSaved`, start-up, the title choice; call lines only); `index.html`; `src/style.css`; new `tools/verify-home.mjs`; `docs/visual-design/verify.mjs`, `tools/verify-account.mjs`, `tools/verify-workshop.mjs`, `tools/verify-king-effects.mjs`.

## Plan

1. [x] When a save exists and the title would show (once for each tab, with the same `kingdown.title-seen` key and `?title=0`), Home shows on the game screen in place of the title.
2. [x] Home: a top bar (the wordmark, the Menu icon); a line "vs Computer · Club" ("White vs Black" on one device; "vs your friend" in a link game) and "Move N" or "Finished"; the real board with the saved position; the last move in one sentence (`describeMove`); one crimson button; a quiet "New game"; one Today line ("Today's army · Thu 8 Oct", eight piece icons, a chevron).
3. [x] The crimson button: Continue, with "Your move", "Their move" or "Your turn is ready". A staged end is not finished (`ended()` is false): Continue with "Your turn is ready". For an ended game: the result, Rematch with a line that says what it keeps ("Same army. You play Black."), and a second button "Review last game". For a game with no moves: Continue with "A new game. You play White."
4. Cut by the fast plan: no last-turn replay on open.
5. [x] A tap on the board equals Continue (and selects a tapped piece of yours). Continue hides the Home parts at once and shows the game bar; the board does not move. The computer waits for Continue, as it waits behind the title today.
6. [x] "New game" opens the New game sheet with its warn line. The Today line opens the sheet with Today's army chosen.
7. [x] A newer save from the account while Home shows refreshes Home. A finished save opens no result dialog at start-up.
8. [x] A game link, `?fen=`, `?army=` and `?design=` never show Home.

## Verification

- [x] New check `home` (five cases): with a save, Home shows the board, "Move N", the last-move line and Continue; the computer does not move before Continue; Continue keeps the board in place (0 px); a staged turn and a staged end show "Your turn is ready", and Continue keeps the staged plies and Undo; New game opens the sheet with the warn line; the Today line opens the sheet with Today's army; an ended save shows Rematch and no result dialog; a game link never shows Home.
- [x] The affected browser checks and `npm test` pass.
- [x] The fast-plan sample has three states at 390×844 and 1440×900: a saved game, a staged turn and a finished game. Both contact sheets pass the review.
- [ ] The owner says yes to the sample.

## Risks

- The date is local: compute the Today line again on open and when the page shows again.
- Start-up order: the account, a link question and the replay can change the game during Home.

## Does not do

- No six-kings Home (B), no Today sheet, no Home button in the game bar.

## Comments
- Home reads the live save in the fixed table rows. Continue and a board tap keep the board in place; the tap selects your piece.
- The computer waits. Staged turns keep Continue and Undo. Ended games offer Rematch and Review. Account updates refresh Home; links skip it.
- Home reuses Menu, the New game warn line and Today's army. The last move uses the app's `describeMove` words, including a free mark.
- The fast plan cuts replay, fold motion and three sizes. Five check cases and three sample states remain. No Home button or Today sheet is added.
- `npm test`: 87 files pass, 1 skips; 1,542 tests pass, 13 skip; all 50 art tests pass. Typecheck passes.
- `home` passes twice (10.2 s, 7.6 s); `visual-design` 19.9 s, `account` 53.6 s, `king-effects` 99.5 s, `workshop` 64.4 s, `ux-defects` 69.1 s, `new-game` 13.1 s.
- The supplied M1 launcher uses this Mac. The full test run uses two workers and 30 s deadlines; the test script returns to its original text.
- `samples/W8.mjs` makes six renders with no fault. The review checks both contact sheets in the requested sample folder. The sample waits for the owner's yes.
