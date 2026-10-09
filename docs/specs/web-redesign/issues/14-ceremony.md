# 14 · The end: the Ceremony

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 02c, 03, 07, 11

## Scope

- Owner choice: the end of a game, B, the Ceremony (our pick of its form): the final blow again at half speed, the king falls, "King Down" settles in, three tiles rise. Decisions D3 (the end starts on the press, or on a send that succeeds) and D8 (which games).
- Demo: `feat-king-down` option B (`end.js`: `runCeremony` 326–368, `renderResult` 183–216, `tileList` 219–232; `end.css`). Its notes: "A loss and a draw always end quietly."
- Files: `src/main.ts` (`result`, `showOver`, `listMoments`, the result close; call lines only); `index.html` (`#over` becomes a result pane); `src/render/PaintedView.ts` (a speed option on `animateMove`); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (`setSpotlight`); a new pure `ceremonyPlan` and its test; a pure timing module beside `scene.mjs` (spec rule 8); `src/style.css` (the dialog king fall goes); new `tools/verify-end.mjs`; `tools/verify-game-screen.mjs` (the end state); `verify-king-effects.mjs`, `verify-painted-game.mjs`, `qa.mjs`, `tools/ux-defects/` d1, d4, d9, d10.

## Plan

1. [x] The board plays the four beats, then today's result dialog opens with the tiles. The dialog's second king fall goes.
2. [x] D8 plays your win against the computer, your link win, or any mate on one device. A loss, draw and Resign stay quiet.
3. [x] The final blow skips a trailing pass. It plays through `animateMove` at speed 0.5. The king falls; "King Down" settles in; up to three tiles rise.
4. [x] The final blow and up to two special moves form the tiles, with the winner's moves first. A tile opens Review at its ply. Key-moment search starts from Review.
5. [x] A board tap, Escape, Space or Enter skips. A hidden tab, Off and reduced motion show the end frame. The result is spoken once. Rematch gets focus and works by pointer from the first frame.
6. [x] A new game cancels every old wait. Open sheets keep their keys and focus. The result waits behind a sheet. New game cancels the pending result when it opens.
7. [x] A staged end waits for the press or a successful send. Undo before the press removes it. A king capture has no fallen king.
8. [x] "Copy today's result" keeps its id, words and copy path.

## Verification

- [x] The D8 unit test checks wins, quiet results, one device and a link.
- [x] `end` checks the board fall, tiles, Review, skip, quiet results, focus, first-frame Rematch, sheet keys, New game and Clay.
- [x] `w6-parts` checks half speed, a trailing pass, tiles, skip keys, Off, reduced motion and old waits.
- [x] `npm test`, the type check and all ten named browser checks pass. Both new checks pass twice. The plugin page size is in Comments.
- [x] Sample W6 has phone and desktop sheets and one phone video of an Archer mate. All five renders pass. Both sheets get a visual check.
- [ ] The owner gives yes on the sample.

## Risks

- The sequence is longer than the earlier motion rule (2.6 s), and a long Beast chain at half speed adds more. The owner chose the Ceremony; the skip and Rematch from the first frame keep control with the player.
- A mate by a power move (Strike) must replay the power move.

## Does not do

- No Retry (ticket 23), no new sharing, no crowns.

## Comments

Four beats play before today's result dialog. Up to three tiles open Review.
Your win and any mate on one device play it. A loss, draw and Resign stay quiet.
New game cancels the old end. Other sheets keep their keys and focus.
The result waits behind Menu. Review starts the key-moment search.
Cut: the result pane, spotlight and new plan and timing modules.
Tests: 1644 passed, 13 skipped; 50 motion tests pass. Type check passes.
All ten named checks pass after the merge; end and parts each pass twice.
End: 16.6 s and 15.8 s. Parts: 3.1 s and 3.1 s. Both plugin checks pass.
Plugin page: 4,294,665 bytes. Sample W6: five renders and two sheets; no fault.
The sample waits for the owner's yes. Integration runs the full suite.

## W6 integration

Plan: merge W6 without a fast-forward. Keep Previously and its link check. Keep rewind, the tell and the Ceremony. Run the unit tests and the browser checks of both sides, then commit and push the integration branch.
Pass criteria: the unit tests, browser checks and pre-push tests pass. The worktree is clean after the push.

The starting head is `c6e42cb3e86d7452fc95a3b2cea0825632fa6f29`.
Two files have conflicts. Keep the Previously import in `src/main.ts`. Keep the link-game check and add the end check in the registry. Review and reset keep both units' cancel calls.

`npm test` passes: 93 files pass, 1 skips; 1,658 tests pass, 13 skip. All 50 board tests pass. Typecheck passes.

The supplied M1 launcher selects this Mac. All 25 named browser checks pass: link-game, painted-game, ux-defects, game-screen, their-turn, menu-extra, powers, read-piece, verb-marks, home, visual-design, turn, qa, new-game, plugin-ui, plugin-ui-http, lessons, lesson-return, special-moves, account, king-effects, workshop, end, w6-parts and playable-clay.

No timeout needs confirmation. Both plugin checks pass; the HTTP check uses the documented disposable local database. No source fix is needed after the conflict resolution. The sample still waits for the owner's yes.
