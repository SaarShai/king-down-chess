# 02: Tool gate asks before production actions and hook bypasses

**What to build:** When an agent starts a command that changes production, DNS or the pages site, or that goes around the git hooks, Claude Code shows the owner a prompt with the reason. The ask forms are `vercel` (also through `npx`, `bunx` and `pnpm dlx`, with or without options before the name), `psql`, `supabase`, the deploy script's publish flag `--publish`, a Porkbun API URL in any command, `gh workflow run`, git `--no-verify`, `git commit -n`, and each change of `core.hooksPath` (`git config` or `git -c`). The gate finds these forms inside `ssh`, `sh -c`, pipes and wrappers, as in ticket 01. In `bypassPermissions` and `dontAsk` mode, each ask becomes deny with the reason "ask the owner in chat", because there a hook ask can pass with no prompt. The plain runner forms are also settings ask rules, so they prompt when the hook is missing.

**Blocked by:** 01

**Status:** resolved

**Owns:** `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (only `hooks.PreToolUse` and `permissions`)

**Verify:** `npm test`

- [x] Ask rows in the table test: each form above, plain and nested, give `ask` with a reason that names the action.
- [x] Pass rows: `grep vercel AGENTS.md`, `echo supabase`, `git commit -m "x"`, `git config user.name`, `tools/deploy.sh` with no flag.
- [x] Each ask row, sent again with `permission_mode` `bypassPermissions` and `dontAsk`, gives deny with "ask the owner in chat". With `default`, `acceptEdits`, `plan` and `auto` it stays `ask`.
- [x] A deny row from ticket 01 stays deny in every mode.
- [x] `permissions.ask` holds `vercel`, `npx vercel`, `bunx vercel`, `pnpm dlx vercel`, `psql`, `supabase` and `gh workflow run`, each with the trailing ` *` form. The settings test asserts each rule.

## Comments

**Build (branch `build/secrets-and-public-gates-02`).**

- Files: `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (only a new `permissions.ask` list; `permissions.deny` and `hooks` stay as ticket 01 left them).
- Ask rules: a command named `vercel` or `vercel@<version>` (any path); `psql`; `supabase` or `supabase@<version>`; a command with a `deploy` or `deploy.sh` word and `--publish` (so `npm run deploy -- --publish` also asks); any word or redirect target with `api.porkbun.com` or `porkbun.com/api` (also in a `VAR=` word); `gh ... workflow run`; git `--no-verify` after any sub-command; `-n` in a `git commit` short-option group before a value option (`-nm x` asks, `-mn` and `-m "-n"` pass); `git config` that sets, adds or unsets `core.hooksPath` (any case); `git -c` or `--config-env` with `core.hooksPath`; a `GIT_CONFIG_KEY_<n>` or `GIT_CONFIG_PARAMETERS` word with `core.hooksPath`.
- Rule choices past the ticket text: a read (`git config core.hooksPath`, `--get`, `get`, `--list`) passes, because it changes nothing. `git push -n` and `git merge -n` pass, because there `-n` is not a hook bypass. New runner wrappers: `bunx`, `pnpx`, and `pnpm dlx|exec`, `yarn dlx|exec`, `npm exec|x`, with options before or after the sub-command.
- One line can hold more than one simple command. A deny anywhere in it wins over an ask (`vercel deploy && printenv` gives deny).
- Mode: in `bypassPermissions` and `dontAsk` each ask, a fault ask too, becomes deny with the reason "... ask the owner in chat." Bad JSON stays `ask`, because the gate cannot read the mode. A deny never changes with the mode.
- `permissions.ask`: `Bash(vercel *)`, `Bash(npx vercel *)`, `Bash(bunx vercel *)`, `Bash(pnpm dlx vercel *)`, `Bash(psql *)`, `Bash(supabase *)`, `Bash(gh workflow run *)`.
- Tests (207 in `tool-gate.test.ts`, 114 new): 33 ask rows and 11 nested ask rows (ssh, `sh -c`, `bash -lc`, pipe, `&&`, `$(...)`, `sudo -u`, `time`, `env FOO=1 npx`, `nohup ... &`), each with a word that the reason must hold; the same 44 rows in six modes each (deny with "ask the owner in chat" in `bypassPermissions` and `dontAsk`, ask in `default`, `acceptEdits`, `plan`, `auto`); 4 deny rows (`printenv`, `ssh m1 'ps aux'`, `vercel deploy && printenv`, a fake secret file) that stay deny in all six modes; a fault in `bypassPermissions` gives deny; 14 new pass rows (the five in the ticket, plus `git config core.hooksPath`, `git config --get core.hooksPath`, `git commit -m "-n"`, `git commit -mn`, `git push -n origin x`, `cat vercel.json`, `echo porkbun.com`, `gh workflow list`, `npm run build`); 7 `permissions.ask` rows. Each row goes as hook JSON on stdin to the exact settings command; the mode rows run the six modes in parallel.
- Commands run: `npx vitest run .claude/hooks` (207 pass); `npm test` after the merge of the integration tip (`e093baf`): tsc clean, 52 vitest files, 1006 tests pass, 42 node tests pass. Two earlier `npm test` runs (before the merge, load average 14 to 17 from other jobs) failed only on 5 s time-outs in `tools/git-hooks/prepare-commit-msg.test.ts` ("keeps exactly one trailer", three real commits in one test) and `src/workshop/judge.test.ts` ("never lowers W"); both files pass alone. The checks spec owns the first file; it may need a longer time-out.
- Not tested here: a live Claude Code session in bypass mode that shows the deny (ticket 12's rehearsal).
