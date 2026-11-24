# The browser check runner makes its own test database and test pages

Status: ready-for-human

Source: [retro](../retro.md), item 1. Branch `retro-env-checks`, merged into `retro-env`. Not pushed. The owner decides on the pull request.

## Problem

`web-game` fails 18 of 36 runs and `play-scenes` 24 of 81 in the session records of 2026-11-12 to 2026-11-24. The usual cause is setup: `PLUGIN_TEST_DATABASE_URL` is not set, or the build has no test pages. In 21 sessions an agent builds a PostgreSQL by hand.

## Change

- `tools/lib/registry.mjs`: the flag `db: true` on the 14 checks that need the test database.
- `tools/check.mjs`: a run that selects a `db` check, with no `PLUGIN_TEST_DATABASE_URL`, starts a throwaway PostgreSQL on 127.0.0.1 at a free port. Its data folder is in the system temp folder. The runner makes `kingdown_check_test`, prepares the schema, and stops and removes the server on every exit. With the variable set, the runner starts nothing. With no PostgreSQL programs in `PG_BIN`, the run stops before the build with one line and exit code 2.
- `tools/check.mjs`: a run that selects a `ciTestPages` check builds with `KINGDOWN_TEST_PAGES=1`.
- `tools/lib/postgres.mjs`: the PostgreSQL helpers that `tools/online-local.mjs` had. Both callers use the module.

## Checks

- `KINGDOWN_TEST_FILE='tools/check*.test.ts' npm test`: 50 tests pass. Six cases are new: the test pages value, the address of a `db` check, no server and no folder after a pass, a fail and SIGTERM, no start when the variable is set, and the stop before the build with no programs.
- `npm run check:browser web-game` with no variable set: ok, 83.3 s.
- `npm run check:browser play-scenes` with no variable set: ok, 224.5 s.
- After the runs: no server process and no data folder.

## Known limits

- A runner that gets SIGKILL leaves the server and its folder.
- The time limit path has no test of its own. It uses the exit handler that the fail path tests.
- `web-online` and the plugin checks did not run on the throwaway database in this work.
