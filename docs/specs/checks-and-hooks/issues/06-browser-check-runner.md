# 06: `npm run check:browser` builds, serves and runs the named checks

**What to build:** One command runs the browser checks with no hand-started server. `npm run check:browser [names]` builds the app, starts Vite's preview on 127.0.0.1 at a free port (port 0), and runs the named checks one at a time; with no names it runs all. A registry names the 13 checks and the self-test, each with a time limit and an optional channel. Each check runs as a child process with its time limit, a log file and the three settings; the registry's channel sets `PLAYABLE_BROWSER`. Each check prints one line: ok or FAIL, the seconds, the first fault and the log path. The output root is one fixed system temp folder: the runner prints it, refuses a root inside the checkout, and empties it at the start. Before and after the checks, the runner hashes each path in the git working-tree status, untracked files included; a difference fails the run and names the paths. One lock file, made with exclusive create in git's common directory, lets only one runner work across all worktrees: a second runner waits, says so once, and takes the lock of a dead process. On every exit the runner stops the server and frees the lock. A second self-test entry writes a scratch file into the checkout, to prove the guard; it runs only by name. The shared check module also gives `tempRepo()`, so that check authors import one module.

**Blocked by:** 02, 05

**Status:** resolved

**Owns:** `tools/check.mjs`, `tools/lib/registry.mjs`, `tools/lib/lock.mjs`, `tools/lib/lock.test.ts`, `tools/lib/tree-status.mjs`, `tools/lib/tree-status.test.ts`, `tools/check-selftest-dirty.mjs`, `package.json` (script `check:browser`), `tools/lib/checks.mjs` (the `tempRepo` re-export line only)

- [x] Lock unit test, story 12: a second taker waits and prints one wait line; it takes the lock when the first frees it; it takes the lock of a process that no longer exists; the lock file sits in git's common directory, which two worktrees share.
- [x] Status unit test, story 11: a changed tracked file, a new untracked file and a deleted file each show as a difference and are named; a file that was dirty before and did not change is not a difference.
- [x] Runner self-test, story 10: `npm run check:browser selftest` prints one line with ok, the seconds and the log path, and exits 0.
- [x] Runner self-test, story 11: `npm run check:browser selftest-dirty` exits non-zero and names the scratch file. With no names, the run does not include that entry.
- [x] Runner self-test, story 12: after a pass, a failing check, a timed-out check and an interrupt (SIGINT), no preview process stays and the lock file is gone.
- [x] The runner prints the output root, empties it at the start, and refuses to start when the root resolves inside the checkout.
- [x] A failing check's line holds FAIL, the seconds, its first fault line and its log path, and the run exits non-zero.
- [x] The registry lists all 13 checks by short name (among them `workshop`, `workshop-cast` and `qa`), each with a time limit; an unknown name stops the run before the build and lists the known names.
- [x] The runner's usage text lists the registered names and the three settings.

**Verify:** `npm test`; `npm run check:browser selftest`; `npm run check:browser selftest-dirty` (must fail and name the file); two worktrees each starting `npm run check:browser selftest` at once (the second waits).

## Comments

Builder, 2026-10-07, branch `build/checks-and-hooks-06`.

- Files: `tools/check.mjs` (the runner), `tools/lib/registry.mjs`, `tools/lib/lock.mjs` and `lock.test.ts` (5 tests), `tools/lib/tree-status.mjs` and `tree-status.test.ts` (9 tests, one of them for the `tempRepo` re-export), `tools/check-selftest-dirty.mjs`, `package.json` (`"check:browser": "node tools/check.mjs"`), `tools/lib/checks.mjs` (one line: `export { tempRepo } from './temp-repo.mjs';`).
- Order of a run: names (an unknown name exits 2 before the build and lists the known names and the usage); the output root (printed; exit 2 when it resolves inside the checkout); the lock; the output root emptied; `npm run build` (log `<root>/build.log`); Vite's `preview()` on 127.0.0.1, port 0; then each check: status snapshot, child process, status snapshot. Exit 0, 1 (a check or the build failed), 2 (usage), 130/143/129 (SIGINT/SIGTERM/SIGHUP).
- Choices that the ticket did not fix:
  - The preview server runs inside the runner process (Vite's `preview()` API), so no preview process can outlive the runner. The port is closed after every exit (probe below).
  - Each check runs in its own process group; at the time limit or on a signal the runner sends SIGTERM to the group, then SIGKILL after 3 s. A signal ends the run with no report line.
  - The status comparison runs before and after each check, not only around the whole run, so the FAIL line names the check that changed the file.
  - `PLAYABLE_BROWSER`: the caller's value wins, else the registry channel, else the module default. The registry gives `chromium` to `cursor-adoption`, `playable-clay` and `qa`, which used Playwright's Chromium before.
  - Two more planned faults run by name only, through the same script: `selftest-fail` (exit 1 with a fault line) and `selftest-hang` (a child process and the browser, never ends; limit 5 s). With no names, the run includes no `selftest-*` entry but `selftest`.
  - `selftest-dirty` leaves `check-selftest-dirty.scratch` in the checkout so that you can see it; delete it after the test. Its text holds the time, so a stale copy cannot hide the next run.
  - First fault: the first log line with `FAIL`, `Error`, `failed`, `Timeout` or `timed out`, else the last line; a time-out says `timed out at the <n> s limit`.
- Time limits come from one full run on this Mac (seconds used / limit): account 53/180, cursor-adoption 22/240, king-effects 100/240, lesson-return 8/180, new-game 8/240, painted-game 79/240, playable-clay 19/240, powers 6/180, special-moves 31/240, visual-design 14/240, workshop 17/240, workshop-cast 10/180, qa 900 (not measured, see below), selftest 1/120.
- Full run (`npm run check:browser`, 6 min 11 s): 9 ok, 5 FAIL, exit 1. The guard named the tracked files of `new-game` (4 jpg), `painted-game` (2 png), `powers` (2 png) and `visual-design` (`checks.json`); tickets 07 and 08 move them to `PLAYABLE_OUT`. `qa` fails at once on `ERR_CONNECTION_REFUSED at http://localhost:5173/`, because it still reads `QA_BASE` (spec: the QA script drops `QA_BASE`, tickets 08 and 09). I restored the overwritten files with `git checkout`.
- `npm run check:browser selftest`: `ok selftest 1.2 s <log>`, exit 0. `npm run check:browser selftest-dirty`: `FAIL selftest-dirty 0.2 s changed in the checkout: check-selftest-dirty.scratch <log>`, exit 1. `npm run check:browser selftest-fail`: the line holds `Error: selftest-fail: the planned fault` and the log path, exit 1.
- Story 12 probe (a scratch script; it reads the port from the runner's "serving" line): after a pass, a failure, a time-out, a SIGINT to the runner and a SIGINT to the whole `npm` process group (as Ctrl-C), each time: the port refuses connections, the lock file is gone, the hang child is dead, and `pgrep -f playwright_chromiumdev_profile` finds 0 browsers before and after. Exit codes 0, 1, 1, 130, 130.
- Root guard: `TMPDIR=<checkout>/tmpx npm run check:browser selftest` exits 2 and names both folders; a file in that root stays. A stale file in the real root is gone after a run.
- Two worktrees: this branch and a scratch detached worktree of it each started `npm run check:browser selftest` at once. One printed `check: another run holds the lock (pid 73314, <other worktree>); waiting for it to end` once, then ran; both exit 0. The scratch worktree is removed.
- `npm test` after the merge of the integration tip (`5982c83`): typecheck ok; vitest 48 files, 854 tests passed; node tests 42 passed.
