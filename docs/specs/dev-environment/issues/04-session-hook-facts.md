# 04: Session hook links packages at start and gives facts after a compaction

**What to build:** A Claude Code session that starts in a linked worktree with no packages gets the link at once, through the worktree script's package step. After a compaction, the agent gets the main checkout's open items and live runs as facts, so it never reports a run's state from memory. The text stays under 9,500 characters; when it is longer, it stops at a row boundary and names the file to read. When a file is missing, the agent gets one fact line that names it. The hook never blocks a session. This ticket adds no dependency.

**Blocked by:** 01; checks-and-hooks/02 (`tempRepo()` with the hooks-off option), checks-and-hooks/01 (vitest that collects tests from the Claude hook folder); secrets-and-public-gates/03 (the last tool-gate edit of `.claude/settings.json`, which this ticket also edits)

**Status:** ready-for-agent

**Owns:** `.claude/hooks/session-facts.mjs` (new), `.claude/hooks/session-facts.test.ts` (new), `.claude/settings.json` (two new `SessionStart` entries only). Shared file: secrets-and-public-gates/01 to 03 edit `hooks.PreToolUse` and `permissions` first; this ticket blocks on secrets-and-public-gates/03

- [x] One Node script reads the hook JSON on stdin, writes facts (never commands) on stdout, and always exits 0.
- [x] `.claude/settings.json` has two new `SessionStart` entries, matchers `startup` and `compact`, that start the script through `$CLAUDE_PROJECT_DIR`. The existing `startup` entry for the cloud setup stays. The script is executable in git (mode 100755).
- [x] Source `startup`: in a linked worktree with no `node_modules`, the script runs the worktree script's package step on the input's `cwd` and prints its line. In the main checkout, or with `node_modules` present, it prints nothing.
- [x] Source `compact`: the script finds the main checkout through git's common folder from the input's `cwd`, or uses `CLAUDE_PROJECT_DIR` outside git. It prints the first section of the main checkout's TASKS.md. From docs/QUEUE.md it takes each section whose heading starts with "Running", and prints the table header and each row whose state does not start with "done".
- [x] The total text is under 9,500 characters. Longer text stops at a row boundary, then one line names the file to read.
- [x] A missing TASKS.md or docs/QUEUE.md gives one fact line that names the file.
- [x] Session hook test (seam 1, hook JSON on stdin, from a temporary worktree whose tracker copies differ from the main checkout's):
  - [x] `compact` gives the main checkout's index lines and its newer queue row, and no `done` row; exit 0.
  - [x] A long queue fixture gives text under 9,500 characters that ends with the file line.
  - [x] A missing file gives one fact line; exit 0.
  - [x] `startup` in a worktree with no packages makes a `node_modules` link.
  - [x] The real docs/QUEUE.md has exactly one heading that starts with "Running", and its table has a `state` column.

**Verify:** `npx vitest run .claude/hooks/session-facts.test.ts`; `npm test`

## Comments

Build, 2026-10-07, branch `build/dev-environment-04`.

- **Script.** `.claude/hooks/session-facts.mjs` (mode 100755 in git). It reads the hook JSON on stdin and writes plain text on stdout. Bad or empty input, a git fault or a thrown error gives at most one fact line; the exit code is always 0.
  - `startup`: the hook finds the worktree top from the input's `cwd`. In a linked worktree with no `node_modules` (a dangling link counts as none), it runs `tools/wt.sh add <top>`: the worktree's own copy, else the main checkout's copy. It prints the script's line after `Fact: the package step of the worktree script ran:`. A failure gives one fact line with the last line of the script's error output.
  - `compact`: "the first section" of TASKS.md is the text from the start to the second `## ` heading, with the end blank lines removed. Today the main checkout's TASKS.md is not yet an index (steering-cut/04), so the hook prints its first `##` section. A Running table is a header row with a separator row below it; the `state` column is found by name. A section ends at the next heading of the same or a higher level. Text and tables outside the Running sections are not printed.
  - The cut line names the file of the first row that does not fit: `Fact: the text stops here at the 9500-character limit; the rest is in <absolute path>.`
- **Settings.** Two new `SessionStart` entries, `startup` (timeout 600 s, because a changed lock file makes the package step run `npm ci`) and `compact` (timeout 30 s). Both start `"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-facts.mjs`. The `cloud-setup.sh` entry stays first and unchanged.
- **Tests** (`.claude/hooks/session-facts.test.ts`, 6 tests, all at seam 1: the exact command from the settings, hook JSON on stdin, a `tempRepo({ hooks: false })` main checkout and a linked worktree whose tracker copies differ):
  - `gives the main checkout's open items and its live queue rows, and no done row`
  - `stops a long queue at a row boundary under 9,500 characters, and the last line names the file`
  - `gives one fact line that names a missing file, and exit 0`
  - `links node_modules in a worktree with no packages, then prints nothing when they are present`
  - `prints nothing in the main checkout and makes no link there`
  - `has exactly one heading that starts with "Running", and its table has a state column` (real docs/QUEUE.md)
- **Red first.** The first test failed before the script existed (exit 9 from the missing entry). The `startup` link test failed (ENOENT on the link) before the startup code. The long-fixture test fails with the limit set to 95,000. The real-queue test fails with a second `## Running` heading added.
- **Real run.** From this worktree, `compact` on the real main checkout: exit 0, 7,841 characters, the first section of TASKS.md and three live rows of docs/QUEUE.md. `startup` here (link present): no output, exit 0. Input `garbage`: no output, exit 0.
- **Commands.** `npx vitest run .claude/hooks/session-facts.test.ts`: 6 passed. `npm test` after the merge of the integration tip (ec5fd73): exit 0, vitest 63 files and 1,216 tests passed, node:test 42 passed.
- **Note for the merger.** One earlier `npm test` run had `tools/gate.test.ts` time out (5,000 ms) in one or two tests under parallel load. Alone, that file passed 3 times of 3; the next full runs passed. This ticket does not touch that file.
