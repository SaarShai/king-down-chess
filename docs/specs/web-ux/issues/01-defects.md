# Fix the web app defects D-1 to D-10

Status: ready-for-agent

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
- [ ] D-2: Hint suggests only moves that the game takes now: the goal move in a lesson, no unarmed power move.
- [ ] D-3: In review, the piece card, the keyboard cursor and the captured rows show the viewed move.
- [x] D-4: Start game over an unfinished game asks first; Cancel keeps the game.
- [ ] D-5: Strong and Club play with different time (2.5 s and 0.8 s); `play.test.ts` asserts that they differ.
- [x] D-6: No game key acts while a dialog is open.
- [ ] D-7: A finger tap that moves up to 12 px selects the piece; a mouse keeps the 6 px limit.
- [ ] D-8: Piece letters stay on after a reload and a look change.
- [ ] D-9: "Copied" shows only after the copy succeeds; a failure says so; Copy moves gives feedback.
- [ ] D-10: A tap on an enemy piece shows its card; a capture still works.
- [ ] `npm test` passes; `npm run check:browser` passes (all checks, `ux-defects` included).

## Comments

Group A (D-1, D-4, D-6), branch `claude/web-ux-fix-guards`, 2026-10-08:

- The probes `d1-resign-side`, `d4-start-asks` and `d6-keys-under-dialogs` fail on the old code and pass on the fix. `game.test.ts` tests `resigningSide`. `special-moves` now checks that Z does nothing under an open move choice (before, Z undid there). It still checks that `reset()` closes an open choice and commits no stale move: it calls Undo's handler, because an account pull also runs `reset()` there.
- D-4 in a lesson: Start game replaces the game that Return to game keeps, so it asks about that game. Follow-up: when the account brings a newer game during the lesson, Return to game opens that newer save, but the question still looks at the kept game. A later change can read the save there.
- `tools/new-game-ui.mjs` `startGame` answers OK when Start game asks, so the checks that start a game over an unfinished game work as before.
- Follow-up, WCAG 2.1.4 (character key shortcuts): Z and R are single-key shortcuts, and nothing turns them off. They now act only with no dialog open and no text field in focus. A later change adds a way to turn them off, or limits them to board focus. No setting is added now.
