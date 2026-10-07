# 08: Five checks on the shared module, part B (painted game to visual design)

**What to build:** The painted game, playable clay, powers, special moves and visual design checks read the same three settings and fail on an unexpected page error. Each check uses `env`, `launch`, `trapErrors` and `assertNoErrors` from the shared module. No check holds a port, a browser channel or a tracked output path: screenshots, browser-check JSON and the visual design result file go to `PLAYABLE_OUT`, so a run no longer overwrites tracked files. The powers check's ignored "Failed to fetch" error becomes an allowed pattern with a reason. This ticket does not edit the shared new-game helper; ticket 07 owns it.

**Blocked by:** 06

**Status:** ready-for-agent

**Owns:** `tools/verify-painted-game.mjs`, `tools/verify-playable-clay.mjs`, `tools/verify-powers.mjs`, `tools/verify-special-moves.mjs`, `docs/visual-design/verify.mjs`

- [ ] Each of the five files imports `env`, `launch`, `trapErrors` and `assertNoErrors`, and calls `assertNoErrors` before it exits.
- [ ] No file of the five holds a port number, the string `chrome` or `chromium` as a channel, or a path under `docs/` for output; each output goes under `env('PLAYABLE_OUT')`.
- [ ] The powers check allows "Failed to fetch" with a written reason, and fails on any other page or console error.
- [ ] Runner self-test, stories 11 and 13: `npm run check:browser painted-game playable-clay powers special-moves visual-design` prints ok for each, and the changed-file guard finds no difference.
- [ ] A check that fails for a fault in the game, not in the check, gets a new ticket under `docs/specs/`, and this ticket's `## Comments` names it.
- [ ] Each file's header gives the run command through the runner, not a hand-started server.

**Verify:** `npm test`; `npm run check:browser painted-game playable-clay powers special-moves visual-design`; `git status --porcelain` is the same before and after.
