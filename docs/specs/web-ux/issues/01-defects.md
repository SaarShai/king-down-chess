# Fix the web app defects D-1 to D-10

Status: ready-for-human (the pull request waits for the owner)

Owner, 2026-10-08: "yes, do both." (the defect fixes and the rendered sample of the game screen, under the picks of the [review](../review.md)).

## Scope

The ten defects of [review §1](../review.md#1-defects-to-fix-first). Wrong behaviour only: no new layout, no new style. D-5 follows pick W1 B (Strong thinks a fixed 2.5 s; the Thinking time slider goes). D-10 is the one visible change: a tap on an enemy piece shows its card.

`src/render/PaintedView.ts` (D-7) also runs in the ChatGPT plugin page (`src/plugin/app.ts`). The pull request says so, for the plugin session.

## Plan

Five groups, one branch each, merged into `claude/web-ux-defects`:

| Group | Defects | Code |
|---|---|---|
| A, game guards | D-1 resign side, D-4 Start game over an unfinished game, D-6 game keys under dialogs | `src/main.ts` |
| B, Hint | D-2 Hint suggests refused moves | `src/main.ts`, lessons, powers |
| C, the viewed position | D-3 review readouts, D-10 enemy piece card | `src/main.ts` |
| D, saved settings and copy | D-8 piece letters, D-9 copy feedback | `src/main.ts`, `index.html` |
| E, levels and touch | D-5 Club and Strong, D-7 touch tap limit | `src/ai/skill.ts`, `src/render/PaintedView.ts` |

Each group adds a unit test where the logic is pure and a probe in `tools/ux-defects/` (the browser check `ux-defects`).

## Verification

- [x] D-1: Resign is off while the computer thinks. Against the computer, Resign always resigns your side.
- [x] D-2: Hint suggests only moves that the game takes now: the goal move in a lesson, no unarmed power move.
- [x] D-3: In review, the piece card, the keyboard cursor and the captured rows show the viewed move.
- [x] D-4: Start game over an unfinished game asks first; Cancel keeps the game.
- [x] D-5: Strong and Club play with different time (2.5 s and 0.8 s); `play.test.ts` asserts that they differ.
- [x] D-6: No game key acts while a dialog is open.
- [x] D-7: A finger tap that moves up to 12 px selects the piece; a mouse keeps the 6 px limit.
- [x] D-8: Piece letters stay on after a reload and a look change.
- [x] D-9: "Copied" shows only after the copy succeeds; a failure says so; Copy moves gives feedback.
- [x] D-10: A tap on an enemy piece shows its card; a capture still works.
- [x] `npm test` passes; `npm run check:browser` passes (all checks, `ux-defects` included).

## Comments

Group A (D-1, D-4, D-6), branch `claude/web-ux-fix-guards`, 2026-10-08:

- The probes `d1-resign-side`, `d4-start-asks` and `d6-keys-under-dialogs` fail on the old code and pass on the fix. `game.test.ts` tests `resigningSide`. `special-moves` now checks that Z does nothing under an open move choice (before, Z undid there). It still checks that `reset()` closes an open choice and commits no stale move: it calls Undo's handler, because an account pull also runs `reset()` there.
- D-4 in a lesson: Start game replaces the game that Return to game keeps, so it asks about that game. Follow-up: when the account brings a newer game during the lesson, Return to game opens that newer save, but the question still looks at the kept game. A later change can read the save there.
- `tools/new-game-ui.mjs` `startGame` answers OK when Start game asks, so the checks that start a game over an unfinished game work as before.
- Follow-up, WCAG 2.1.4 (character key shortcuts): Z and R are single-key shortcuts, and nothing turns them off. They now act only with no dialog open and no text field in focus. A later change adds a way to turn them off, or limits them to board focus. No setting is added now.

Group C (D-3, D-10), branch `claude/web-ux-fix-viewed`, 2026-10-08:

- D-3: `shownPos()` in `src/main.ts` gives the position on the board: in review, the move shown. The piece card, its power counts ("Freeze, 1 left"), the cursor speech and the captured rows read it. Each change of the shown move also says the cursor square again, so after Enter or Escape ends a review the cursor speech reads the live board at once. The probe `d3-review-readouts` fails on the old code at each of these readouts and passes on the fix.
- D-10 follows pick D10 of the review: only the line "That is Black's rook. White to move…" changes. With no piece selected, a tap, a click or Enter on an enemy piece shows its card, with no refusal. With a piece selected, a tap on an enemy piece that it cannot take also shows the card and clears the selection, but the help line still says why ("Not allowed: a guard can only be taken by a king.", "…would leave your king in check.", "the capture chain was cancelled"). A drag onto such a piece keeps the reason too. While the player cannot move (the computer thinks, the game is over, a game link waits for the friend, a lesson is done), a tap on a piece shows its card beside the existing help line. A tap on a marked enemy piece captures, as before. After Enter, the screen reader says the card. The probe `d10-enemy-card` fails on the old code and passes on the fix. `docs/visual-design/verify.mjs` expects the card for an enemy piece with no piece selected, and keeps the guard refusal.
- No unit test: the changed logic reads the game state in `src/main.ts`, so the probes test it.
- `src/render/PaintedView.ts` and `src/render/marks.ts` do not change, so the plugin page does not change.
- `tools/verify-ux-defects.mjs` calls `trapErrors`, as the check lint asks. The other groups have the same line, so the merge is clean.
- Repair after the check, 2026-10-08: the first fix also removed the refusals for a selected piece, against pick D10, and the cursor speech kept the reviewed board after Enter or Escape. Both are fixed as above.

Groups B, D and E, and the merge, 2026-10-08:

- D-2 (`claude/web-ux-fix-hint`): `hintMoves()` in `src/powers-ui.ts` gives the moves the board takes now: no unarmed power move, only the armed power's moves when one is armed, a lesson's goal moves only, and no promotion that Always promote to queen replaces. The search takes them as `rootMoves`. The power stays armed during the Hint search. Unit tests in `powers-ui.test.ts` and `search.test.ts`; probe `d2-hint`.
- D-5 and D-7 (`claude/web-ux-fix-level-touch`): Strong thinks 2.5 s; Club, Casual and Beginner keep their caps; the Thinking time slider and the `think` setting go, and an old `think` in the account is no settings change. `?think=` stays for the checks. A tap is past 6 px for a mouse and past 12 px for a finger or a pen (`src/render/tap.ts`), and it acts on the square under the press, in the painted and the clay boards. The plugin page gets the same touch limit. Probes `d5-level-time` and `d7-touch-tap`; `plugin-ui` passes.
- D-8 and D-9 (`claude/web-ux-fix-letters-copy`): Piece letters are a saved setting, written only when on, and the account keeps them with the other settings. `copyText()` in `src/clipboard.ts` says "copied" only after a copy succeeds, says so when it fails, and gives the focus back. Copy moves says "Moves copied". Probes `d8-letters-stay` and `d9-copy-feedback`.
- The merge into `claude/web-ux-defects`: the key handler takes group A's dialog test and group B's hint reset; the Hint "no move" line sets the help line directly; `think` leaves the settings and `labels` joins them. `npm test`: 1,399 tests pass, 13 skipped, 42 artwork checks pass. `npm run check:browser`: all 15 checks pass, `ux-defects` included; `plugin-ui` passes.

