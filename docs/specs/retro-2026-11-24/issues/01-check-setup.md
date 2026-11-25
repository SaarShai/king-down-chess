# The browser check runner makes its own test database and test pages

Status: ready-for-human

Source: [retro](../retro.md), item 1. Branch `retro-env-checks`, merged into `retro-env`.

## Problem

`web-game` fails 18 of 36 runs and `play-scenes` 24 of 81 in the session records of 2026-11-12 to 2026-11-24. The usual cause is setup: `PLUGIN_TEST_DATABASE_URL` is not set, or the build has no test pages. In 21 sessions an agent builds a PostgreSQL by hand.

## Change

- `tools/lib/registry.mjs`: the flag `db: true` on the 14 checks that need the test database.
- `tools/check.mjs`: a run that selects a `db` check, with no `PLUGIN_TEST_DATABASE_URL`, starts a throwaway PostgreSQL on 127.0.0.1 at a free port. Its data folder is in the system temp folder. The runner makes `kingdown_check_test`, prepares the schema, and stops and removes the server on every exit. With the variable set, the runner starts nothing. With no PostgreSQL programs in `PG_BIN`, the run stops before the build with one line and exit code 2. A new Homebrew install of `postgresql@17` can leave the programs out of `/opt/homebrew/bin`: if the run stops with that line, set `PG_BIN=/opt/homebrew/opt/postgresql@17/bin`.
- `tools/check.mjs`: a run that selects a `ciTestPages` check builds with `KINGDOWN_TEST_PAGES=1`.
- `tools/lib/postgres.mjs`: the PostgreSQL helpers that `tools/online-local.mjs` had. Both callers use the module.

## Checks

- `KINGDOWN_TEST_FILE='tools/check*.test.ts' npm test`: 50 tests pass before the merge of main. Six cases are new: the test pages value, the address of a `db` check, no server and no folder after a pass, a fail and SIGTERM, no start when the variable is set, and the stop before the build with no programs.
- `npm run check:browser web-game` with no variable set: ok, 83.3 s.
- `npm run check:browser play-scenes` with no variable set: ok, 224.5 s.
- After the runs: no server process and no data folder.

## Known limits

- A runner that gets SIGKILL leaves the server and its folder.
- An interrupt during the one second of `pg_ctl start` can leave a server with no folder. It stops by itself after about one minute.
- The time limit path has no test of its own. It uses the exit handler that the fail path tests.
- `web-online` and the plugin checks did not run on the throwaway database in this work.
- The database setup takes no machine slot, so a timed check of another worktree can run beside it.
- The port is free between its reservation and the server start. Another process can take it; the run then fails with a database fault and leaves nothing.
- The two cases with a real database run only where `PG_BIN` holds the programs. CI skips them.
## Review

- First review: an agent that did not build the change read head `a8c0b4183`. It found two false skips in the test selector and three smaller faults. Commit `1175061f7` repairs them.
- Main then moved 161 commits. Merge `9965586b0` resolves three conflicts: `package.json`, the check list, and the header of the play scenes check. The full suite passes on the merge: 410 files, 8,031 tests.
- Second review: five agents that did not build the change read head `9965586b0`, one for each area and one for the repairs and the merge. A skeptic tried to refute each blocking finding. Four findings stand and are repaired in one batch: for this ticket, an interrupt during the database start now gives the signal's exit code, a fault in the cleanup cannot keep the leases, and the install line names the program folder.
- Repair check: the reviewer of the repairs and the merge read commit `e4faf165e`. The repair holds. One note is repaired after it and verified with a probe: the interrupt check in the database start needs one turn of the event loop.
- Open findings: none that block. The notes are in "Known limits".

