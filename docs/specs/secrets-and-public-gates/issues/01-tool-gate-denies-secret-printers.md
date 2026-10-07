# 01: Tool gate refuses commands that print secrets

**What to build:** When an agent in Claude Code starts a shell command that prints the environment, process command lines or a secret file, Claude Code refuses the command. The reason names a safe form, for example `pgrep -x <name>` or `ps -o pid,stat`. The gate also finds these commands inside `ssh` strings, `sh -c` strings, pipes, chains and wrappers such as `npx`, `sudo`, `env VAR=x` and `time`. It refuses `npm ci`, `npm install` and `npm i` when `node_modules` in the call's working folder is a link, because `npm ci` empties the linked folder; the reason names `wt add <path>`. A gate fault or bad input gives `ask`, never a pass. Plain printer forms and a Read of a secret file are also in the settings deny rules, so they stay refused when the hook is missing or in any permission mode.

The gate is one Node module: a pure decision function (command line, working folder, mode in; decision and reason out) and a wrapper that reads the hook JSON on stdin and writes the PreToolUse JSON on stdout. It stops mistakes, not an adversary.

**Blocked by:** checks-and-hooks/01 (vitest collects tests from the Claude hook folder)

**Status:** ready-for-agent

**Owns:** `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (only `hooks.PreToolUse` and `permissions`)

**Verify:** `npm test`

- [ ] The settings hold one `PreToolUse` entry with matcher `Bash` that runs the gate wrapper through `$CLAUDE_PROJECT_DIR`; the gate file is executable. The settings test asserts both.
- [ ] A table test sends each row as hook JSON on stdin to the exact command string in the settings, and asserts the decision, the reason and exit 0.
- [ ] Deny rows: `printenv`; bare `env`, `export`, `set`, `declare -x`, `typeset -x` and their other print-all forms; `pgrep -l`, `pgrep -fl`, `pgrep -a`; `ps aux`, `ps -ef`, `ps eww`, `ps -o command`, `ps -o args`; a read of `/proc/<pid>/environ`; `cat`, `head`, `less` and similar on a file in the secrets folder or on the Typesafe key file. Each reason names a safe form.
- [ ] Nested deny rows: each printer inside `ssh host '...'`, `sh -c '...'`, `bash -lc "..."`, a pipe, `&&`, `;`, `$(...)`, `sudo`, `npx`, `env VAR=x` and `time`.
- [ ] `npm ci`, `npm install` and `npm i` with a linked `node_modules` in the input `cwd` give deny with `wt add <path>` in the reason; with a real `node_modules` folder or none they pass.
- [ ] Pass rows: `grep printenv notes.md`, `echo env`, `set -euo pipefail`, `export PATH=/x:$PATH`, `ps -o pid,stat`, `pgrep -x node`, `cat README.md`, `git log`. A pass gives exit 0 and no output.
- [ ] Bad JSON, a missing `tool_input` and a thrown fault in the decision function each give `ask` with a reason that names the fault.
- [ ] `permissions.deny` holds the plain printer forms (`printenv`, `pgrep -l`, `pgrep -fl`, `ps aux`) and Read on the secrets folder and the Typesafe key file. The settings test asserts each rule.
- [ ] No test fixture holds a real secret value; the secret file names in the table are fake files in a temporary folder.
