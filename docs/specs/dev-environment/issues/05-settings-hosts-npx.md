# 05: Project settings, Vite hosts and `npx` stop, with one settings test

**What to build:** Each worktree that Claude Code or the desktop app makes links the main checkout's packages. Claude Code ends each commit with `Co-Authored-By: Claude Code <noreply@anthropic.com>`, adds no PR text and no session link, so no commit names a model. Both Vite servers listen on 127.0.0.1 unless the agent passes `--host`, so every check reaches Vite. `npx` stops on a missing package and does not install it from the registry, unless the agent passes `--yes`. One settings test in `npm test` holds every key, entry, host and ignore line of this spec, so a later edit cannot drop one in silence. This ticket adds no dependency.

**Blocked by:** 02, 04; checks-and-hooks/01 (its edit of the `test` block in `vite.config.ts` lands first, and vitest collects tests from the tools folder)

**Status:** ready-for-agent

**Owns:** `.claude/settings.json` (the `worktree` and `attribution` keys only), `vite.config.ts` (`server.host` and the `preview` block only), `.npmrc` (new), `tools/dev-settings.test.ts` (new). Shared files: checks-and-hooks/01 edits the `test` block of `vite.config.ts` first; secrets-and-public-gates/01 to 03 edit `.claude/settings.json` first (through ticket 04)

- [ ] `.claude/settings.json`: `worktree.symlinkDirectories` is `["node_modules"]`. `attribution` is an object: `commit` is `Co-Authored-By: Claude Code <noreply@anthropic.com>`, `pr` is `""`, `sessionUrl` is `false`. `attribution` is never the value `false` (versions before 2.1.281 then skip the whole file).
- [ ] `vite.config.ts`: `server.host` and `preview.host` are `127.0.0.1`. The `server` port rule stays.
- [ ] `.npmrc` holds `yes=false`.
- [ ] No `.worktreeinclude` file exists.
- [ ] Settings test (seam 1) reads the settings, launch, npm and Vite config, and asserts:
  - [ ] the `worktree` and `attribution` values above, with `sessionUrl` false;
  - [ ] the `startup` and `compact` session hook entries, and an executable hook script;
  - [ ] the `worktree` launch entry, no `workshop` entry, the four kept entries, and no absolute launch argument;
  - [ ] both Vite hosts and `yes=false`;
  - [ ] the ignore lines `/node_modules`, the target file and `/sim/out/previews/`;
  - [ ] no worktree-include file, and the installation guard test file present.
- [ ] Each assertion fails when its line is removed (the builder checks this once by hand and notes it in the ticket).

**Verify:** `npx vitest run tools/dev-settings.test.ts`; `npm test`
