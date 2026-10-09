# Agent prompt: parallel check runs and the game-screen split

For the owner: give this prompt to a new agent session in the repo root, only after the web redesign build is on main (PR #26) and after you say go. The agent does phase 1 (research and a plan) and then stops. Phase 2 (the build) starts when you say go on the plan.

The owner gave the decisions in this work to the agent that wrote this prompt (2026-10-09: "regarding the choices i need to make - use your best judgement and rely on best practices and guidelines for UI/UX, i trust you on this"). Section 10 gives those picks. They are not the owner's own choices; if your research shows that a pick is wrong, say so in your plan.

---

## 1. Your task

You do two changes to the King Down repo. They come after the web redesign build.

- **Part A, parallel check runs.** Today only one browser-check run can go at a time on one machine. Make it possible for 2 runs to go at the same time, in different worktrees, with no lost evidence and no new random failures. A later measurement can allow 3.
- **Part B, the game-screen split.** `src/main.ts` holds the whole game screen. Every feature change edits it, so feature work cannot go in parallel. Split it into smaller modules. The owner's names for the parts are **table, menu, turn and moments**. The game must not change: no change that a player can see or feel.

You work in two phases:

1. **Phase 1: research and plan.** Do your own research (section 4). Write a spec and tickets (section 9). Then stop and report to the owner. Do not change code in phase 1.
2. **Phase 2: build.** Only after the owner says go. Build Part A first, then Part B (section 8).

## 2. Why the owner wants this

The owner's words (2026-10-09), about the redesign build:

> "The check lock. If each worktree had its own output folder, two or three check runs could go at the same time."
> "The game-screen file. Splitting it into smaller parts (table, menu, turn, moments) would allow true parallel work."

Later he said: "remember this. but don't start it automatically. when this build is done, remind me that this is pending and i want to plan to do it in the best way."

What happened in the build: 12 units were built in parallel, but they waited for each other in two places. (1) All browser checks on this Mac went through one lock, one run at a time. A full run takes about 12 minutes. (2) All units changed `src/main.ts`, so their merges went one at a time, and a unit that needed another unit's change waited for its merge. A temporary script ran checks on a second Mac (the M1) in 3 lanes to get past the lock. That script is not in the repo.

The aim is fewer minutes of waiting for each change. It is not the aim to delete many lines.

## 3. Hard rules

These rules come from `AGENTS.md`, the git hooks and the owner. Read `AGENTS.md` yourself. If a rule here and `AGENTS.md` or a hook do not agree, `AGENTS.md` and the hooks win; tell the owner about the difference.

- **Start:** read `AGENTS.md`, the Open items in `TASKS.md`, and the Always and Index sections of `LESSONS.md`. Then read `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`.
- **Write in ASD-STE100** (Simplified Technical English) in every document, ticket, commit message, pull request and report: approved words, short sentences, active voice.
- **Worktrees:** run `git fetch origin`, then `tools/wt.sh add claude/<name> origin/main`. (With one argument, `wt.sh` starts from the local `main`, which can be old.) For a second or third worktree of the same commit (Part A tests), use `git worktree add --detach <path> <commit>`, then `tools/wt.sh add <path>` to link the packages. Remove these worktrees after use.
- **Pull requests only.** Code goes to main only through a pull request. The pre-push hook protects `src/`, `public/`, `index.html`, the package files, `supabase/`, `tools/`, `.githooks/`, `.claude/`, `plugin-deploy/` and `vercel.json` (more paths than `AGENTS.md` names). Make one branch and one pull request for each ticket.
- **Merge:** `AGENTS.md` says: merge when the owner asks, or when a step of an approved spec passes its checks and any sample has the owner's yes. So after the owner approves your spec, each ticket that passes its checks can merge. Part B makes no visible change, so it needs no sample. Merge the tickets in the order of the spec.
- **Commits:** one trailer, `Co-Authored-By: Claude Code <noreply@anthropic.com>` or `Co-Authored-By: Codex <noreply@openai.com>`, for the tool that you are. No model name in any commit, pull request, code or document; the commit-msg hook refuses one. Never use `git commit -a` in the main checkout.
- **Removed-check rule:** each removed or changed assertion line in a registered browser check, or in a `tools/ux-defects/d<N>-*.mjs` probe, needs a `Removed-check: <file>: <what>, <why>` trailer. The commit-msg hook enforces it. A line that you move without a change needs no trailer.
- **Tests:** run unit tests only with `npm test` (or `npm run test:docs` for the document lints). Run browser checks only with `npm run check:browser <names>`. Do not run bare vitest or `node --test`. Do not pipe test output through `tail` or `grep`. The pre-push hook runs `npm test` on each push, so new unit tests must stay fast.
- **The plugin checks** `plugin-ui-http` and `plugin-oauth` need a local PostgreSQL, the variable `PLUGIN_TEST_DATABASE_URL` (a loopback `_test` database), and `npm run plugin:db:init-test` first. See `tools/plugin-browser-check.mjs` and `.github/workflows/plugin-checks.yml`.
- **Compute:** on this Mac, unit tests and browser checks are allowed. Do not start simulation runs. Do not edit files or commit in a worktree while its browser run goes: the tree guard then fails the run.
- **Secrets:** never print a process environment (no `printenv`, `env`, `ps aux` or `pgrep -l`). Use `ps -o pid=,command= -p <pid>`. Never open, print or copy `.secrets/` or `.env` files. Stop a process only by its PID.
- **Deploy:** never run `tools/deploy.sh --publish`. Deploy only when the owner asks.
- **Plugin page (spec rule 5 of the redesign):** do not change the plugin page in this work. If you must change a module that `src/plugin/app.ts` imports (for example `powers-ui.ts`, `move-text.ts`, `rules/*`, `render/*`), keep the old behaviour as the default, run `npm run check:browser plugin-ui plugin-ui-http`, and record the page size from `node tools/plugin-ui-build.mjs` before and after. A change to the plugin server (`src/match/*`) needs `npm run check:browser plugin-ui-http plugin-oauth`. Tell the owner, so that the plugin session knows. A comment edit in such a module is a change too; put such edits in one small separate step.
- **No visible change in Part B.** If any pixel, text, timing, focus or DOM structure that a player meets changes, stop and ask the owner. A visible change needs a rendered sample and the owner's yes.
- **Tracker files** (`TASKS.md`, `LESSONS.md`, the topic files in `docs/lessons/`, `docs/QUEUE.md`) change only on main. On a branch, record progress in your ticket. `TASKS.md` Open items has a 5,000-byte limit in a lint and is near it; keep a new line short.
- **Line numbers in this prompt are from before the build ended** (origin/main at fe6c542, the integration branch at dd3d7f6). They will move. Find code by its name, not by its line number.

## 4. Do your own research first

This prompt gives the result of a read-only study: a code audit, three research agents and two fact-check agents, all on 2026-10-09, before the build ended. Use it as a starting point only. Do not trust it. Each claim can be stale or wrong. For each fact that your plan uses, read the code yourself on the current `origin/main` and cite it as `path:line` in your spec. Tell the owner where this prompt is wrong.

### 4.1 In the codebase

Part A, read all of these:

- `tools/check.mjs` (the runner), `tools/lib/lock.mjs`, `tools/lib/checks.mjs` (its header is the reference for check authors), `tools/lib/tree-status.mjs`, `tools/lib/registry.mjs`, and their tests: `tools/lib/lock.test.ts`, `tools/lib/checks.test.ts`, `tools/lib/tree-status.test.ts`, `tools/checks.lint.test.ts`.
- `tools/check-selftest.mjs` (the `selftest` check) and `tools/check-selftest-dirty.mjs` (`selftest-dirty`, and `selftest-fail` and `selftest-hang` through its `fail` and `hang` arguments).
- Every registered check script. Find what each one writes, which server it uses, which browser it starts, and which assertions measure time or frame rate.
- `tools/plugin-browser-check.mjs`, `tools/plugin-server-build.mjs`, `tools/plugin-db/` (the plugin checks share one test database).
- `tools/deploy.sh` (it runs the checks in a temporary worktree and publishes the `dist/` that the checks built) and `tools/deploy.test.ts`.
- `vite.config.ts`, `package.json` scripts, `.claude/launch.json`, `.githooks/pre-push.mjs`, `.github/workflows/*.yml`.
- `docs/specs/checks-and-hooks/spec.md` (story 12 and the runner section) and its ticket `issues/06-browser-check-runner.md`: the approved design of today's lock. Also its ticket 07 (vitest time-outs under load).
- `docs/COMPUTE.md`, `docs/WORKSHOP.md` (it names the output folder), `src/workshop/workshop.docs.test.ts`, `tools/steering.docs.test.ts`, and `docs/specs/web-redesign/fast-plan.md` (it says "one run at a time").
- `docs/specs/after-redesign/audit.md`, findings 1, 2, 5, 6, 8 and 9, and the acceptance order at its end.
- `git log --follow tools/lib/lock.mjs` and the commit messages.

Part B, read all of these:

- `src/main.ts` in full, on the current `origin/main`.
- The modules that the redesign added or changed. On the unit branches they were: `src/turn.ts`, `src/turn-controls.ts`, `src/ui/table.ts`, `src/ui/menu.ts`, `src/ui/title.ts`, `src/ui/home.ts`, `src/ui/coin.ts`, `src/ui/powers.ts`, `src/review.ts`, `src/read.ts`, `src/context-line.ts`, `src/marks-model.ts`, `src/ceremony.ts`, `src/lesson-shelf-ui.ts`, `src/trick-store.ts`, `src/previously.ts`, `src/first-deal.ts`. Find the real names on main.
- `src/rules/rules.ts` (`RULES`, `setRules`): the rules are global state that many parts write and read.
- The module patterns that the audit names: `newGameDialog` in `src/new-game.ts` and the dialog in `src/workshop/dialog.ts` take what they need and return a small `{ open }` object. `src/account/account.ts` keeps module state and exposes `changed()` and `startAccount()`. `src/turn-controls.ts` takes an object of about 15 callbacks: it shows the cost of a split where the state stays in `main.ts`. Do not copy that shape.
- `src/entry.ts` and `index.html` (how `main.ts` loads), and the service-worker part of `vite.config.ts` (its precache list comes from the chunk graph, and it waits for `window.view`).
- `tools/app-ui.mjs` (the one place that knows the element ids), and every check that reaches `window.view` or replaces a view method: `rg -n 'window\.view|titleKings' tools docs/visual-design`.
- `docs/specs/web-redesign/spec.md` §4.2 (the turn state) and `fast-plan.md` §5.4 (the rules that a change must keep).
- `docs/specs/after-redesign/audit.md`, findings 4 and 14, and the section "Useful stale-work guards".
- `docs/lessons/browser-checks-and-ui.md`.
- `docs/specs/web-ux/capture.mjs` and `docs/specs/web-redesign/samples/README.md` (the sample tool).
- Every branch that changes `src/main.ts`, local and remote: `git branch` and `git branch -r`, then `git diff --stat origin/main...<branch> -- src/main.ts` for each one.

### 4.2 Online

Use primary sources (official docs, specifications, the source code of the installed packages). Cite each external claim with its URL or its `node_modules` path. Research at least these questions:

- **File locks and counting semaphores in Node** with no new dependency: exclusive create (`open` with `wx`), how to find a dead holder, PID reuse, and how to stop starvation of a waiter that needs all slots. Look at how established tools do it (for example the design of the `proper-lockfile` package, or the lock files of npm and git) and compare. Do not add a dependency unless the owner agrees.
- **`fs.mkdtemp` and `os.tmpdir`** in the Node docs, and how `TMPDIR` changes `os.tmpdir`.
- **Vite 8:** `build.outDir` and `build.emptyOutDir`, and `preview` with a custom `build.outDir`. Read the Vite docs and the installed source in `node_modules/vite`.
- **Playwright** (the installed version): how `launch()` makes a temporary profile, and what two processes on one machine share.
- **git:** `GIT_OPTIONAL_LOCKS` and `git status --no-optional-locks`.
- **ES modules:** evaluation order, circular imports and top-level `await` (ECMAScript spec, MDN, the Vite and Rollup docs). `main.ts` uses top-level `await`, so a cycle between it and a new module can fail.
- **How Vite orders CSS** that comes from many modules. A moved CSS import can change the cascade.
- **Refactoring method:** "move function" and "extract module" in Fowler's refactoring catalog; deep modules and narrow interfaces; how to review a move-only change with `git diff --color-moved` and `git blame -C -C -M`.
- **Image comparison** for the before and after renders, with the `sharp` package that `package.json` already has.

### 4.3 Record what you find

Put the facts, with citations, in the spec (section 9). Mark each fact as "verified" (you read it in the code or a source) or "inferred". List what you could not verify.

## 5. Preconditions for phase 2

- PR #26 (the redesign) is merged to main, with its samples decided (the owner gave the sample decisions to the build lead on 2026-10-09; they are decided by delegation). No branch of the build (`claude/wr-w1` to `claude/wr-w12`, `claude/wr-b2ux-*`, `claude/wr-b3-*`) holds work that is not on main.
- The owner parked the Workshop (2026-10-09: "park workshop for now"). Do not plan Workshop changes; keep `src/workshop/` as it is, except for a pure move of code that the split needs.
- **The Archer guide text.** On 2026-10-09 the owner chose the `far2` Archer (`src/rules/rules.ts`: `archerShots: 'far2'`), and main got four new Archer guide texts (`far2`, `over2`, `nearOver2`, `fwdNearOver2`). Unit W4 moved the table of these texts from `main.ts` to `src/read.ts`, and its copy had only 8 entries and a fallback to the `classic` text. The final step of the build was told to fix this. Check it on main: the table must have every Archer reading, typed `Record<ArcherShots, string>`, with no fallback, so that typecheck fails when a reading has no text. If it is not so, fix it first, as its own small pull request.
- The owner said go on your plan.
- A baseline on the newest `origin/main`, in a clean worktree, recorded in the Part A ticket: commit, Node version, `npm test` time and result, one full `npm run check:browser` time and result (each check's time), `wc -l src/main.ts`, and the count of top-level `let` in it. The times in this prompt are not in the repo; your baseline replaces them.

## 6. What the study found (verify each item)

### 6.1 The check runner (Part A)

Four things make runs go one at a time:

1. **One lock for all worktrees.** `tools/lib/lock.mjs` puts one file, `check-browser.lock`, in git's common directory. All worktrees share it. The runner takes it before it empties the output folder and builds (`tools/check.mjs`). The lock uses an exclusive create (`wx`), holds `{pid, cwd, since}`, polls each 1,000 ms, takes over the lock of a dead PID, and releases it in a synchronous exit handler. `tools/lib/lock.test.ts` asserts that two worktrees get the same lock path. This is an approved design: the checks-and-hooks spec (story 12, and its runner section) and its ticket 06 ask for one lock that lets only one runner work across all worktrees, together with one fixed output folder that each run empties. The global lock follows from that shared folder. So Part A changes an approved spec decision; record the change and the reason in your spec.
2. **One output folder for all runs.** `tools/lib/checks.mjs` sets `outRoot = join(tmpdir(), 'kingdown-checks')`. Each run deletes it at the start. So a second run deletes the logs and screenshots of the first run while it runs. `tools/lib/checks.test.ts` pins this path. `docs/WORKSHOP.md` says that the runner empties the folder, and `src/workshop/workshop.docs.test.ts` requires the name `kingdown-checks` in that document.
3. **One build folder in each worktree.** The runner builds into the worktree's `dist/` (`npm run build`, that is `tsc --noEmit && vite build`). Vite empties `dist/` for each build. So two runs in one worktree break each other. `tools/deploy.sh` publishes this `dist/` after its check run; its test stub in `tools/deploy.test.ts` copies a fake `dist/`.
4. **Timing checks.** Some checks assert times, so other work on the same CPU can make them fail: `king-effects` (frame rate 12 to 40 fps, blow times, ten 4-second frame samples), `painted-game` (wall-clock limits such as tap-skip under 600 ms), `qa` (a full computer game with a 200 ms think time; registry limit 900 s). The `workshop` animation check reads the animation's own end time, so it is probably safe (verify). Note: a build or an `npm test` in another worktree also takes CPU. The checks-and-hooks ticket 07 records vitest tests that hit their 5 s limit under load from other runs.

Things that are already safe: the runner's preview server uses port 0 (a free port for each run). The checks lint refuses a fixed port in each check that is not "by name only"; the plugin checks are by name only, and they use `listen(0)` (by reading, not by a lint). Each check starts a fresh browser with a temporary profile. The plugin checks build into their own `mkdtemp` folder.

Other shared things:

- The plugin checks `plugin-oauth` and `plugin-ui-http` share one test database. Each run adds two random users and deletes them at the end. Two runs at once are not proven safe.
- The tree guard (`tools/lib/tree-status.mjs`) runs `git status --porcelain -z --untracked-files=all` and hashes each changed or untracked file, before and after each check. It removes all `GIT_*` variables, so `GIT_OPTIONAL_LOCKS` cannot pass through. In the main checkout it hashes about 342 MB of simulation output in `sim/out/` each time (audit finding 5). A file that someone commits during a check also shows as a change, so the guard fails the check.
- **Hand runs.** A check that runs by hand, without the runner, calls the default address on port 5189 (the `playable` entry in `.claude/launch.json` serves a build there with `--strictPort`). So a hand run in worktree B can test the build of worktree A. Its default output folder is under the shared `kingdown-checks` folder, with no record of who owns it.
- **Old runners.** There are about 90 worktrees and 60 remote branches. Most will keep the old runner for days. An old runner still deletes the whole `kingdown-checks` folder at its start, and it takes only the old global lock. So it can delete a new run's evidence and run a timing check at the same time as a new run.
- Docs that say "one run at a time": the usage text in `tools/check.mjs`, `docs/COMPUTE.md`, the checks-and-hooks spec and its ticket 06, and `docs/specs/web-redesign/fast-plan.md`. `tools/steering.docs.test.ts` requires the phrase `npm run check:browser` in a document.
- Other callers of the runner: `tools/deploy.sh` (website and plugin checks) and `.github/workflows/plugin-checks.yml` (one run in CI).

**Evidence from the M1 lanes.** During the build, a temporary script ran checks on the M1 in 3 lanes. Two runs went at the same time several times, and all passed, once with `king-effects` in one lane and `plugin-ui` in the other. But each lane was a separate git repo (so a separate lock), with its own `TMPDIR` (so its own output folder) and its own copy of the source with no `dist/`. The lanes also forced `PLAYABLE_BROWSER=chrome`, which overrides the registry's `chromium` channel for some checks. So the lanes went around the shared parts; they did not share them. This shows that separate folders work. It does not show that 2 runs in one repo, 3 runs at once, or this Mac under load are safe. Numbers from the M1 cannot set the slot count for this Mac.

Times on this Mac (2026-10-09, from session logs, not from the repo): `qa` 161 to 210 s, `king-effects` about 100 s, `painted-game` 85 to 95 s, `ux-defects` about 73 s, `workshop` 62 to 71 s, `account` about 54 s, `special-moves` about 31 s, the rest under 25 s each. A full run of the 19 checks after batch 2 of the build took about 12 minutes. `npm test` takes about 90 s. This Mac has 16 CPUs and 48 GB of memory. Local Node is 26; CI uses Node 22 (`test.yml`) and Node 24 (`plugin-checks.yml`).

### 6.2 The game-screen file (Part B)

- **Size.** `src/main.ts` has 1,532 lines and 34 top-level `let` on origin/main (fe6c542), and 1,541 lines and 35 `let` on the integration branch after W1, W2, W7 and W12 (dd3d7f6). Later units move parts out (W4: the piece guide and `whyNot` to `src/read.ts`, about -146 lines; W8: the title screen to `src/ui/title.ts`) and add wiring. The study forecasts about 1,400 to 1,500 lines after the build. Measure it yourself.
- **One composition root.** It exports nothing. Only `src/entry.ts` imports it, with a dynamic import, and `index.html` loads only `entry.ts`. No tool reads it as text (only the secret scan in `src/account/account.test.ts` reads all of `src/`). Unit tests run in a Node environment with no DOM, so the logic in `main.ts` has no unit test; only browser checks cover it.
- **Its parts**, in order on main before the build: URL rules and presets; power label text; creation of the engine, game, look and view (with a top-level `await` for the clay look); the mutable state; the piece guide; the move-target facts (`clickPath`, `armedTag`, `candidates`, `markTargets`); `refresh()`; `refreshPowers`, `drawMarks`; `whyNot`; `commit`; lessons; the Workshop loader; Return to game and Next lesson; `maybeAi`; the promotion, shove-or-take and power dialogs; square click, drag and hover; the hint; review (`showPly`, the moves list); `reset`, `newGame`, `undo`; game over, result, share and key moments; game links; save, settings and account (`Save`, `settingsNow`, `applySettings`, `replay`, `fromAccount`, `openSaved`, `readSave`); the New game dialog; the menu buttons and settings controls; keys; the board keyboard cursor; start-up.
- **The rules are global state.** `setRules` writes into the shared `RULES` object (`src/rules/rules.ts`). Start-up, lessons, Return to game, `newGame` and `replay` call it; the table, the Guide and save read the rules. `fillPieceGuide` must run after each `setRules`.
- **`refresh()` is the hub.** About 34 calls. It reads about 18 state variables (game, sides, setup, selection, hover, the inspected piece, resigned, busy, thinking, hint squares, lesson, lesson done, link side, review, marks, review note, notice) and writes the board highlight, help line, turn and status text, moves list, captured pieces, info card, button states and lesson progress. After W2, `refreshTable` (in `src/ui/table.ts`) runs at the end of `refresh()` and depends on the DOM that `refresh()` just wrote: it reads `#status`, `#move-help`, `#turn`, `#moment`, `#stop-chain` and `#asset-status`; it adds an icon to each `#moves` row (a second call with no new `refresh()` adds a second icon); and it turns the `disabled` state of `#resign` into `aria-disabled`, which the Menu uses to block the click. W2 also gives it a `TableState` object of about 16 values.
- **Switching the game.** `newGame`, start lesson, Return to game, `openSaved`, `undo` and the start-up restore all do about the same steps: `reset`, set `game`, `sides`, the link side, `resigned` and the lesson; `setRules`; the captions; `view.sync`; `orient`; `fillPieceGuide`; `refresh`; save; then `maybeAi` or game over. `game` gets a new value in these steps, and `sides` changes in place from about 7 places. A module that keeps `game` from the time it starts will use an old game.
- **Stale-work guards.** `reset()` increments `gen` and `navGen`, stops the engine and closes dialogs. `commit` also increments `navGen` and ends a review. `commit`, `maybeAi`, the three dialogs, the hint and the key-moments list check `gen` after each `await`; `showPly` checks `navGen`. `showPly` also writes `busy`, the review state and the selection, and a square click can call it. `busy` is shared by the turn path, review, the hint, the dialogs and input; on the integration branch the turn press sets it too. The audit says that these guards are useful and must stay.
- **The caption `said`.** Writers: `commit`, lesson result, start lesson, `restoreMoments`, `newGame`, `openSaved`, the New game dialog. Readers: the hover preview and game over.
- **Lessons, save and account are linked.** `save()` writes something different during a lesson. An account game that arrives during a lesson sets `cloudGame`, and Return to game then opens it. The lesson record calls the account's `changed()`. `fromAccount` reads a start-up constant.
- **Start-up order** matters. It uses top-level `await` for the view, `view.ready()` and the title. Some settings controls are `const` values that `applySettings` uses. Modules that `main.ts` imports run before the body of `main.ts`, so before `view` exists.
- **Globals and checks.** `main.ts` sets `window.view`. (`window.titleKings` moves to `src/ui/title.ts` with W8.) `tools/ux-defects/d8-letters-stay.mjs` puts a setter on `window.view` that wraps `setLabels`, so `window.view` must get its value before the first `setLabels`. `tools/verify-workshop.mjs` replaces `window.view.highlight`, and `tools/ux-defects/d6-keys-under-dialogs.mjs` replaces `window.view.resetView`. So code must call view methods through the object at call time. Do not copy a view method into a variable.
- **Rules from fast-plan §5.4 to keep, with their code:** the generation guards; "commit only after a send that succeeds"; `aria-disabled` on Undo and Resign; the focus that goes to End turn; 44 px targets on touch; the fix for an old link that ends in the middle of a turn (`finishLinkedTurn`, in `replay` and in the start-up link code). The checks `turn` and `link-game` cover the last two.
- **Repeated facts (audit finding 14).** The first click target of a move is computed in `main.ts` (`clickPath`, an ordered path), in `src/read.ts` (`whyNot`, from W4), and in `docs/2d-first-pieces/board/model.mjs`. The plugin (`src/plugin/app.ts`) uses a different fact, a target set. Preset precedence is in `main.ts` and in `src/match/worker.ts` (the plugin server). The save field lists are in `main.ts` and in `src/account/sync.ts`. `settingsNow()` reads the live DOM controls.
- **Stale pointers.** About 34 code lines name `main.ts` (in `src/`, `tools/` and `vite.config.ts`; for example "skip the title screen (main.ts)" in 11 tools, and comments in `src/powers-ui.ts` and `src/render/*`, which the plugin imports). About 215 citations in documents give `main.ts` line numbers.
- **Which checks cover each part.** Do not use a list from this prompt. Build the map from the registry on main after the build (`tools/lib/registry.mjs`), from `tools/app-ui.mjs`, and from an `rg` of the element ids. The build adds checks (for example `turn`, `link-game`, `game-screen`, `menu-extra`, and others from W3 to W11). Known thin or no cover: switching to the clay look and Reset view, the share-result text, preset precedence, account settings that arrive during a game, and the hover preview of a moment.
- The audit counts about 600 to 900 lines that can move out without a change to the game. The study counts about 750.

## 7. Part A: parallel check runs

### 7.1 Goal

Two runs of `npm run check:browser` in two worktrees can go at the same time on this Mac. Each run keeps its own logs and screenshots. No check fails more often than it does alone. A third run waits, with a clear line. Later, after a measurement, the owner can allow 3.

### 7.2 Properties the design must have

- **An output folder for each run**, made with `mkdtemp`, for example `<tmpdir>/<parent>/<worktree key>/<UTC time>-<pid>-XXXX`. Never delete the parent or another run's folder. Write a `run.json` in the folder: pid, worktree, HEAD, a dirty flag, Node version, check names, the waits, and the start, end and result of each check. Print the folder at the start and on the last line. Remove old folders only when their owner process is dead and they are older than a limit, or more than a count for each worktree. Decide what happens to folders that hand runs leave (they have no `run.json`).
- **Safe beside old runners.** An old runner deletes `<tmpdir>/kingdown-checks` at its start. So the new runs must not live under that folder: use a new parent name, and update `docs/WORKSHOP.md` and `src/workshop/workshop.docs.test.ts` to it. An old runner takes only the old global lock, so a new runner must also respect it: a new run waits while a live process holds the old lock, and a new run holds the old lock in a way that makes an old runner wait while any new run goes (design this with care, and test it). Tell the owner which long-lived branches must merge main to get the new runner.
- **A lock for each worktree** that covers the build, the preview and the checks of one run, because `dist/` is shared in a worktree. Put it in the worktree's own git directory (`git rev-parse --git-dir`), with a new file name.
- **Machine slots.** N slot files (default N = 2) in git's common directory, taken with the same exclusive create and dead-PID logic as today. A run takes one slot for its build too, so that a build never runs beside an exclusive check. A run takes a slot for each check after its preview is ready, and frees it after the check. A run holds at most one normal slot at a time and never waits while it holds one, so no deadlock can occur.
- **Exclusive checks.** An optional registry field (for example `exclusive: true`). An exclusive check takes all N slots in a fixed order. While it waits, it writes a "pending" marker with its pid, and new normal takers wait while the marker is there, so that the exclusive check does not starve. The marker has the same dead-holder rule as a slot. If two exclusive checks wait, the older marker goes first. Exclusive: `king-effects`, `painted-game` and `qa`, and `cursor-adoption` if the measurement shows that load changes it. `plugin-oauth` and `plugin-ui-http` form an exclusive group (one at a time on the machine) because they share the test database.
- **N = 1, exactly:** never two checks or a check and a build at the same time on the machine; the same exit codes; the same clean-up on SIGINT, SIGTERM, SIGHUP, a time-out and a failure (no browser, preview or port stays open, and every held file goes). What changes: a run waits once for each slot, so print one short wait line for each wait, with what it waits for.
- **The tree guard.** Set `GIT_OPTIONAL_LOCKS=0` for its `git status`, so that it never takes `index.lock`. Do audit finding 5: leave `sim/out/` out of the guard (a small, named exclusion: new, changed and deleted files there do not fail a check). `selftest-dirty` must still fail and name its file.
- **A test seam.** The runner has its build command, its preview, its root and its registry fixed in the code. Make them injectable, so that the unit tests do not run a real `tsc` and `vite build`. The new unit tests must add only a few seconds to `npm test`.
- **Keep the deploy gate and CI working.** `tools/deploy.sh` must still publish the exact build that its checks tested. `.github/workflows/plugin-checks.yml` must still pass.
- **Additive registry change.** Other branches add entries to `tools/lib/registry.mjs`. Add only an optional field, so that the merge stays clean.

### 7.3 Tests (write them first)

Unit tests, with the injected seams, in a temporary repo with two worktrees (use the helpers in `tools/lib/`):

1. Run B's start leaves run A's folder and logs as they are.
2. Two runs in two worktrees both finish, with different ports and different folders, and both exit 0.
3. With N = 2, a third run prints one wait line and goes on when a slot frees.
4. N = 1 never lets two checks, or a check and a build, overlap.
5. A second run in the same worktree waits.
6. An exclusive check never overlaps another check or a build (compare the times in `run.json`).
7. A stream of normal takers does not starve an exclusive taker.
8. SIGINT, SIGTERM, SIGHUP, a time-out and a failure each free the worktree lock, all slots and the pending marker, and leave no open port.
9. After `kill -9` of a runner (a slot holder, and a pending exclusive waiter), the next taker takes over its files.
10. A release never deletes a slot that another PID holds now.
11. A `TMPDIR` inside the checkout still makes the run stop with exit 2.
12. Removal of old folders never touches the folder of a live run.
13. `selftest-dirty` still fails and names the file.
14. A new, a changed and a deleted file in `sim/out/` during a check do not fail the check.
15. `deploy.sh` publishes the build that was tested (update `deploy.test.ts` so that its stub follows the real path).
16. (a) A `git commit` in the worktree during a check never fails on `index.lock`. (b) The guard still fails a check when a commit changes the tree during it; the usage text says not to edit or commit during a run.
17. An old runner and a new runner never run checks at the same time, and the old runner cannot delete a new run's folder.

### 7.4 Documents and tests to update in the same pull request

`tools/lib/lock.test.ts`, `tools/lib/checks.test.ts`, `tools/lib/tree-status.test.ts`, the header of `tools/lib/checks.mjs`, the usage text in `tools/check.mjs`, `docs/COMPUTE.md`, `docs/WORKSHOP.md` with `src/workshop/workshop.docs.test.ts`, and `tools/steering.docs.test.ts` if a pinned phrase changes (keep the phrase `npm run check:browser`). Add a comment to the checks-and-hooks spec and its ticket 06 that points to the new design; do not rewrite their history.

### 7.5 Verification commands

Make the extra worktrees as section 3 says. Do not pipe the output.

- `npm test`, `npm run test:docs`, `npm run check:browser -- --help`.
- **Overlap:** the normal checks are too short to prove an overlap (`selftest` takes about 1 s). Add a check that is "by name only" and holds its slot for a set time (for example a `selftest-hold` mode of the self-test script, 20 s), or use `selftest-hang` with a longer limit. Start it in two worktrees at the same moment: both pass, their times overlap, and each keeps its own folder and log.
- **Third run:** while two such runs hold the slots, start a third: it prints one wait line and runs when a slot frees.
- `npm run check:browser selftest-dirty` must fail and name its scratch file (delete `check-selftest-dirty.scratch` after). `selftest-fail` exits 1. `selftest-hang` times out and leaves no browser or preview process, and its slot frees. Ctrl-C during a run gives exit 130, frees the slot and closes the port.
- Two functional runs at once, for example `npm run check:browser special-moves new-game` in worktree A and `npm run check:browser workshop-cast lesson-return` in worktree B.
- One full `npm run check:browser` alone, to compare with the baseline.

Record the commit, Node version, times and wait lines in the ticket.

### 7.6 Measure before N goes above 2

On this Mac (the slots are for this Mac), on one commit, at a time when no build agent and no simulation runs on it: run `king-effects`, `painted-game` and `qa` 3 times alone, then 3 times with one other functional run beside them, then 3 times beside a build and an `npm test` in another worktree. Record the frame rates, the millisecond values and the times. Raise N to 3 only if no value moves near its limit. This is about 45 minutes of checks; tell the owner before you start it.

## 8. Part B: the game-screen split

### 8.1 Goal

`src/main.ts` becomes a short composition root: it reads the URL, makes the view, starts each part, and runs the start-up order. The code of each part lives in its own module. Two agents can then change two parts at the same time with no merge conflict. The game stays the same.

### 8.2 Rules for the split

- **Keep each piece of state with the functions that own its life** (audit finding 4). Moving functions out while all state stays in `main.ts` only adds callbacks and files.
- **No event bus, no store framework, no class for each control.** A module exports a small function that takes what it needs and returns a small object (the `newGameDialog` pattern).
- **The table is a pure render of a snapshot.** It reads about 18 values, so do not give it a shared state object. The owners build a `TableState` snapshot (W2 started this) and call one render function. Better still, give `refreshTable` its values in that snapshot, in place of the DOM text that it reads back, but only if the result is the same.
- **One turn core owns the game.** It owns `game`, `sides`, the selection, `busy`, `gen`, `navGen`, `reset()`, review (`showPly`, because it shares `navGen` and `busy` with `commit`), and every step that switches the game (`newGame`, start lesson, Return to game, `openSaved`, `undo`, the start-up restore). Other modules ask it for the current game at call time, never keep a copy. Keep the check of `gen` after each `await`.
- **Keep the render order.** `refreshTable` runs exactly once after each `refresh()`, after all the text that it reads.
- **No import cycles with `main.ts`.** New modules must not import `main.ts`. A module must not read `view`, the settings controls or the save at import time.
- **Keep `window.view = view` right after the view is made**, and call view methods through the object.
- **Keep the CSS import order** (`style.css` first). Compare the built CSS before and after.
- **Keep the load separation.** The clay look, the account code and the Workshop load on demand. A new module must not pull the account client into the main chunk.
- **Keep every rule of fast-plan §5.4** (section 6.2).
- **Do not change the plugin page or the plugin server** (section 3).
- **Each step is one move-only commit** where possible. Review it with `git diff --color-moved=zebra` and `git blame -C -C -M`. A step that also changes logic is a separate commit with a reason.
- **Update the code comments that name `main.ts`** in the same branch, except in modules that the plugin imports (do those in one small step with the plugin checks). In live specs, change line citations to `module:function`. Do not edit historical reviews or `docs/tasks-archive/`.

### 8.3 The parts (picked; verify against the code)

The owner's four names, with the game switching inside the turn core and two small helper modules:

- **turn** (for example `src/screen/play.ts`; do not use `src/turn.ts`, which is W1's pure turn rule): the turn core as in 8.2, plus the move-target facts, square click, drag, refuse, choose and the three dialogs, `commit`, `maybeAi`, the turn-press wiring and Show me.
- **table** (build on `src/ui/table.ts`): `render(snapshot)` for the board highlight, help line, header and status, moves list, captured pieces, info card, button states, lesson progress, `refreshPowers`, `drawMarks`, the cursor text and the board keyboard cursor.
- **menu** (build on `src/ui/menu.ts`): the settings controls (sound, queen, threats, pace, labels, coordinates, look, Reset view), the Guide (on top of `src/read.ts`), the Workshop loader, the New game dialog wiring, and Copy, Share and game links.
- **moments**: the move sounds (a pure `soundsFor(kind, move)`), the captions (`said`, restore, the hover preview), `result()`, game over, the key moments, the Ceremony wiring (W6) and the king's fall.
- **save helper**: the `Save` type, the settings and game field lists (one list, shared with `src/account/sync.ts`), parse, serialize and `applySettings`. No game switching.
- **lesson helper**: the lesson data, the lesson result text and progress. The lesson game switch stays in the turn core.

`main.ts` keeps the URL rules, the view creation, the start-up order and the calls that connect the parts. Target: about 200 to 350 lines (an estimate).

### 8.4 Order

1. **Tests first, then the shared facts (audit finding 14), website only:** one helper for the ordered first-click path, used by `main.ts` and `src/read.ts` (leave `src/plugin/app.ts` as it is); the `Save` type and one settings field list, shared with `src/account/sync.ts`. First make `settingsNow` a pure function of plain values (a separate logic commit), then test that its keys equal the list. Leave preset precedence in `src/match/worker.ts` as it is (plugin server); list it as later work.
2. **Pure helpers with no state**, each with unit tests: result and moves text, game links, the share-result text, `pieceArt` and `kingArt`, `soundsFor`.
3. The save helper. 4. The lesson helper. 5. Moments. 6. Table render (with the snapshot). 7. Menu, settings controls, Guide, title and start-up wiring. 8. The turn core last.

After each step: `npm run typecheck`, `npm test`, and the named checks for that part (from the map that you build, section 6.2). At the middle and at the end: the full `npm run check:browser`. Each new browser check passes twice.

### 8.5 Proof of no change

- Unit tests for each pure function that you move, passing before the move.
- The named browser checks after each step, and the full set at the end.
- **Renders before and after.** The sample tool (`docs/specs/web-ux/capture.mjs`) reads a state table in `docs/specs/web-redesign/samples/` (`SAMPLE=<name>`, where the name is two digits or a W number) and needs a served build. Write state tables that cover the parts that you move, with no computer move in them (the computer's moves are random). Render them from the build before the split and the build after it, in the same environment, at phone and desktop size. The tool does not compare images: add a small compare step with `sharp` and report each pixel difference.
- **Bundle check:** `vite build` before and after. Compare the CSS order, the chunk list and the service worker's precache list. The clay look, the account code and the Workshop must still load as separate chunks.
- Grep the tools for the selectors of any container that you touch: `rg -n '<selector>' tools docs/visual-design`.
- `wc -l src/main.ts` and the count of top-level `let`, before and after.

### 8.6 Add checks where cover is thin

Before you move these parts, add a small check or a unit test: switching to the clay look and Reset view; the share-result text; account settings that arrive during a game; the hover preview of a moment.

## 9. What phase 1 delivers

- `docs/specs/after-redesign/spec.md`, in the shape of `docs/specs/web-redesign/spec.md`: a Status line, the owner's words, the rules for every step, the order table (Order, Ticket, Step, Needs, Sample, Effort), "Not in this spec", the decisions of section 10 (with any change that your research shows), and the facts with citations.
- Tickets in `docs/specs/after-redesign/issues/NN-slug.md`, one for each pull request, with Status, Blocked by, Scope, Plan (checkbox steps), Verification (checkbox), Risks, Does not do, and Comments (at most 10 lines). Part A has one or two tickets. Part B has one ticket for each step of 8.4 (steps can join when they are small).
- `audit.md` and this prompt stay beside them as evidence.
- A short note to the owner: what you plan, what you found that differs from this prompt, and your time estimate for each ticket, with the reason for each number.
- Then stop and wait for the owner's go.

## 10. Decisions (made by delegation; change one only with evidence)

- **D1. Slots:** N = 2. N = 3 only after the measurement in 7.6 shows no effect on the timing checks. Reason: the audit says start with two; the timing checks are the risk.
- **D2. Exclusive checks:** `king-effects`, `painted-game`, `qa`; `cursor-adoption` if the measurement shows an effect; the plugin database checks as one exclusive group. Reason: they assert time or share a database.
- **D3. Two runs in one worktree:** no. One run for each worktree is enough, because each agent has its own worktree. Reason: it needs a `deploy.sh` change that puts the deploy gate at risk for little gain.
- **D4. Slot files:** in git's common directory. Reason: it covers every worktree and deploy worktree of this repo, and a different `TMPDIR` cannot go around it.
- **D5. Measurement:** on this Mac, at a quiet time, about 45 minutes, after you tell the owner. Reason: the slots are for this Mac; M1 numbers do not apply. **Merge:** each ticket merges when its checks pass, under the approved spec (section 3).
- **D6. Parts:** the owner's four (table, menu, turn, moments) plus two small helpers (save, lessons), with review and all game switching in the turn core. Reason: review shares `navGen` and `busy` with `commit`; save and lessons that switch the game would depend on every other part.
- **D7. The turn path:** it moves out of `main.ts` as one module, the turn core, in the last step, if all earlier steps were clean. Reason: it keeps one owner (as the audit asks) and leaves `main.ts` as a short composition root.
- **D8. Open branches that change `src/main.ts`** (on 2026-10-09: `claude/turn-countdown`, `claude/arrange-mode`, `claude/archer-over2`, `claude/archer-reach`, `claude/integration-2026-10-05`): do not wait for them. Write a map from each old function to its new module in the spec, so that a later rebase is easy. Reason: they are lab or waiting branches.
- **D9. The M1 lane method:** not in this work. Reason: Part A removes most of the need; a later ticket can add a remote option if the owner wants it.

## 11. Not in this work

These audit findings are separate. Do not do them unless the owner adds them: check tiers for each ticket (finding 1; it changes an owner-approved rule), the 40-game search test out of each push (3), split long browser scripts (6), tool tests only when tools change (7), test workers and caches (8), one plugin build for each check set (9), prose-shape document lints (10), the Removed-check rule by behaviour (11), the art trial's rules snapshot (12), typing the shared scene (13), the plugin side of finding 14, and the dead exports (15). You may list in your plan which of them would help Part A or Part B, with the reason.

Do not change game rules, the look, the text that a player reads, or the plugin page.

## 12. How to report

At the end of each phase, report in ASD-STE100: what you did, the evidence (commands and results, with times), what failed and how you fixed it, what is still open, and the next decision for the owner. Do not say that something works without evidence. If a test fails, give the output. If you skipped a step, say so.
