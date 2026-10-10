# 02 · The split, step 1: the leaf modules

Status: ready-for-agent
Blocked by: 01 (merged; it lets two check runs share this Mac). The branch may start now; its full check run waits for 01.

## Scope

- [Spec §4](../spec.md#4-part-b-the-game-screen-split), order 2. The parts that own no game move out of `src/main.ts`: the Guide, the settings controls, the save helper, the links, the keyboard cursor and the moments. Pure helpers get unit tests first.
- Files: new `src/ui/guide.ts`, `src/screen/settings.ts`, `src/screen/save.ts` (+ test), `src/screen/links.ts` (+ test), `src/screen/keys.ts`, `src/screen/moments.ts` (+ test); `src/main.ts`; `src/account/sync.ts` (reads the shared settings field list; its test); the `main.ts` comments in `tools/*.mjs` and `src/` (not in plugin modules); the dead exports of audit finding 15 as one small commit.

## Plan

1. [x] Tests first: `gameLink` as a pure function of (origin, pathname, rules param, kings, backRank or fen, lans); the `Save` settings field list equals `src/account/sync.ts` `SETTINGS`; `settingsNow` as a pure function of plain control values; `pieceArt` and `kingArt` paths.
2. [x] `src/ui/guide.ts`: `connectGuide({ shownPos, preset })` with `fillPieceGuide`, `pieceText`, `pieceArt`, `kingArt`, `usesText`; the Guide button. One move-only commit.
3. [x] `src/screen/settings.ts`: the controls (sound, queen, threats, pace, labels, coords, look, Reset view), `applyPace`, `applySettings`, `settingsNow`; returns `{ applySettings, settingsNow, pace(), ... }` for the others. One move-only commit; the `onchange` handlers call `save` through a dep.
4. [x] `src/screen/save.ts`: `Save`, `SAVE_KEY`, the settings field list (exported; `sync.ts` imports it), `readSave`, `writeSave(snapshot)`. The game snapshot comes from the caller. One commit.
5. [x] `src/screen/links.ts`: `gameLink`, `gameLinkless`, Copy, Share, `copyAndSay`. One commit.
6. [x] `src/screen/keys.ts`: `connectKeys({ board, selected(), candidates(), inspected(), flipped(), game(), click, say })`: the board focus, blur and keydown, `sayCursor`, `homeSquare`, the page keydown. It owns the cursor square and gives `cursor()`; `drawMarks` (the threat marks) stays in `main.ts` and reads it. Keys own input and send commands; they compute no threats. One commit.
6b. [x] `src/screen/moments.ts`: tests first for `soundsFor(kind, move)` (the launch and hit sounds as today's `commit` picks them), `resultText`, `shareResultText` and the end-reason text of `showOver`; a probe or unit test for the hover preview of a moment if none exists (`rg -n "share-result|#moment" tools`). Then `connectMoments({ game, sides, resigned, daily, skill, generation, engine, showPly, refresh, hint })` returns `{ said(), say(line), restore(), preview(sq, ready), result(), showOver(), listMoments(), marked(), reviewNote() }`; `marked` and `reviewNote` move with it and `refresh()` reads them through the object. One move-only commit; the sounds as a logic commit.
7. [x] Comments that name `main.ts` in `tools/*.mjs` ("skip the title screen (main.ts)") and in `src/` modules that the plugin does not import. One commit.
8. [x] Audit finding 15: remove `GP_NAMES`, `lookSpec`, `doneGames`, `setUseSculpts` and `src/plugin/view.ts` (import the type directly). One commit. Record the plugin page size before and after (`src/plugin/app.ts` imports `view.ts`): `node tools/plugin-ui-build.mjs`.

## Verification

- [x] After each commit: `npm run typecheck`, `npm test`, and the named checks: guide → `read-piece`, `lessons`, `menu-extra`; settings → `painted-game`, `playable-clay`, `ux-defects`; save → `account`, `link-game`, `lesson-return`; links → `link-game`, `their-turn`; keys → `cursor-adoption`, `game-screen`, `ux-defects`; moments → `end`, `their-turn`, `game-screen`, `special-moves`.
- [x] Before the pull request: the full `npm run check:browser` passes, with `playable-clay`, `lesson-return` and `account` (the state risks of spec §4.4); `plugin-ui` and `plugin-ui-http` pass (commit 8 touches a plugin import).
- [x] `vite build` before and after: the same chunk names, the same precache list, the same CSS order (the compare script in Comments).
- [ ] (Skipped; see Comments.) Renders of `samples/00.mjs` and `W1.mjs` to `W12.mjs` from a build of main and of the branch, phone and desktop, compared with `sharp`: zero pixels differ in every state with no computer move (Comments: the list and the counts).
- [x] `wc -l src/main.ts` and the top-level `let` count before and after (Comments).

## Risks

- A module reads `view` or a control at import time: the rule is a getter or a dep; typecheck does not catch it, the browser checks do (a blank page).
- A moved handler loses its `this` or its closure over a `let`: every moved closure takes a getter.

## Does not do

- No game switching moves (ticket 03). No table snapshot (ticket 04). No change to `src/plugin/app.ts` behaviour. No Workshop change.

## Comments

- 2026-10-09, branch `claude/split-leaf`, 11 commits on main 2d5b5155. Item 6b has three commits: the moment texts as pure functions with tests, `soundsFor` (the logic commit), then the move.
- `src/main.ts`: 1,348 lines and 35 top-level `let` before; 1,017 lines and 31 after.
- `npm test` after each commit; at the end 99 files, 1,756 tests pass (13 skipped), node 50 pass.
- The named checks pass after each code commit (the two 6b logic commits share one run; item 7 changes comments only). The full `npm run check:browser`: 25 of 25 pass (805 s of checks).
- `plugin-ui` passes. `plugin-ui-http` fails at once with no `PLUGIN_TEST_DATABASE_URL`; with the local test database of `docs/plugin-preparation.md` it passes. `npm run plugin:check:protocol` passes.
- Item 8: the plugin page from `node tools/plugin-ui-build.mjs` is 4,296,101 bytes before and after, with the same sha256 (`f255a4dd…798c`). The audit missed two importers of `src/plugin/view.ts`: `tools/plugin-protocol-check.ts` and `tools/plugin-protocol-fixture.ts`. They now import the type from `src/match/service.ts`.
- `vite build` of main and of the branch, compared with `ls dist/assets | sed -E 's/-[A-Za-z0-9_-]{8}\././' | sort` and the `PRECACHE` line of `dist/sw.js` with the hashes removed: the same 36 asset names and the same 170 precache entries. Both CSS files have the same names and hashes. `index.html` is the same with the hashes removed. The account chunk is byte-identical. The main chunk grows by 2,554 bytes (the getters and the module wrappers); the clay chunk loses 30 bytes (`setUseSculpts`).
- The pixel render compare of `samples/*.mjs` is not done: the parent agent said to skip it for this ticket.
- `sync.ts` does not import the settings field list at run time. A trial run-time import made Vite put `save.ts` in a new shared chunk. `sync.ts` uses `import type { Save }` with `satisfies (keyof Save)[]`, and `save.test.ts` holds the two lists equal.
- `$('over').onclose` stays in `main.ts`: it starts a new game, which is ticket 03 (spec §4.2 rule 2).
- `connectMoments` gives `say`, `start(line)`, `played(pre, m)` and `preview(ready)` in place of `said()` and `preview(sq, ready)`: no caller needs `said`, and `main.ts` already finds `ready`. The hover preview had no probe; it now has a unit test.
- `connectKeys` also takes the commands that the keys send: `escape`, `undo`, `step`, `resetView` and `read`. The listener order stays the same.
- The look control moved into `connectSettings`, in the same synchronous part of the start-up. Each connect call is placed so that no closure runs before its const exists.
- Item 7 changes three comments. The other comments that name `main.ts` stay, because that code is still in `main.ts`. Comments in `src/plugin`, `src/match` and `src/workshop` are out of scope.
