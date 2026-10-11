# 01: The integration base for the ChatGPT MVP

Status: resolved

## What this ticket does

It makes the branch `claude/chatgpt-mvp`: the multiplayer foundation plus current main. The MVP build starts from this branch.

## Base commits

| Item | Commit |
|---|---|
| `claude/multiplayer-foundation` tip (branch start) | `e71a8d2c` |
| `origin/main` (fetched 2026-10-11) | `13861709` (PRs #41, #42, #45–#49) |
| Merge commit, no fast-forward | `6ac05a68` "Merge origin/main into the ChatGPT MVP branch" |
| New engine bundle and fixture | `2d994786` |

Worktree: `.claude/worktrees/chatgpt-mvp` (made with `tools/wt.sh add`). Nothing is pushed.

## The merge

- No textual conflicts. Git merged `src/match/worker.ts` (changed on both sides) by itself: main's `hashTree('../workshop/')` and the branch's `__KINGDOWN_ENGINE__` stamp both stay.
- `package-lock.json` is the same as on `origin/main`, so the worktree keeps the linked `node_modules`. No dependency changes.
- The merge caused no failure, so no fix commit was necessary.

## Engine archive

Main changed the rules engine, so the compiled worker has a new fingerprint. `npm run plugin:build` added `engines/360225ee2cca1aaf347f499912beee8ffef77eb58becfed99c3b69de2e77636e.mjs` and its `.save.json` fixture. Commit `2d994786` holds them. The archive now has 2 engines (`2675a7e6…` from the branch, `360225ee…` from the merge).

## Checks on the merged tree

Test database: a new disposable `kingdown_mvp_test` on the local PostgreSQL at 127.0.0.1:55432 (that server already ran), made with `node tools/plugin-db/make-test-db.mjs`.

| Check | Result |
|---|---|
| `npm run plugin:db:init-test` | pass: migrations 0001–0009, each repeatable |
| `npm test` (after the merge) | pass: typecheck clean; vitest 132 files, 2,047 passed, 8 skipped; `node --test` 50/50 |
| `npm test` (after the engine commit) | pass: vitest 132 files, 2,048 passed, 8 skipped; `node --test` 50/50 |
| `npm run build` | pass (only the usual chunk size warning) |
| `npm run plugin:build` | pass; added engine `360225ee…` |
| `npm run plugin:server:check` | pass: resource 4,348,027 JSON bytes |
| `npm run plugin:smoke` | pass: 2 archived engines |
| `npm run plugin:check:protocol` | pass: 16 tools with their hints. The logged "King Down tool failed … UNKNOWN" line is the sanitized internal error case of the check |
| `npm run build:vercel` | pass |
| `npm run check:vercel` | pass: 2 archived engines |
| `npm run check:browser plugin-ui plugin-ui-http plugin-oauth` | pass: 3 of 3 |
| `npm run test:docs` | pass: 5 files, 110 tests |

## Board resource size

4,348,027 JSON bytes. The gate is 4,400,000 (51,973 bytes left). The ask line is 4,350,000 (only 1,973 bytes left). The branch alone measured 4,327,175; main's changes add 20,852.

## Open risks

1. **Resource size.** Any MVP board change (toggles, menus, art, the in-flight `claude/game-marks` branch) almost certainly goes past the 4,350,000 ask line. Plan a size cut, or ask the owner to raise the line, before the board UI work starts.
2. **Branches in flight on main.** `claude/game-marks` changes the plugin board, and `claude/park-clay` moves the clay look out of the build. Merge main again after they land. If either one changes the engine, the archive needs another bundle; delete bundles that never reach a release.
3. **Proving Ground designs.** `MatchSetup` has no design field, so an online game cannot carry a designed piece. This is a gap, not a failure.
4. **Not run here:** `supabase/check-migration.mjs` (pglite), ChatGPT on a real device, a load test, live cron deadlines.
5. **Release.** The release steps and their one-way schema changes in `docs/specs/accounts-multiplayer/pr-body.md` still apply. The next plugin deploy from a tree with this branch ships the new server.
