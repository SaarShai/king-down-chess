# After the redesign: parallel check runs and the game-screen split

Status: ready-for-agent. The owner asked for both changes on 2026-10-09 and gave the plan to the agent on 2026-10-09 ("you write the specs and implement"). The decisions in §6 are made by delegation (owner, 2026-10-09: "use your best judgement"), not by the owner's own yes; he can overrule each one.

## 1. The owner's words

2026-10-09, about the redesign build: "The check lock. If each worktree had its own output folder, two or three check runs could go at the same time." "The game-screen file. Splitting it into smaller parts (table, menu, turn, moments) would allow true parallel work." Later: "remember this. but don't start it automatically. when this build is done, remind me that this is pending and i want to plan to do it in the best way." After the build (2026-10-09): the plan may start.

What happened in the build: 12 units ran in parallel, but all browser checks on this Mac went through one lock (one run at a time, about 12 minutes a run), and all units changed `src/main.ts`, so their merges went one at a time.

The aim is fewer minutes of waiting for each change. It is not the aim to delete many lines. No change that a player can see or feel.

## 2. Facts (verified on origin/main deb61ce6, 2026-10-10, unless marked inferred)

Baseline, clean worktree of deb61ce6, Node v26.0.0, this Mac (16 CPU): `npm test` passes in 93 s. The full `npm run check:browser` time and each check's time are in [ticket 01](issues/01-parallel-check-runs.md).

The check runner:

- One lock for all worktrees: `tools/lib/lock.mjs:15` asks git for `--git-common-dir` and `:17` names `check-browser.lock` there. `tools/check.mjs:74` takes it before the build.
- One output folder for all runs: `tools/lib/checks.mjs:46` sets `outRoot = <tmpdir>/kingdown-checks`; `tools/check.mjs:75` empties it at the start. So a second run deletes the first run's logs and screenshots. `src/workshop/workshop.docs.test.ts:27` requires `docs/WORKSHOP.md` to name that folder (`docs/WORKSHOP.md:109`).
- One build folder in each worktree: `tools/check.mjs:121` runs `npm run build` (`tsc --noEmit && vite build`, `package.json`), which writes `dist/`. `tools/deploy.sh:150` runs the runner in its own temporary worktree and `:179` publishes that worktree's `dist/`.
- The preview uses port 0 (`tools/check.mjs:128`), so ports never clash. Each check starts its own browser (`tools/lib/checks.mjs`, `launch`). The plugin checks build into their own `mkdtemp` folder (`tools/plugin-browser-check.mjs:24`) but share the test database: each run inserts two random users and deletes them (`:25`, `:35`, `:54`).
- The tree guard (`tools/lib/tree-status.mjs:43`) runs `git status --porcelain -z --untracked-files=all` and hashes every changed or untracked file, before and after each check. It drops every `GIT_*` variable (`:36`). In the main checkout, `sim/out/` holds 5,190 untracked files, 344 MB, hashed twice for each check.
- Checks that assert time: `king-effects` (12 to 40 fps, `tools/verify-king-effects.mjs:54`; blow times `:153`), `painted-game` (tap-skip under 600 ms, off under 400 ms, `tools/verify-painted-game.mjs:115`, `:153`, `:157`), `qa` (a full computer game, `tools/qa.mjs:297`). `cursor-adoption` waits on tween state, not on wall time (`tools/verify-cursor-adoption.mjs:34`).
- Callers of the runner: `tools/deploy.sh:150` and `:156`; `.github/workflows/plugin-checks.yml` (one run, Node 24). The registry `tools/lib/registry.mjs` is read by `tools/check.mjs`, `tools/lib/removed-checks.mjs` (the commit-msg hook) and `tools/checks.lint.test.ts`.
- The approved design of today's lock: `docs/specs/checks-and-hooks/spec.md:49` and `issues/06-browser-check-runner.md`. This spec changes that decision (§6, D4) because the owner asked for parallel runs.

The game screen:

- `src/main.ts`: 1,348 lines, 35 top-level `let`, 34 top-level functions and 26 top-level arrow functions. It exports nothing. Only `src/entry.ts` imports it (a dynamic import). The service worker waits for `window.view` (`vite.config.ts:29`), which `src/main.ts:85` sets right after the view is made.
- Its parts, by line: URL rules and presets (40 to 62); the engine, game, look and view, with one top-level `await` (64 to 90); the state (93 to 142); the derived facts `finished`, `currentTurn`, `ended`, `undoOn`, `myTurn`, `resigner` (145 to 153); the connected controls `moveMoments`, `gameEnd`, `connectTurnPress`, `previously` (155 to 204); the piece art and the Guide `fillPieceGuide` (206 to 266); `armedTag`, `candidates`, `markTargets` (273 to 291); `refresh()` (293 to 398); `drawMarks` (401 to 420); `sayCursor` (424); `commit` (433); lessons (477 to 549); the Workshop loader (517); `maybeAi` (552); the three dialogs (572 to 660); input (666 to 726); `restoreMoments` (728); Show me (739); `showPly` (761); `reset` (793); `orient` (814); `newGame` (823); `undo` (852); `result`, `showOver`, `listMoments` (856 to 946); the result dialog, Undo, Resign, Copy (948 to 961); game links and Share (963 to 999); the save (1001 to 1118); New game (1120 to 1171); the Guide button, Share result, the settings controls (1172 to 1202); keys and the board cursor (1203 to 1251); start-up (1253 to 1348).
- `refresh()` reads 18 state variables and writes the board highlight, the help line, the header, the moves list, the captured pieces, the info card, the button states and the lesson progress; then `refreshTable` (`src/ui/table.ts:60`) reads back `#status`, `#turn`, `#moment`, `#stop-chain` and `#asset-status` and adds an icon to each `#moves` row. `refreshTable` must run exactly once after each `refresh()`.
- The stale-work guards: `reset()` (`:793`) bumps `gen` and `navGen`; `commit`, `maybeAi`, the dialogs, Show me and `listMoments` check `gen` after each `await`; `showPly` checks `navGen`. They stay.
- Modules that take what they need and return a small object: `src/new-game.ts:107` (`newGameDialog`), `src/game-end.ts:8`, `src/move-moments.ts:6`, `src/ui/previously.ts:24`, `src/ui/menu.ts:11`, `src/ui/home-view.ts:7`. `src/turn-controls.ts:26` takes 15 callbacks: it shows the cost of a split where the state stays in `main.ts`.
- Tools that reach the page through globals: `window.view` in `tools/qa.mjs:61`, `tools/verify-cursor-adoption.mjs` (14 lines), `tools/verify-painted-game.mjs:107`, `tools/verify-king-effects.mjs:143`; `window.home` (`src/main.ts:1171`) in the sample tables. Every view call goes through the object at call time.
- CSS order: `src/main.ts:1` imports `style.css` first and `:27` imports `ui/table.css`; the other sheets come with their modules (`ceremony.css`, `lesson-shelf.css`, `tricks.css`, `home.css`, `power-motion.css`). The build gives one `main.css` (73 kB) and one `dialog.css` (the Workshop, 24 kB).
- Chunks of `vite build` on deb61ce6: `main.js` 386 kB, `clay.js` 770 kB, `client.js` (the account) 215 kB, `dialog.js` (the Workshop) 85 kB, `title-kings.js`, `account.js`, `engine.js`, `king-sheets.js`, `piece-icons.js`, `styles.js`, `painted-mesh.js`, `preload-helper.js`, `worker.js`, `index.js`. The clay look, the account client and the Workshop load on demand (`vite.config.ts:18`).
- Branches that change `src/main.ts` against origin/main (all from 2026-10-05 to 10-07, lab or waiting work): `claude/archer-over2` (+13 −4), `claude/archer-reach` (+1), `claude/arrange-mode` (+19 −3), `claude/integration-2026-10-05` (+58 −23), `claude/turn-countdown` (+50 −10). §8 maps each function to its new module for a later rebase.
- The Archer guide precondition is met: `src/read.ts:33` and `:48` are typed `Record<ArcherShots, string>` with all 12 readings, read with no fallback at `:93` and `:189`.
- Repeated facts (audit finding 14): the first-click path is in `src/marks-model.ts` (`clickPath`, used by `main.ts` and `read.ts`) and, as a target set, in `src/plugin/app.ts`; preset precedence is in `src/main.ts:52` and `src/match/worker.ts:56`; the save field lists are in `src/main.ts:1006` (`Save`) and `src/account/sync.ts:21`.
- Unit tests run in Node with no DOM (`vite.config.ts:79`), so only browser checks cover `main.ts`.
- In the main checkout, `git rev-parse --git-dir` and `--git-common-dir` both give `.git`; in a worktree they differ.
- `tools/verify-w6-parts.mjs:184` copies two screenshots to a fixed `<tmpdir>/kingdown-w6-phase1` (a by-name check; two runs at once overwrite each other's copies, with no fault).
- `tools/qa.mjs:301`, the case "cancelling mid-search starts a clean game": since the turn button (redesign 02b) the computer thinks only after End turn, so this case never reaches a search. Ticket 03 repairs it.

Online facts (inferred from the Node, Vite and Playwright docs; not re-verified in `node_modules`): `fs.openSync` with flag `wx` fails with `EEXIST` when the file exists, so one process wins; `os.tmpdir()` follows `TMPDIR`; `vite build` empties `build.outDir` (`dist/`) by default; Playwright's `launch()` makes a fresh temporary profile for each browser; `GIT_OPTIONAL_LOCKS=0` makes `git status` skip the index refresh that takes `index.lock`.

## 3. Part A: parallel check runs

### 3.1 Goal

Two runs of `npm run check:browser` in two worktrees go at the same time on this Mac. Each run keeps its own logs and screenshots. No check fails more often than it does alone. A third run waits, with one clear line. The owner can later allow 3.

### 3.2 Design

1. **An output folder for each run.** `mkdtemp` under `<tmpdir>/kingdown-check-runs/`, named `<worktree folder name>-XXXXXX`. The runner never empties the parent and never touches another run's folder. The runner prints the folder at the start and writes `run.json` in it: pid, worktree, HEAD, Node version, the check names, and each check's start, end and result. No cleanup code: macOS removes items under its temporary folder that nobody opened for 3 days. The new parent name keeps a new run safe from an old runner on an unmerged branch, which empties `kingdown-checks` at its start.
2. **One run for each worktree.** A new `runLockPath(dir)`: `check-run.lock` in the worktree's own git directory (`git rev-parse --git-dir`). In the main checkout that directory is the common directory, so the file has its own name: the old `check-browser.lock` keeps its job in item 4, and a run never waits for a file that it holds. The lock covers the build, the preview and the checks of one run, because `dist/` is shared in a worktree. `tools/deploy.sh` keeps working with no change: it runs in its own worktree and publishes that worktree's `dist/`.
3. **Machine slots.** N = 3 files `check-slot-0.lock` to `check-slot-2.lock` in git's common directory (N = 2 until the measurement of §3.4, 2026-10-10) (every worktree and every deploy worktree of this repository shares it; a different `TMPDIR` cannot go around it). A run takes one free slot with the same exclusive create and dead-pid takeover as today's lock (`takeLock`). A run takes a slot for its build and frees it; then for each check it takes a slot after its preview is ready and frees it after the check. A run never waits while it holds a slot, so no deadlock. A third run prints one wait line that names the holders. `takeLock` gets three repairs: the takeover of a dead or stale holder goes through an atomic rename, so two takers cannot both remove a new owner's file; each lease carries a random token, and a release removes the file only when it still holds that token; a lock file that cannot be read (a writer that died between create and write) and is older than 10 s counts as stale. After the rename, the taker compares the moved file's text with the text it inspected: a different text is a live lease that another taker made first, and it goes back to its path (independent review, 2026-10-10). The module remembers every lease of the process, and the runner's exit handler releases them all, so a signal during a partial exclusive take leaves no file.
4. **Exclusive checks.** A new optional registry field `exclusive: true` on `king-effects`, `painted-game`, `qa` (they assert time) and `plugin-oauth`, `plugin-ui-http` (they share the test database). An exclusive check takes the old global file `check-browser.lock` first, then every slot in order 0..N−1. A normal taker waits while `check-browser.lock` has a live holder, so an exclusive check never starves, and an old runner on an unmerged branch (it takes only that file) waits while a new exclusive check runs, and a new exclusive check waits while an old run goes. One file does three jobs: the exclusive lock, the pending marker and the bridge to old runners. The registry change is additive, so other branches merge clean.
5. **The tree guard.** It runs `git status` with `GIT_OPTIONAL_LOCKS=0`, so a `git commit` in the worktree during a check never fails on `index.lock` (the usage text still says: do not edit or commit during a run; the guard then fails the check). Untracked paths under `sim/out/` leave the guard (audit finding 5); the 1,667 tracked files there stay guarded. A new or changed untracked file there does not fail a check. `selftest-dirty` still fails and names its file.
6. **Accepted limits.** A SIGKILL of a runner skips its exit handler, so its check's process group can live on; a dead holder frees its slot, as today. The slots count no `npm test` and no build outside the runner. An old runner on an unmerged branch that is already in progress is not stopped by a new exclusive check.
7. **N is one shared constant**, `SLOTS` in `tools/lib/lock.mjs`, the same in every run, so that an exclusive check takes the same slots that the normal checks take (a run with its own count could start beside an exclusive check; independent review, 2026-10-10). It changes only by a commit after the measurement of §3.4. N = 1 would keep today's behaviour: never two checks or a check and a build at the same time on this machine. The exit codes and the clean-up on SIGINT, SIGTERM, SIGHUP, a time-out and a failure stay the same.

Not in this design (decided, §6): a cleanup policy for old folders; an injectable runner harness; two runs in one worktree; the M1 lane script.

### 3.3 Tests and verification

Unit tests, fast, in `tools/lib/lock.test.ts` and `tools/lib/tree-status.test.ts`: a second slot taker gets the other slot; a third waits with one line and goes on when a slot frees; an exclusive taker takes all slots and a stream of normal takers does not starve it; a normal taker waits while an exclusive taker is pending; a dead holder's slot and pending marker are taken over; a release never removes a slot that another pid holds now; a release with an old token leaves a new lease of the same pid; a lock file that cannot be read is taken over after 10 s and not before; `lockPath` differs for two worktrees; a change under `sim/out/` is not a difference, a change beside it is. `tools/lib/checks.test.ts` and `src/workshop/workshop.docs.test.ts` follow the new folder name.

By hand, recorded in the ticket with times: `npm run check:browser selftest-hold` (a new by-name mode that sleeps 15 s) in two worktrees at the same moment: both pass, their times overlap, each keeps its own folder and log; a third run prints one wait line and runs when a slot frees; `selftest-dirty` fails and names its file; `selftest-fail` exits 1; `selftest-hang` times out and leaves no browser, preview or slot; Ctrl-C gives exit 130 and frees everything; two functional runs at once (for example `special-moves new-game` beside `workshop-cast lesson-return`); one full run alone, against the baseline; `npm test`, `npm run test:docs`, `npm run check:browser -- --help`.

### 3.4 Measurement before N goes above 2

On this Mac, at a quiet time, on one commit: `king-effects`, `painted-game` and `qa` 3 times alone, then 3 times beside one functional run, then 3 times beside a build and an `npm test` in another worktree. Record the frame rates, the millisecond values and the times. Raise N to 3 only if no value moves near its limit. About 45 minutes of checks; tell the owner before it starts.

## 4. Part B: the game-screen split

### 4.1 Goal

`src/main.ts` becomes a short composition root: it reads the URL, makes the view, connects the parts and runs the start-up order. Each part lives in its own module. Two agents can change two parts with no merge conflict. The game stays the same: no pixel, text, timing, focus or DOM change that a player meets.

### 4.2 Rules

1. State lives with the functions that own its life (audit finding 4). A module exports one `connect<Part>(deps)` function that takes what it needs and returns a small object, as `src/new-game.ts`, `src/game-end.ts` and `src/move-moments.ts` do. No event bus, no store, no class for each control.
2. One turn core owns the game: `game`, `sides`, the selection, `busy`, `gen`, `navGen`, `reset()`, `refresh()`, review (`showPly` shares `navGen` and `busy` with `commit`) and every step that switches the game (`newGame`, start lesson, Return to game, `openSaved`, `undo`, the start-up restore). Other modules ask it for the current game at call time and never keep a copy. Each `gen` check after an `await` stays.
3. The table renders a snapshot: the DOM writes now inside `refresh()` move to `renderTable(snapshot)` in `src/ui/table.ts`, and `refreshTable` keeps running once, last, after them.
4. No import cycle with `main.ts`: a new module never imports `main.ts`, and never reads `view`, a settings control or the save at import time. `window.view = view` stays right after the view is made. Code calls view methods through the object.
5. The CSS import order stays (`style.css` first, then `ui/table.css`); the built CSS is compared before and after. The clay look, the account client and the Workshop stay separate chunks; the chunk list and the service worker's precache list are compared.
6. Every rule of `docs/specs/web-redesign/fast-plan.md` §5.4 stays: the `gen` guards, "commit only after a send that succeeds", `aria-disabled` on Undo and Resign, the focus to End turn, 44 px targets, `finishLinkedTurn` for an old link.
7. The plugin page does not change. Modules that `src/plugin/app.ts` imports (`powers-ui.ts`, `move-text.ts`, `marks-model.ts`, `rules/*`, `render/*`) change only in one small separate step, with `npm run check:browser plugin-ui plugin-ui-http` and the page size from `node tools/plugin-ui-build.mjs` before and after.
8. Each step is one move-only commit where possible, reviewed with `git diff --color-moved=zebra`. A step that changes logic is its own commit with its reason. Comments that name `main.ts` in `src/` and `tools/` change in the same branch, except in modules that the plugin imports (rule 7).
9. The Workshop stays parked: `src/workshop/` does not change, except a pure move that the split needs.

### 4.3 The parts

| Part | Module | Holds |
|---|---|---|
| turn | `src/screen/play.ts` | The state and derived facts of §4.2 rule 2; `armedTag`, `candidates`, `markTargets`; `refresh()`; `drawMarks` and the marks layer; `commit`; `maybeAi`; `pickPromotion`, `choose`, `choosePushOrCapture`, `choosePower`; `onDragSelect`, `onSquareClick`, `refuse`, `readWaiting`, Stop here, Show me; `showPly`, the moves click; `reset`, `orient`, `newGame`, `undo`, Resign; `startLesson`, `lessonResult`, Return to game, Next lesson; `openSaved`, `replay`, `fromAccount`, the start-up restore; the turn-press, move-moments, game-end and previously wiring |
| table | `src/ui/table.ts` | `renderTable(snapshot)`: the board highlight is the turn core's, but the help line, the header and status, the moves list, the captured pieces, the button states except End turn, and the lesson progress move here; then `refreshTable` as today. The info card (`showInfo`) and End turn (`refreshTurnButton`, `gameEnd.refresh()`) stay in `screen/play.ts` and run right after `renderTable`: they read the turn core and `game-end.ts`, and the snapshot takes no callback (ticket 04) |
| menu | `src/ui/guide.ts` and the settings in `src/screen/settings.ts` | `fillPieceGuide`, `pieceText`, `pieceArt`, `kingArt`, `ART`, `usesText`, the Guide button; the settings controls (sound, queen, threats, pace, labels, coords, look, Reset view), `applyPace`, `applySettings`, `settingsNow`; the New game dialog wiring (`TRY_THESE` options, `openGameSetup`, `openNewGame`, `openToday`, the Start handler) |
| moments | `src/screen/moments.ts` | `said`, `restoreMoments`, the hover preview, the move sounds of `commit` as a pure `soundsFor(kind, move)`, `result()`, `movesPlayed`, `showOver`, `listMoments`, the Share result text, the result dialog's close handler |
| save helper | `src/screen/save.ts` | The `Save` type, one settings field list shared with `src/account/sync.ts`, `readSave`, the write of `save()`; no game switching |
| links | `src/screen/links.ts` | `gameLink`, `gameLinkless`, Copy, Share, `copyAndSay` |
| keys | `src/screen/keys.ts` | The keyboard cursor, `sayCursor`, `homeSquare`, the board focus, blur and keydown, the page keydown |

`main.ts` keeps: the imports and the CSS order, the URL rules and presets, `setEvaluator`, the view and `window.view`, the lesson shelf and home start, the account load, the start-up order with its two top-level `await`s. Target about 250 to 350 lines (an estimate).

### 4.4 Order and proof

Three pull requests, sequential, by one agent (parallel agents in one file is the problem this spec solves): (1) the leaf modules: pure helpers with unit tests (`soundsFor`, the result and share text, `gameLink`, `pieceArt`), then guide, settings, save, links, keys and moments; (2) the turn core, with `refresh()` inside it (it sets `armed` and then calls the table), and `main.ts` becomes the root; (3) the table snapshot, last, because today's `refreshTable` reads back the DOM that `refresh()` writes. After each commit: `npm run typecheck`, `npm test`, and the named checks of the part. Before each pull request: the full `npm run check:browser` (with Part A, two agents can share this Mac). Proof of no change for each pull request: the chunk list, the precache list and the CSS of `vite build` before and after; renders of the sample tables `docs/specs/web-redesign/samples/00.mjs` and `W1.mjs` to `W12.mjs` from a build of main and of the branch, compared with `docs/specs/web-ux/render-compare.mjs` (sharp; a pixel counts when a colour value differs by more than 16, because a phone render carries a dither pattern of about 140,000 pixels that differ by 1; a second render of main finds the motion states that differ between two renders of one build, and those states prove nothing); `wc -l src/main.ts` and the count of top-level `let`, before and after. Every state that a computer move reaches is not compared (the computer's moves are random).

The two largest risks of a behaviour change are old async work that lands on a new game, and a restore that replaces the wrong match. Pixels and line counts cannot show them. These checks do, and each pull request runs them: `playable-clay` (the interruption case), `qa` (the case "cancelling mid-search", repaired in ticket 03 so that it presses End turn before New game; today the computer never starts to think in that case), `lesson-return` and `account`.

Cover that is thin and gets a small check or a unit test before its part moves: switching to the clay look and Reset view (settings), the share-result text (moments), the hover preview of a moment (moments).

## 5. Order table

| Order | Ticket | Step | Needs | Sample | Effort |
|---|---|---|---|---|---|
| 1 | [01](issues/01-parallel-check-runs.md) | Parallel check runs | — | no | M |
| 2 | [02](issues/02-split-leaf-modules.md) | The leaf modules: pure helpers, guide, settings, save, links, keys, moments | 01 (for the checks) | no | M |
| 3 | [03](issues/03-split-turn-core.md) | The turn core; `main.ts` becomes the root | 02 | no | L |
| 4 | [04](issues/04-split-table-snapshot.md) | The table snapshot | 03 | no | S |
| 5 | [05](issues/05-measure-slots.md) | Measure before N = 3 | 01, a quiet Mac, the owner told | no | S |

Each ticket merges when its checks pass (AGENTS.md: a step of an approved spec). No step needs a sample, because no step changes what a player sees.

## 6. Decisions (by delegation; change one only with evidence)

- D1. Slots: N = 2; N = 3 only after §3.4. Reason: the timing checks are the risk; the audit says start with two. Result (ticket 05, 2026-10-10): 27 checks, no value near its limit; N = 3.
- D2. Exclusive: `king-effects`, `painted-game`, `qa`, `plugin-oauth`, `plugin-ui-http`. Reason: they assert time or share the database. `cursor-adoption` waits on state, so it stays normal unless §3.4 shows an effect.
- D3. Two runs in one worktree: no. Reason: each agent has its own worktree; a `dist/` per run puts the deploy gate at risk for little gain.
- D4. Slot files in git's common directory; the run folders under a new parent `kingdown-check-runs`. Reason: the common directory covers every worktree; the new name keeps a new run safe from an old runner. This replaces the one-lock decision of checks-and-hooks story 12, at the owner's wish.
- D5. The old lock file `check-browser.lock` is the exclusive lock, the pending marker and the bridge to old runners; the run lock has its own name, `check-run.lock`. Reason: one file, one takeover rule, no new starvation logic; a distinct run-lock name, because in the main checkout the worktree's git directory is the common directory (an independent review found this deadlock, 2026-10-10).
- D6. No cleanup code for run folders. Reason: macOS removes temporary items that nobody opened for 3 days; code for this adds risk (a wrong delete) for no gain.
- D7. No injectable runner harness; the runner is proven by hand as in checks-and-hooks ticket 06, and the lock module by unit tests. Reason: the harness is more code than the change; the self-test entries exist for this. The independent review asked for a small harness (forced exit, overlap, recovery); the lock tests cover overlap and recovery, and the self-test entries cover the exits. The harness comes if a hand run finds a fault that a test should pin.
- D8. Parts: the owner's four, with save, links and keys as small helpers, and review and all game switching in the turn core. Reason: review shares `navGen` and `busy` with `commit`; a save or lesson module that switched the game would depend on every other part.
- D9. Three pull requests, one agent, sequential: the leaf modules, the turn core, the table snapshot. Reason: each full check run costs about 12 minutes; eight pull requests would spend most of the work in check runs and merges, and parallel agents in one file is the fault to fix. The independent review agreed with three and set this order.
- D10. The open branches that change `src/main.ts` do not block this work. Reason: they are lab or waiting branches; §8 gives their rebase map.
- D11. The M1 lane script stays out. Reason: Part A removes most of the need.

## 7. Not in this spec

The audit findings that change an owner rule or are separate work: check tiers for each ticket (1), the 40-game search test out of each push (3), split long browser scripts (6), tool tests only when tools change (7), test workers and caches (8), one plugin build for each check set (9), prose-shape document lints (10), the Removed-check rule by behaviour (11), the art trial's rules snapshot (12), typing the shared scene (13), the plugin side of finding 14, preset precedence in `src/match/worker.ts`. The dead exports of finding 15 (`GP_NAMES`, `lookSpec`, `doneGames`, `setUseSculpts`, `src/plugin/view.ts`) are confirmed unused and may go in ticket 02 as one small commit. No game rule, look, player text or plugin page changes.

## 8. Rebase map for the open branches

| Function or block in `src/main.ts` today | After the split |
|---|---|
| URL rules, `preset`, `kings`, `withPowers`, `usesText` | `main.ts` (`usesText` moves to `ui/guide.ts`) |
| `ART`, `kingArt`, `pieceArt`, `fillPieceGuide`, `pieceText`, `showInfo` | `ui/guide.ts` (`showInfo` to `screen/play.ts`) |
| `armedTag`, `candidates`, `markTargets`, `refresh`, `drawMarks`, `commit`, `maybeAi`, the dialogs, input, `showPly`, `reset`, `orient`, `newGame`, `undo`, Resign, `startLesson`, `lessonResult`, `noteLesson`, Return to game, Next lesson, `openSaved`, `replay`, `fromAccount`, `labelContinue` | `screen/play.ts` |
| the DOM writes of `refresh()` (help line, header, status, moves list, captured, buttons except End turn, lesson progress) | `ui/table.ts` `renderTable` (the info card and End turn stay in `screen/play.ts`) |
| `said`, `restoreMoments`, hover preview, `result`, `movesPlayed`, `showOver`, `listMoments`, Share result, the move sounds | `screen/moments.ts` |
| `Save`, `SAVE_KEY`, `settingsNow`, `save`, `readSave` | `screen/save.ts` (`settingsNow` reads the controls through `screen/settings.ts`) |
| `applySettings`, `applyPace`, the controls sound, queen, threats, pace, labels, coords, look, Reset view, New game wiring | `screen/settings.ts` (the New game wiring: `ui/guide.ts` or `main.ts`; the ticket decides and records it) |
| the Workshop loader (`openWorkshop`, its two buttons, the `?design=` start) | `main.ts`: it loads a chunk at the root, as the account load does (ticket 03) |
| `gameLinkless`, `gameLink`, Copy, Share, `copyAndSay` | `screen/links.ts` |
| `sayCursor`, `homeSquare`, the board focus, blur, keydown, the page keydown | `screen/keys.ts` |
| start-up (`saved`, `link`, title, `view.ready()`, the account load, `titleChoice`) | `main.ts` |

Branch notes: `turn-countdown` changes `refresh`, `refreshPowers` (gone since W5; now `refreshCoins` in `src/ui/powers.ts`), `drawMarks`, `sayCursor`, `newGame`, `gameLink` and the start-up; `arrange-mode` changes the look control, `onDragSelect`, the New game Start handler and the coords control; `archer-over2` and `integration-2026-10-05` change the Archer text table (now `src/read.ts`), `gameLink` and the start-up.
