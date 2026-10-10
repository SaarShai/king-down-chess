# 02 · The split, step 1: the leaf modules

Status: ready-for-agent
Blocked by: 01 (merged; it lets two check runs share this Mac). The branch may start now; its full check run waits for 01.

## Scope

- [Spec §4](../spec.md#4-part-b-the-game-screen-split), order 2. The parts that own no game move out of `src/main.ts`: the Guide, the settings controls, the save helper, the links, the keyboard cursor and the moments. Pure helpers get unit tests first.
- Files: new `src/ui/guide.ts`, `src/screen/settings.ts`, `src/screen/save.ts` (+ test), `src/screen/links.ts` (+ test), `src/screen/keys.ts`, `src/screen/moments.ts` (+ test); `src/main.ts`; `src/account/sync.ts` (reads the shared settings field list; its test); the `main.ts` comments in `tools/*.mjs` and `src/` (not in plugin modules); the dead exports of audit finding 15 as one small commit.

## Plan

1. [ ] Tests first: `gameLink` as a pure function of (origin, pathname, rules param, kings, backRank or fen, lans); the `Save` settings field list equals `src/account/sync.ts` `SETTINGS`; `settingsNow` as a pure function of plain control values; `pieceArt` and `kingArt` paths.
2. [ ] `src/ui/guide.ts`: `connectGuide({ shownPos, preset })` with `fillPieceGuide`, `pieceText`, `pieceArt`, `kingArt`, `usesText`; the Guide button. One move-only commit.
3. [ ] `src/screen/settings.ts`: the controls (sound, queen, threats, pace, labels, coords, look, Reset view), `applyPace`, `applySettings`, `settingsNow`; returns `{ applySettings, settingsNow, pace(), ... }` for the others. One move-only commit; the `onchange` handlers call `save` through a dep.
4. [ ] `src/screen/save.ts`: `Save`, `SAVE_KEY`, the settings field list (exported; `sync.ts` imports it), `readSave`, `writeSave(snapshot)`. The game snapshot comes from the caller. One commit.
5. [ ] `src/screen/links.ts`: `gameLink`, `gameLinkless`, Copy, Share, `copyAndSay`. One commit.
6. [ ] `src/screen/keys.ts`: `connectKeys({ board, selected(), candidates(), inspected(), flipped(), game(), click, say })`: the board focus, blur and keydown, `sayCursor`, `homeSquare`, the page keydown. It owns the cursor square and gives `cursor()`; `drawMarks` (the threat marks) stays in `main.ts` and reads it. Keys own input and send commands; they compute no threats. One commit.
6b. [ ] `src/screen/moments.ts`: tests first for `soundsFor(kind, move)` (the launch and hit sounds as today's `commit` picks them), `resultText`, `shareResultText` and the end-reason text of `showOver`; a probe or unit test for the hover preview of a moment if none exists (`rg -n "share-result|#moment" tools`). Then `connectMoments({ game, sides, resigned, daily, skill, generation, engine, showPly, refresh, hint })` returns `{ said(), say(line), restore(), preview(sq, ready), result(), showOver(), listMoments(), marked(), reviewNote() }`; `marked` and `reviewNote` move with it and `refresh()` reads them through the object. One move-only commit; the sounds as a logic commit.
7. [ ] Comments that name `main.ts` in `tools/*.mjs` ("skip the title screen (main.ts)") and in `src/` modules that the plugin does not import. One commit.
8. [ ] Audit finding 15: remove `GP_NAMES`, `lookSpec`, `doneGames`, `setUseSculpts` and `src/plugin/view.ts` (import the type directly). One commit. Record the plugin page size before and after (`src/plugin/app.ts` imports `view.ts`): `node tools/plugin-ui-build.mjs`.

## Verification

- [ ] After each commit: `npm run typecheck`, `npm test`, and the named checks: guide → `read-piece`, `lessons`, `menu-extra`; settings → `painted-game`, `playable-clay`, `ux-defects`; save → `account`, `link-game`, `lesson-return`; links → `link-game`, `their-turn`; keys → `cursor-adoption`, `game-screen`, `ux-defects`; moments → `end`, `their-turn`, `game-screen`, `special-moves`.
- [ ] Before the pull request: the full `npm run check:browser` passes, with `playable-clay`, `lesson-return` and `account` (the state risks of spec §4.4); `plugin-ui` and `plugin-ui-http` pass (commit 8 touches a plugin import).
- [ ] `vite build` before and after: the same chunk names, the same precache list, the same CSS order (the compare script in Comments).
- [ ] Renders of `samples/00.mjs` and `W1.mjs` to `W12.mjs` from a build of main and of the branch, phone and desktop, compared with `sharp`: zero pixels differ in every state with no computer move (Comments: the list and the counts).
- [ ] `wc -l src/main.ts` and the top-level `let` count before and after (Comments).

## Risks

- A module reads `view` or a control at import time: the rule is a getter or a dep; typecheck does not catch it, the browser checks do (a blank page).
- A moved handler loses its `this` or its closure over a `let`: every moved closure takes a getter.

## Does not do

- No game switching moves (ticket 03). No table snapshot (ticket 04). No change to `src/plugin/app.ts` behaviour. No Workshop change.

## Comments
