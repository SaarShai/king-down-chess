# 04: Session hook links packages at start and gives facts after a compaction

**What to build:** A Claude Code session that starts in a linked worktree with no packages gets the link at once, through the worktree script's package step. After a compaction, the agent gets the main checkout's open items and live runs as facts, so it never reports a run's state from memory. The text stays under 9,500 characters; when it is longer, it stops at a row boundary and names the file to read. When a file is missing, the agent gets one fact line that names it. The hook never blocks a session. This ticket adds no dependency.

**Blocked by:** 01; checks-and-hooks/02 (`tempRepo()` with the hooks-off option), checks-and-hooks/01 (vitest that collects tests from the Claude hook folder); secrets-and-public-gates/03 (the last tool-gate edit of `.claude/settings.json`, which this ticket also edits)

**Status:** ready-for-agent

**Owns:** `.claude/hooks/session-facts.mjs` (new), `.claude/hooks/session-facts.test.ts` (new), `.claude/settings.json` (two new `SessionStart` entries only). Shared file: secrets-and-public-gates/01 to 03 edit `hooks.PreToolUse` and `permissions` first; this ticket blocks on secrets-and-public-gates/03

- [ ] One Node script reads the hook JSON on stdin, writes facts (never commands) on stdout, and always exits 0.
- [ ] `.claude/settings.json` has two new `SessionStart` entries, matchers `startup` and `compact`, that start the script through `$CLAUDE_PROJECT_DIR`. The existing `startup` entry for the cloud setup stays. The script is executable in git (mode 100755).
- [ ] Source `startup`: in a linked worktree with no `node_modules`, the script runs the worktree script's package step on the input's `cwd` and prints its line. In the main checkout, or with `node_modules` present, it prints nothing.
- [ ] Source `compact`: the script finds the main checkout through git's common folder from the input's `cwd`, or uses `CLAUDE_PROJECT_DIR` outside git. It prints the first section of the main checkout's TASKS.md. From docs/QUEUE.md it takes each section whose heading starts with "Running", and prints the table header and each row whose state does not start with "done".
- [ ] The total text is under 9,500 characters. Longer text stops at a row boundary, then one line names the file to read.
- [ ] A missing TASKS.md or docs/QUEUE.md gives one fact line that names the file.
- [ ] Session hook test (seam 1, hook JSON on stdin, from a temporary worktree whose tracker copies differ from the main checkout's):
  - [ ] `compact` gives the main checkout's index lines and its newer queue row, and no `done` row; exit 0.
  - [ ] A long queue fixture gives text under 9,500 characters that ends with the file line.
  - [ ] A missing file gives one fact line; exit 0.
  - [ ] `startup` in a worktree with no packages makes a `node_modules` link.
  - [ ] The real docs/QUEUE.md has exactly one heading that starts with "Running", and its table has a `state` column.

**Verify:** `npx vitest run .claude/hooks/session-facts.test.ts`; `npm test`
