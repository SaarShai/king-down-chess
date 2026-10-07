# 01: Tool gate refuses commands that print secrets

**What to build:** When an agent in Claude Code starts a shell command that prints the environment, process command lines or a secret file, Claude Code refuses the command. The reason names a safe form, for example `pgrep -x <name>` or `ps -o pid,stat`. The gate also finds these commands inside `ssh` strings, `sh -c` strings, pipes, chains and wrappers such as `npx`, `sudo`, `env VAR=x` and `time`. It refuses `npm ci`, `npm install` and `npm i` when `node_modules` in the call's working folder is a link, because `npm ci` empties the linked folder; the reason names `wt add <path>`. A gate fault or bad input gives `ask`, never a pass. Plain printer forms and a Read of a secret file are also in the settings deny rules, so they stay refused when the hook is missing or in any permission mode.

The gate is one Node module: a pure decision function (command line, working folder, mode in; decision and reason out) and a wrapper that reads the hook JSON on stdin and writes the PreToolUse JSON on stdout. It stops mistakes, not an adversary.

**Blocked by:** checks-and-hooks/01 (vitest collects tests from the Claude hook folder)

**Status:** resolved

**Owns:** `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (only `hooks.PreToolUse` and `permissions`)

**Verify:** `npm test`

- [x] The settings hold one `PreToolUse` entry with matcher `Bash` that runs the gate wrapper through `$CLAUDE_PROJECT_DIR`; the gate file is executable. The settings test asserts both.
- [x] A table test sends each row as hook JSON on stdin to the exact command string in the settings, and asserts the decision, the reason and exit 0.
- [x] Deny rows: `printenv`; bare `env`, `export`, `set`, `declare -x`, `typeset -x` and their other print-all forms; `pgrep -l`, `pgrep -fl`, `pgrep -a`; `ps aux`, `ps -ef`, `ps eww`, `ps -o command`, `ps -o args`; a read of `/proc/<pid>/environ`; `cat`, `head`, `less` and similar on a file in the secrets folder or on the Typesafe key file. Each reason names a safe form.
- [x] Nested deny rows: each printer inside `ssh host '...'`, `sh -c '...'`, `bash -lc "..."`, a pipe, `&&`, `;`, `$(...)`, `sudo`, `npx`, `env VAR=x` and `time`.
- [x] `npm ci`, `npm install` and `npm i` with a linked `node_modules` in the input `cwd` give deny with `wt add <path>` in the reason; with a real `node_modules` folder or none they pass.
- [x] Pass rows: `grep printenv notes.md`, `echo env`, `set -euo pipefail`, `export PATH=/x:$PATH`, `ps -o pid,stat`, `pgrep -x node`, `cat README.md`, `git log`. A pass gives exit 0 and no output.
- [x] Bad JSON, a missing `tool_input` and a thrown fault in the decision function each give `ask` with a reason that names the fault.
- [x] `permissions.deny` holds the plain printer forms (`printenv`, `pgrep -l`, `pgrep -fl`, `ps aux`) and Read on the secrets folder and the Typesafe key file. The settings test asserts each rule.
- [x] No test fixture holds a real secret value; the secret file names in the table are fake files in a temporary folder.

## Comments

**Build (branch `build/secrets-and-public-gates-01`).**

- Files: `.claude/hooks/tool-gate.mjs` (mode 100755 in git), `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (`permissions.deny` and one `hooks.PreToolUse` entry, matcher `Bash`, command `"$CLAUDE_PROJECT_DIR"/.claude/hooks/tool-gate.mjs`, timeout 10 s). The `SessionStart` entry stays as it was.
- The module exports `decide({ command, cwd, mode })` (the decision; it reads the file system only to see if `node_modules` is a link) and `hook(stdin)` (the wrapper). Run as a script, it always exits 0: a fault gives `ask`, because another exit code lets the call through.
- The lexer splits at `|`, `||`, `&&`, `;`, `&` and new lines, and scans `$(...)`, `(...)` and back quotes as nested commands. It skips heredoc bodies and comments, so a commit message in `$(cat <<'EOF' ... EOF)` with quotes or brackets passes. It strips `VAR=x`, shell keywords and the wrappers `sudo`, `doas`, `npx`, `env`, `time`, `nice`, `nohup`, `timeout`, `command`, `builtin`, `exec`, `xargs`, `caffeinate` and `stdbuf`. It parses `ssh` remote commands, `sh`/`bash`/`zsh -c` strings and `eval` again, to depth 8.
- Rule choices past the ticket text: `ps` passes only with `-o` columns and no command column (`command`, `args`, `cmd`) and no format flag (`f`, `l`, `j`, `u`, `v`, `O`, `s`, `X`). Thus `ps -p 123` is refused too, because the default `ps` output on macOS shows the full command line. `/proc/<pid>/cmdline` is refused like `environ`. The secret readers are `cat`, `head`, `tail`, `less`, `more`, `bat`, `nl`, `tac`, `rev`, `od`, `xxd`, `hexdump`, `strings`, `base64`, `jq`, `grep` (and `egrep`, `fgrep`, `rg`), `sed`, `awk`, `cut`, `sort`, `uniq`, `fold`, `column`, `diff`, `cmp`, and any `< file` redirect. A secret path is a path with a `.secrets` folder, or one that ends in `.config/typesafe/key`. The npm rule also covers the npm aliases of `ci` and `install` (`add`, `ic`, `clean-install` and others).
- `permissions.deny`: `Bash(printenv *)`, `Bash(env)`, `Bash(pgrep -l *)`, `Bash(pgrep -fl *)`, `Bash(pgrep -lf *)`, `Bash(pgrep -a *)`, `Bash(ps aux *)`, `Bash(ps -ef *)`, `Bash(ps eww *)`, `Read(//**/.secrets/**)` (any `.secrets` folder, so also the main checkout's folder from a worktree) and `Read(~/.config/typesafe/key)`.
- Tests (93 in `tool-gate.test.ts`): the settings and file mode test; 32 deny rows; 23 nested deny rows (ssh, `sh -c`, `bash -lc`, ssh in `bash -lc`, pipe, `&&`, `;`, `||`, `$(...)`, back quotes, `sudo`, `sudo -u`, `npx`, `env VAR=x`, `VAR=x env`, `time`, `time -p`, `nohup ... &`, `if ...; then`); 6 linked-`node_modules` deny rows (reason holds `wt add <path>`), 3 rows that pass with a real folder and with none, and `npm test` with a link; 16 pass rows and a non-Bash tool; 4 fault rows (bad JSON, no `tool_input`, a number as the command, an unclosed quote); 6 `permissions.deny` rows. Each row goes as hook JSON on stdin to the exact settings command through `/bin/sh -c`, with `CLAUDE_PROJECT_DIR` set; each asserts exit 0 and an empty stderr; each pass asserts an empty stdout. The fake secret files are in a `mkdtemp` folder and hold `fake-value`.
- Commands run: `npx vitest run .claude/hooks` (93 pass); `npm test` after the merge of the integration tip `c6bc95e`: tsc clean, 40 vitest files, 770 tests pass, 42 node tests pass. One earlier `npm test` failed only on the judge test "never lowers W" (5 s time-out; it also fails alone at 5.3 s; the Workshop finish spec owns the 30 s fix). The next run passed.
- Not tested here: a live Claude Code session that runs the hook. The script starts with `#!/usr/bin/env node`; if the hook process has no `node` on its `PATH`, the hook exits 127 and the call goes through (the deny rules still hold). Ticket 12's rehearsal should show one live deny.
