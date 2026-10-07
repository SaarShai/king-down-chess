# 07: Five checks on the shared module, part A (account to new game)

**What to build:** The account, cursor adoption, king effects, lesson return and new game checks read the same three settings and fail on an unexpected page error. Each check uses `env`, `launch`, `trapErrors` and `assertNoErrors` from the shared module. No check holds a port, a browser channel or a tracked output path: screenshots and result files go to `PLAYABLE_OUT`, so a run changes no tracked file. The account check drops its own port default. The cursor adoption check drops its default output folder in the recovery transcripts, which the secrets spec removes. Each page error that a check ignores today becomes an allowed pattern with a reason. The runner runs each check by name.

**Blocked by:** 06

**Status:** resolved

**Owns:** `tools/verify-account.mjs`, `tools/verify-cursor-adoption.mjs`, `tools/verify-king-effects.mjs`, `tools/verify-lesson-return.mjs`, `tools/verify-new-game.mjs`, `tools/new-game-ui.mjs` (tickets 08 and 09 do not edit it)

- [x] Each of the five files imports `env`, `launch`, `trapErrors` and `assertNoErrors`, and calls `assertNoErrors` before it exits.
- [x] No file of the five holds a port number, the string `chrome` or `chromium` as a channel, or a path under `docs/`; each output goes under `env('PLAYABLE_OUT')`.
- [x] Each check now also fails on a console error, unless a pattern with a reason allows it.
- [x] Runner self-test, stories 11 and 13: `npm run check:browser account cursor-adoption king-effects lesson-return new-game` prints ok for each, and the changed-file guard finds no difference.
- [x] A check that fails for a fault in the game, not in the check, gets a new ticket under `docs/specs/`, and this ticket's `## Comments` names it.
- [x] Each file's header gives the run command through the runner, not a hand-started server.

**Verify:** `npm test`; `npm run check:browser account cursor-adoption king-effects lesson-return new-game`; `git status --porcelain` is the same before and after.

## Comments

Builder, 2026-10-07, branch `build/checks-and-hooks-07`.

- Files: `tools/verify-account.mjs`, `tools/verify-cursor-adoption.mjs`, `tools/verify-king-effects.mjs`, `tools/verify-lesson-return.mjs`, `tools/verify-new-game.mjs`. Each imports `env`, `launch` and `trapErrors` from `tools/lib/checks.mjs`, traps each page it opens, and calls `assertNoErrors()` (all trapped pages) before it exits. `tools/new-game-ui.mjs` needed no change: it holds no setting, port, channel or output path.
- Settings: `env('PLAYABLE_URL')` replaces the five URL defaults (the account check's own port default is gone); `launch()` replaces the five `chromium.launch` calls with a channel. The cursor adoption check no longer falls back to the recovery transcript folder.
- Output: `shot()` writes the screenshots, and the adoption JSON goes to `join(env('PLAYABLE_OUT'), 'adoption-browser.json')`. After a run, the output root holds `cursor-adoption/` (touch-mobile.png, adoption-browser.json), `lesson-return/` (2 png) and `new-game/` (4 jpg). The account and king effects checks write no file.
- Allowed errors: one pattern, in the account check: `Failed to load resource: net::ERR_INTERNET_DISCONNECTED`, reason: the fake server refuses each request on purpose. It applies only to the pages opened with `down` (sections 7 and 9). The first run without it failed with three such console errors in section 7; the lesson return and account checks did not trap console errors before. No other check needed a pattern.
- Console errors now fail each check. Probe: a planted `console.error` in the lesson return check (not committed) gave `FAIL lesson-return 7.5 s`; with the plant removed it passes.
- Assertion lines: three `assert.deepEqual(errors, [])` lines became `assertNoErrors()` (cursor adoption, lesson return, new game); the commit names each in a `Removed-check:` trailer. The account check keeps its per-section `assert.deepEqual(server.errors, [])` lines; `server.errors` is now that page's trapped list, so these also see console errors.
- Header: each file gives `npm run check:browser <name>`. The king effects header still names its source module, `docs/2d-first-pieces/board/king-effects.mjs`, as a pointer for readers; the check writes nothing there.
- Game faults: none. No check failed for a fault in the game, so this ticket makes no new ticket.
- Verify, after the merge of the integration tip (`24dad2b`): `npm run check:browser account cursor-adoption king-effects lesson-return new-game`: ok account 53.8 s, ok cursor-adoption 22.6 s, ok king-effects 100.7 s, ok lesson-return 7.4 s, ok new-game 8.6 s, `check: all 5 passed`, exit 0. `git status --porcelain` was the same (empty) before and after.
- `npm test`: typecheck ok. Vitest 55 files, 1028 tests: under load average 18 to 22 (other builders' browser runs), one to three tests hit the 5 s default limit in files this ticket does not touch (`src/workshop/judge.test.ts` "keeps the line within 90 characters", `src/sim/piece-activity.test.ts` "agrees with the counts the games recorded", `tools/gate.test.ts` "staged: a file in the secrets folder"). Each file passes alone (3 files, 43 tests). The next full `npm test` passed: exit 0, typecheck ok, vitest 55 files and 1028 tests passed, node tests 42 passed. After a second merge of the integration tip (`e01874d`, tickets 08 and 09; no file of this ticket, the shared module or the runner changed): `npm test` exit 0, vitest 57 files and 1040 tests passed, node tests 42 passed.
- For the runner owner (not changed here): when `assertNoErrors` fails, the runner's first-fault line shows the source line of the `throw` in `tools/lib/checks.mjs`, not the message, because Node prints that line first and it holds `Error`.
