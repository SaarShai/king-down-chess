# 07: Five checks on the shared module, part A (account to new game)

**What to build:** The account, cursor adoption, king effects, lesson return and new game checks read the same three settings and fail on an unexpected page error. Each check uses `env`, `launch`, `trapErrors` and `assertNoErrors` from the shared module. No check holds a port, a browser channel or a tracked output path: screenshots and result files go to `PLAYABLE_OUT`, so a run changes no tracked file. The account check drops its own port default. The cursor adoption check drops its default output folder in the recovery transcripts, which the secrets spec removes. Each page error that a check ignores today becomes an allowed pattern with a reason. The runner runs each check by name.

**Blocked by:** 06

**Status:** ready-for-agent

**Owns:** `tools/verify-account.mjs`, `tools/verify-cursor-adoption.mjs`, `tools/verify-king-effects.mjs`, `tools/verify-lesson-return.mjs`, `tools/verify-new-game.mjs`, `tools/new-game-ui.mjs` (tickets 08 and 09 do not edit it)

- [ ] Each of the five files imports `env`, `launch`, `trapErrors` and `assertNoErrors`, and calls `assertNoErrors` before it exits.
- [ ] No file of the five holds a port number, the string `chrome` or `chromium` as a channel, or a path under `docs/`; each output goes under `env('PLAYABLE_OUT')`.
- [ ] Each check now also fails on a console error, unless a pattern with a reason allows it.
- [ ] Runner self-test, stories 11 and 13: `npm run check:browser account cursor-adoption king-effects lesson-return new-game` prints ok for each, and the changed-file guard finds no difference.
- [ ] A check that fails for a fault in the game, not in the check, gets a new ticket under `docs/specs/`, and this ticket's `## Comments` names it.
- [ ] Each file's header gives the run command through the runner, not a hand-started server.

**Verify:** `npm test`; `npm run check:browser account cursor-adoption king-effects lesson-return new-game`; `git status --porcelain` is the same before and after.
