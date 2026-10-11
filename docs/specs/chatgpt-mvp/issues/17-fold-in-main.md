# 17 · Fold in main

Status: ready-for-agent
Type: AFK
Size: S (repeats)
Blocked by: none

## Scope

After each merge to main from the rules session (`claude/game-marks`, `claude/park-clay`) and before the review:
- merge `origin/main` into the integration branch;
- run `npm test`, `plugin:build`, `plugin:server:check`, `plugin:smoke`, `check:browser plugin-ui plugin-ui-http`;
- add an engine bundle when the engine changed;
- record the page size and each merge below.

## Log

### 2026-10-11, round 1: PRs #50 and #51

- Merge: `origin/main` at `b7ff1555` (PR #51, clay parked; it holds PR #50, game marks) into `claude/chatgpt-mvp` as `634f5690`. 13 commits from main, 309 files.
- Conflicts: none in the text. The `Highlights` type move (see `notes/d-rules-session.md`) does not affect the branch: no plugin or multiplayer file imports `src/render/renderer.ts`, and main already moved the game-marks fields to `src/render/marks.ts`. In `package.json` main removes the three `graphics:*` scripts; the plugin scripts stay.
- Engine: no change in `src/rules`, `src/ai` or the engine files. `plugin:build` adds no bundle; the archive keeps 2 engines.
- Test database: a new disposable `kingdown_mvp17_test` (127.0.0.1:55432); `plugin:db:init-test` applies migrations 0001–0009.

| Check | Result |
|---|---|
| `npm test` | pass on run 5: typecheck clean; vitest 133 files, 2,059 passed, 8 skipped; `node --test` 50/50 |
| `npm run plugin:build` | pass; no new engine |
| `npm run plugin:server:check` | pass: resource 4,351,121 JSON bytes |
| `npm run plugin:smoke` | pass: 2 archived engines |
| `npm run check:browser plugin-ui plugin-ui-http` | pass: 2 of 2 |

- Failed runs before the pass, none caused by the merge:
  - Runs 1–3: `src/rules/power-fixes.test.ts:470` (Darkness readings, random boards) goes past its 5 s limit (5.1–7.6 s). The machine load was 30–41 on 16 cores. The merge changes no code that this test runs. At load 11 (runs 4 and 5) it passes.
  - Run 4: `src/online/accounts.db.test.ts` stops in `beforeAll` with "deadlock detected". Roles belong to the whole server, but `pg_advisory_lock` holds only in one database. So a test run in a different worktree on the same server can make role changes at the same time.
- Page size: `dist-plugin-ui/board.html` is 4,349,798 bytes. The MCP resource payload is 4,351,121 bytes (budget 4,400,000). **Flag:** the payload is above the 4,350,000 stop-and-ask line, 1,121 bytes over. At ticket 01 it was 4,348,027; game marks add 3,094 bytes.
- Open items: (1) the payload size needs a decision before the plugin page grows more; (2) the power-fixes test needs its own longer limit, or it fails under load; (3) the role lock in `accounts.db.test.ts` needs to hold across all databases on the server.
