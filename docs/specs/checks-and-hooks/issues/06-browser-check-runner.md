# 06: `npm run check:browser` builds, serves and runs the named checks

**What to build:** One command runs the browser checks with no hand-started server. `npm run check:browser [names]` builds the app, starts Vite's preview on 127.0.0.1 at a free port (port 0), and runs the named checks one at a time; with no names it runs all. A registry names the 13 checks and the self-test, each with a time limit and an optional channel. Each check runs as a child process with its time limit, a log file and the three settings; the registry's channel sets `PLAYABLE_BROWSER`. Each check prints one line: ok or FAIL, the seconds, the first fault and the log path. The output root is one fixed system temp folder: the runner prints it, refuses a root inside the checkout, and empties it at the start. Before and after the checks, the runner hashes each path in the git working-tree status, untracked files included; a difference fails the run and names the paths. One lock file, made with exclusive create in git's common directory, lets only one runner work across all worktrees: a second runner waits, says so once, and takes the lock of a dead process. On every exit the runner stops the server and frees the lock. A second self-test entry writes a scratch file into the checkout, to prove the guard; it runs only by name. The shared check module also gives `tempRepo()`, so that check authors import one module.

**Blocked by:** 02, 05

**Status:** ready-for-agent

**Owns:** `tools/check.mjs`, `tools/lib/registry.mjs`, `tools/lib/lock.mjs`, `tools/lib/lock.test.ts`, `tools/lib/tree-status.mjs`, `tools/lib/tree-status.test.ts`, `tools/check-selftest-dirty.mjs`, `package.json` (script `check:browser`), `tools/lib/checks.mjs` (the `tempRepo` re-export line only)

- [ ] Lock unit test, story 12: a second taker waits and prints one wait line; it takes the lock when the first frees it; it takes the lock of a process that no longer exists; the lock file sits in git's common directory, which two worktrees share.
- [ ] Status unit test, story 11: a changed tracked file, a new untracked file and a deleted file each show as a difference and are named; a file that was dirty before and did not change is not a difference.
- [ ] Runner self-test, story 10: `npm run check:browser selftest` prints one line with ok, the seconds and the log path, and exits 0.
- [ ] Runner self-test, story 11: `npm run check:browser selftest-dirty` exits non-zero and names the scratch file. With no names, the run does not include that entry.
- [ ] Runner self-test, story 12: after a pass, a failing check, a timed-out check and an interrupt (SIGINT), no preview process stays and the lock file is gone.
- [ ] The runner prints the output root, empties it at the start, and refuses to start when the root resolves inside the checkout.
- [ ] A failing check's line holds FAIL, the seconds, its first fault line and its log path, and the run exits non-zero.
- [ ] The registry lists all 13 checks by short name (among them `workshop`, `workshop-cast` and `qa`), each with a time limit; an unknown name stops the run before the build and lists the known names.
- [ ] The runner's usage text lists the registered names and the three settings.

**Verify:** `npm test`; `npm run check:browser selftest`; `npm run check:browser selftest-dirty` (must fail and name the file); two worktrees each starting `npm run check:browser selftest` at once (the second waits).
