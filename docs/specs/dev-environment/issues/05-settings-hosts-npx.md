# 05: Project settings, Vite hosts and `npx` stop, with one settings test

**What to build:** Each worktree that Claude Code or the desktop app makes links the main checkout's packages. Claude Code ends each commit with `Co-Authored-By: Claude Code <noreply@anthropic.com>`, adds no PR text and no session link, so no commit names a model. Both Vite servers listen on 127.0.0.1 unless the agent passes `--host`, so every check reaches Vite. `npx` stops on a missing package and does not install it from the registry, unless the agent passes `--yes`. One settings test in `npm test` holds every key, entry, host and ignore line of this spec, so a later edit cannot drop one in silence. This ticket adds no dependency.

**Blocked by:** 02, 04; checks-and-hooks/01 (its edit of the `test` block in `vite.config.ts` lands first, and vitest collects tests from the tools folder)

**Status:** ready-for-agent

**Owns:** `.claude/settings.json` (the `worktree` and `attribution` keys only), `vite.config.ts` (`server.host` and the `preview` block only), `.npmrc` (new), `tools/dev-settings.test.ts` (new). Shared files: checks-and-hooks/01 edits the `test` block of `vite.config.ts` first; secrets-and-public-gates/01 to 03 edit `.claude/settings.json` first (through ticket 04)

- [x] `.claude/settings.json`: `worktree.symlinkDirectories` is `["node_modules"]`. `attribution` is an object: `commit` is `Co-Authored-By: Claude Code <noreply@anthropic.com>`, `pr` is `""`, `sessionUrl` is `false`. `attribution` is never the value `false` (versions before 2.1.281 then skip the whole file).
- [x] `vite.config.ts`: `server.host` and `preview.host` are `127.0.0.1`. The `server` port rule stays.
- [x] `.npmrc` holds `yes=false`.
- [x] No `.worktreeinclude` file exists.
- [x] Settings test (seam 1) reads the settings, launch, npm and Vite config, and asserts:
  - [x] the `worktree` and `attribution` values above, with `sessionUrl` false;
  - [x] the `startup` and `compact` session hook entries, and an executable hook script;
  - [x] the `worktree` launch entry, no `workshop` entry, the four kept entries, and no absolute launch argument;
  - [x] both Vite hosts and `yes=false`;
  - [x] the ignore lines `/node_modules`, the target file and `/sim/out/previews/`;
  - [x] no worktree-include file, and the installation guard test file present.
- [x] Each assertion fails when its line is removed (the builder checks this once by hand and notes it in the ticket).

**Verify:** `npx vitest run tools/dev-settings.test.ts`; `npm test`

## Comments

**Builder, 2026-10-07** (branch `build/dev-environment-05`).

- Files: `.claude/settings.json` (only `worktree` and `attribution` added, at the top), `vite.config.ts` (`server.host`, new `preview` block; the port rule stays), `.npmrc` (new, `yes=false`), `tools/dev-settings.test.ts` (new, 13 tests). No dependency change. No `.worktreeinclude`.
- Red, then green, in three slices: settings keys (2 tests), Vite hosts (2 tests), npm (1 test). The other 8 tests guard lines that tickets 02 and 04 and secrets-and-public-gates already made; they were green at once, so the removal check below is their red.
- Settings test names: `project settings` (packages link; neutral trailer, no PR text, no session link), `session hook` (startup and compact entries; executable script), `launch file` (worktree entry; four kept entries and no workshop; no absolute path), `Vite` (both hosts 127.0.0.1; port rule), `npm` (`yes=false`), `git` (`/node_modules`, `/.claude/preview-target`, `/sim/out/previews/`), `packages` (no worktree-include file; guard test file present).
- Removal check, once by hand (a script makes each edit, runs the test, then restores the file): 24 edits, 24 red, `git status` empty after. The edits: `worktree` removed; `attribution` set to `false`; a model name in `commit`; `pr` removed; `sessionUrl` removed; startup entry removed; compact entry removed; hook script not executable; `worktree`, `dev`, `playable`, `painted-2d`, `previews` launch entry each removed; a `workshop` entry added; an absolute launch argument added; `server.host` removed; `preview` block removed; `strictPort` removed; `yes=false` removed; each of the 3 ignore lines removed; a `.worktreeinclude` added; the guard test file moved away.
- `npm config get yes` in the worktree gives `false`: npm reads the new file.
- Verify: `npx vitest run tools/dev-settings.test.ts`: 13 passed.
- `npm test` after the merge of the integration tip (56f2908): two plain runs failed only with "Test timed out in 5000ms" (10, then 5 tests in `gate`, `piece-activity`, `judge`, `search`, `power-fixes`, `commit-msg`), at a load average of 38 to 56 from parallel builders. The six files pass alone (115 tests). The same three parts with `--testTimeout=60000`: tsc clean, vitest 64 files and 1,235 tests passed, node tests 42 passed. None of the timed-out tests reads a file of this ticket.
- Final: after the merge of the integration tip d7af90f, a plain `npm test` passed at a load average of 14: tsc clean, vitest 64 files and 1,235 tests, node tests 42.
