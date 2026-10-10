# 03 · The split, step 2: the turn core

Status: ready-for-agent
Blocked by: 02

## Scope

- [Spec §4](../spec.md#4-part-b-the-game-screen-split), order 3. The turn core moves to `src/screen/play.ts` as one module: the state, `refresh()`, `commit`, `maybeAi`, the dialogs, input, review, `reset`, `newGame`, `undo`, Resign, the lessons' game switch, `openSaved`, `replay`, `fromAccount`, the start-up restore, and the wiring of the turn press, move moments, game end and previously. `src/main.ts` becomes the composition root.
- Files: new `src/screen/play.ts`; `src/main.ts`; the comments in `src/render/*`, `src/powers-ui.ts`, `src/turn.ts`, `src/account/*` that name `main.ts` (plugin modules in one separate small commit with the plugin checks).

## Plan

1. [ ] `src/screen/play.ts`: `connectPlay({ view, params, preset, look, guide, settings, save, moments, keys, table })` returns `{ game(), sides(), refresh, newGame, startLesson, openSaved, showPly, reset, maybeAi, ended, result, ... }`. The start-up restore stays in `main.ts` but calls `play.restore(saved, link, ...)`. One move-only commit where possible; the glue is a second commit.
2. [ ] `main.ts`: imports and CSS order, URL rules, `setEvaluator`, the view and `window.view`, the parts' connect calls, the lesson shelf, home, the account load, the start-up order with its `await`s.
3. [ ] The `main.ts` comments in `src/` and `tools/`; the plugin-imported modules (`powers-ui.ts`, `render/renderer.ts`, `render/PaintedView.ts`, `render/clay.ts`, `match/worker.ts`) in one small commit with `plugin-ui` and `plugin-ui-http` and the page size before and after.
4. [ ] `tools/qa.mjs` case "cancelling mid-search starts a clean game": press End turn (`endTurn(page)` of `tools/app-ui.mjs`) after e2-e4, so that the computer starts to think before New game. A logic commit to a check (no assertion line removed).
5. [ ] Live specs: line citations of `main.ts` in `docs/specs/web-redesign/spec.md` and `fast-plan.md` become `module:function` where the text is still live. No edit of historical reviews or `docs/tasks-archive/`.

## Verification

- [ ] `npm run typecheck`, `npm test`; the full `npm run check:browser` twice, with `playable-clay`, `qa`, `lesson-return` and `account` green (the state risks of spec §4.4).
- [ ] The build compare and the render compare of ticket 02, zero differences; the clay look, the account client and the Workshop are still separate chunks.
- [ ] `wc -l src/main.ts` and the `let` count: the target is 250 to 350 lines (Comments: the real numbers).
- [ ] `plugin-ui` and `plugin-ui-http` pass; the plugin page size before and after (Comments).
- [ ] `git diff --color-moved=zebra` of the move commit shows moved blocks, not rewritten ones; `git blame -C -C -M src/screen/play.ts` keeps the old authorship on moved lines.

## Risks

- An import cycle with `main.ts`: `play.ts` imports nothing from `main.ts`; `main.ts` passes every value.
- `window.view` must exist before the first `setLabels` (`tools/ux-defects/d8-letters-stay.mjs` wraps it): `main.ts` sets it right after the view is made, before `connectPlay`.
- The service worker's precache follows the chunk graph: a new static import of `account/*` or `workshop/*` in `play.ts` would pull them into the main chunk. The chunk compare catches it.

## Does not do

- No logic change in the turn path. No Workshop change. No plugin behaviour change.

## Comments
