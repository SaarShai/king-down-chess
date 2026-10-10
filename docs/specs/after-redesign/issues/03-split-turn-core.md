# 03 · The split, step 2: the turn core

Status: in-review
Blocked by: 02

## Scope

- [Spec §4](../spec.md#4-part-b-the-game-screen-split), order 3. The turn core moves to `src/screen/play.ts` as one module: the state, `refresh()`, `commit`, `maybeAi`, the dialogs, input, review, `reset`, `newGame`, `undo`, Resign, the lessons' game switch, `openSaved`, `replay`, `fromAccount`, the start-up restore, and the wiring of the turn press, move moments, game end and previously. `src/main.ts` becomes the composition root.
- Files: new `src/screen/play.ts`; `src/main.ts`; the comments in `src/render/*`, `src/powers-ui.ts`, `src/turn.ts`, `src/account/*` that name `main.ts` (plugin modules in one separate small commit with the plugin checks).

## Plan

1. [x] (The deps and the commits changed; see Comments.) `src/screen/play.ts`: `connectPlay({ view, params, preset, look, guide, settings, save, moments, keys, table })` returns `{ game(), sides(), refresh, newGame, startLesson, openSaved, showPly, reset, maybeAi, ended, result, ... }`. The start-up restore stays in `main.ts` but calls `play.restore(saved, link, ...)`. One move-only commit where possible; the glue is a second commit.
2. [x] `main.ts`: imports and CSS order, URL rules, `setEvaluator`, the view and `window.view`, the parts' connect calls, the lesson shelf, home, the account load, the start-up order with its `await`s.
3. [x] (Two plugin comments stay; see Comments.) The `main.ts` comments in `src/` and `tools/`; the plugin-imported modules (`powers-ui.ts`, `render/renderer.ts`, `render/PaintedView.ts`, `render/clay.ts`, `match/worker.ts`) in one small commit with `plugin-ui` and `plugin-ui-http` and the page size before and after.
4. [x] `tools/qa.mjs` case "cancelling mid-search starts a clean game": press End turn (`endTurn(page)` of `tools/app-ui.mjs`) after e2-e4, so that the computer starts to think before New game. A logic commit to a check (no assertion line removed).
5. [x] `src/screen/keys.ts` takes the play object (or one narrow view of it) in place of its six turn-state getters, and one `commands` dep in place of `click`, `read`, `escape`, `resetView`, `undo` and `step`: the 15-dep list of ticket 02 was a transitional shape (the reviews of PR #33).
6. [x] Every step that replaces the game calls `reset()` (`gen++`) before it: `listMoments` in `src/screen/moments.ts` keeps a copy of the game across its awaits, and the `gen` guard is what makes that copy safe (the behaviour review of PR #33).
7. [x] Live specs: line citations of `main.ts` in `docs/specs/web-redesign/spec.md` and `fast-plan.md` become `module:function` where the text is still live. No edit of historical reviews or `docs/tasks-archive/`.

## Verification

- [x] `npm run typecheck`, `npm test`; the full `npm run check:browser` twice, with `playable-clay`, `qa`, `lesson-return` and `account` green (the state risks of spec §4.4).
- [x] The build compare and the render compare of ticket 02 (`docs/specs/web-ux/render-compare.mjs`, threshold 16, with a second render of main to find the unstable motion states): no stable state differs; the clay look, the account client and the Workshop are still separate chunks.
- [x] (209 lines, under the estimate; see Comments.) `wc -l src/main.ts` and the `let` count: the target is 250 to 350 lines (Comments: the real numbers).
- [x] `plugin-ui` and `plugin-ui-http` pass; the plugin page size before and after (Comments).
- [x] (With `--color-moved-ws=allow-indentation-change` and `blame -w`; see Comments.) `git diff --color-moved=zebra` of the move commit shows moved blocks, not rewritten ones; `git blame -C -C -M src/screen/play.ts` keeps the old authorship on moved lines.

## Risks

- An import cycle with `main.ts`: `play.ts` imports nothing from `main.ts`; `main.ts` passes every value.
- `window.view` must exist before the first `setLabels` (`tools/ux-defects/d8-letters-stay.mjs` wraps it): `main.ts` sets it right after the view is made, before `connectPlay`.
- The service worker's precache follows the chunk graph: a new static import of `account/*` or `workshop/*` in `play.ts` would pull them into the main chunk. The chunk compare catches it.

## Does not do

- No logic change in the turn path. No Workshop change. No plugin behaviour change.

## Comments

- 2026-10-10, branch `claude/split-turn`, 7 commits on main 50eae990 (with tickets 01 and 02): the qa repair (item 4), Resign calls `reset()` first (item 6), the move (item 1 and 2), the keys (item 5), the comments (item 3, two commits), the live specs (item 7).
- **Item 1, the deps.** The turn core is `connectPlay(view, deps)`. The deps are `params`, `preset`, `withPowers`, `look`, `fen`, `engine`, `guide`, `settings` and `home`, and four getters: `keys()`, `account()`, `setup()` and `openNewGame()`. The plan named `save`, `moments`, `keys` and `table` as deps. The changes:
  - `save`: `play.ts` imports `readSave` and `writeSave` from `screen/save.ts` and keeps `save()`: the save writes the game, so the turn core owns it.
  - `moments`: the turn core connects the moments, the game end, the move moments, Previously, the links and the turn press itself. Each of them reads only the turn core's state, so a dep from `main.ts` would only pass that state back.
  - `table`: `play.ts` imports `refreshTable` as `main.ts` did. Ticket 04 makes the table snapshot.
  - `keys`: a getter. The keys connect after the turn core, because they take the play object (item 5).
  - Guide, the settings and Home connect before the turn core. Their closures read `play` only at call time, and no connect call runs one of them. `main.ts` makes the engine before the view, as before, so the worker starts at the same time. `new Game()` now runs in the turn core, after the view; it is still the first `Math.random` draw.
- **Item 1, the commits.** The move and its glue are one commit (8122ada3). A commit with only the move does not compile, and each commit runs its checks. The glue in `play.ts`: `seat` (the players from a save or `?players=`), `restore(saved, { link, continues, urlRules, title })` (the start-up restore), the commands that the keys send, `rematch`, `homeInput` and `warning` (New game's warning). Six moved lines changed: the keys, the account, the setup and `openNewGame` come through getters.
- **Item 2.** `main.ts` keeps the imports in the old CSS order (`screen/play.ts` comes before `ui/home-view`, so `ceremony.css` still comes before `home.css`), the URL rules, `setEvaluator`, the engine, the view and `window.view`, the connect calls, the lesson shelf, the Workshop loader, the New game dialog, the start-up order with its two `await`s, and the account load. `link` and `fen` move up to the URL rules, because the turn core takes `fen`.
- **`main.ts` numbers.** 1,017 lines and 31 top-level `let` before; 209 lines and 3 `let` (`setup`, `account`, `workshop`) after. The estimate was 250 to 350 lines. `src/screen/play.ts` has 898 lines, with 27 `let` inside `connectPlay`.
- **Item 3.** Non-plugin commit (471dba55): `src/style.css`, `src/turn.ts`, `src/account/account.ts`. Plugin commit (bb5e1897): `src/powers-ui.ts`, `src/render/renderer.ts` (three comments), `src/render/PaintedView.ts` (two). Two plugin comments stay, because they are still true: `render/clay.ts` (main.ts imports it dynamically) and `match/worker.ts` (the URL rules in main.ts have the same precedence). The plugin page from `node tools/plugin-ui-build.mjs` is 4,296,101 bytes before and after, with the same sha256 (`f255a4dd…798c`). `plugin-ui` passes; `plugin-ui-http` passes with the local test database of `docs/plugin-preparation.md`.
- **Item 4.** The case presses End turn and then waits until `#status` says "thinking…", so it proves that the computer thinks when New game starts. It passes on the repair commit and in every full run.
- **Item 5.** `connectKeys(board, play, commands)`. `play` is any object with the getters of `KeysPlay` (the turn core gives them); `commands` (`KeyCommands`) holds `click`, `read`, `escape`, `resetView`, `undo`, `step` and `blocked` (Home is up). The turn core gives `blocked` as `home.visible`.
- **Item 6.** Only Resign changed: it dropped the staged plies and synced the board before `reset()`. Now `reset()` comes first. New game, a lesson, Return to game, `openSaved` and Undo already called it first. The start-up restore runs before any async work. The comment over `reset()` states the rule.
- **Item 7.** `fast-plan.md`: nine line citations become `read.ts:pieceGuide`, `read.ts:whyNot`, `screen/play.ts:choosePushOrCapture`, the Show me handler in `screen/play.ts:connectPlay`, and `ceremony.ts:startCeremony` for `setFallen`. `spec.md`: `main.ts:490` becomes `screen/play.ts:refresh`, and §4.2 says that `src/screen/play.ts` keeps the turn start (a file citation, but the sentence is live). The source list and the build rules that name `main.ts` as a file stay.
- **Tests.** `npm run typecheck` and `npm test` after each code commit; at the end 99 files, 1,768 tests pass (13 skipped), node 50 pass. `npm run test:docs` passes.
- **Named checks after each code commit.** Item 4: `qa` (the cancel case). Item 6: `ux-defects`, `turn`, `end`, `account`, `menu-extra`. Item 1: the full run, 25 of 25 (913 s of checks). Item 5: `cursor-adoption`, `game-screen`, `ux-defects`, `home`. Item 3: `plugin-ui`, `plugin-ui-http`.
- **Full runs on the final code** (19c38ec9 and later; the commits after it change comments and docs only):
  - Run 1: 23 of 25. `verb-marks` ("four bites fit a 375 px phone": the bites list is empty) and `turn` (End turn stays off after e2-e4) failed. In both, a tap right after a page load did nothing. A review helper read the diff on this Mac at the same time. Neither fault comes back: both checks pass 5 times alone and 3 times beside a full `vitest run`. `playable-clay`, `qa`, `lesson-return` and `account` passed.
  - Run 2: 25 of 25 (814 s of checks).
  - Run 3: 25 of 25 (810 s of checks). So two full runs on the final code are green, and `playable-clay`, `qa`, `lesson-return` and `account` pass in all three.
- **Build compare** (`vite build` of main 50eae990 in a scratch worktree outside the checkout, and of the branch): the same 36 asset names and the same 170 precache entries; both CSS files have the same names and the same bytes; `index.html` is the same with the hashes removed. The account, clay and Workshop chunks are byte-identical. The main chunk grows by 747 bytes (388,882 to 389,629).
- **Render compare** (the method of ticket 02). Each build served by Vite's preview on its own port; `SAMPLE=<nn> capture.mjs` for `00` and `W1` to `W12`, 297 renders a build; main rendered a second time, alone; then `render-compare.mjs` at threshold 16.
  - main against main: 22 renders differ (the unstable states): 00 move, selected; W2 lesson-task; W3 turn-waits; W4 read-enemy-maester, read-paladin; W8 first-deal; W11 haste-chain, haste-takes, long-turn, see-again; W12 rules, share, share-actions, shelf, shooter.
  - main against the branch: 17 renders differ. 14 are in states that differ between the two main renders. The other three: W4 `bites-1-and-2-desktop` (545 pixels), W11 `haste-turn-phone` (1) and W12 `long-names-phone` (8). A second render of the branch (W4, W11 and W12, alone) matches both main renders in these three renders, and differs from the first branch render by the same counts. So they are unstable too (ticket 02 found the same 545 pixels in `bites-1-and-2`).
  - The second branch render against main differs only in states that differ between two renders of one build. One of them, W4 `read-beast-desktop` (114 pixels), differs between the two branch renders.
  - No stable state differs between main and the branch. Sample `00` exits 1 on both builds with the same 20 faults: its selectors `#panel #menu button, #panel #actions button` and `#settings` match nothing since the redesign. Its renders are complete.
- **The move commit.** `git diff --color-moved=zebra --color-moved-ws=allow-indentation-change 8122ada3~ 8122ada3`: of 963 added lines, 175 are not moved (the glue, the deps and the new start-up calls in `main.ts`); the rest are moved blocks. The moved code is indented by two spaces inside `connectPlay`, so the plain zebra view needs the whitespace option. `git blame -w -C -C -M src/screen/play.ts`: 114 of 898 lines carry the move commit; the other lines keep their old commits and authors.
- **Review.** An independent review of the diff (start-up order, the closures across the seam, `restore` and `seat`, the `gen` guards, the CSS order, the chunk imports) found no change that a player meets. It notes one effect of item 6: a Resign during a review syncs the board twice in one task, with the same end state.
- **Open.** Ticket 04 (the table snapshot) is next. The new-game dialog wiring stays in `main.ts`; a later step can move it to the menu part if `main.ts` grows again.
