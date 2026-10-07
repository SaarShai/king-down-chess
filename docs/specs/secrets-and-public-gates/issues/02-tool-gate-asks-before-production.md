# 02: Tool gate asks before production actions and hook bypasses

**What to build:** When an agent starts a command that changes production, DNS or the pages site, or that goes around the git hooks, Claude Code shows the owner a prompt with the reason. The ask forms are `vercel` (also through `npx`, `bunx` and `pnpm dlx`, with or without options before the name), `psql`, `supabase`, the deploy script's publish flag `--publish`, a Porkbun API URL in any command, `gh workflow run`, git `--no-verify`, `git commit -n`, and each change of `core.hooksPath` (`git config` or `git -c`). The gate finds these forms inside `ssh`, `sh -c`, pipes and wrappers, as in ticket 01. In `bypassPermissions` and `dontAsk` mode, each ask becomes deny with the reason "ask the owner in chat", because there a hook ask can pass with no prompt. The plain runner forms are also settings ask rules, so they prompt when the hook is missing.

**Blocked by:** 01

**Status:** ready-for-agent

**Owns:** `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (only `hooks.PreToolUse` and `permissions`)

**Verify:** `npm test`

- [ ] Ask rows in the table test: each form above, plain and nested, give `ask` with a reason that names the action.
- [ ] Pass rows: `grep vercel AGENTS.md`, `echo supabase`, `git commit -m "x"`, `git config user.name`, `tools/deploy.sh` with no flag.
- [ ] Each ask row, sent again with `permission_mode` `bypassPermissions` and `dontAsk`, gives deny with "ask the owner in chat". With `default`, `acceptEdits`, `plan` and `auto` it stays `ask`.
- [ ] A deny row from ticket 01 stays deny in every mode.
- [ ] `permissions.ask` holds `vercel`, `npx vercel`, `bunx vercel`, `pnpm dlx vercel`, `psql`, `supabase` and `gh workflow run`, each with the trailing ` *` form. The settings test asserts each rule.
