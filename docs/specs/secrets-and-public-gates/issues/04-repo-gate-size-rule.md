# 04: Repo gate refuses a large file at commit

**What to build:** When an agent or the owner commits a file over 2,000,000 bytes, the commit stops with one line that names the rule and the path. A file passes when the size allowlist holds its path with a reason. The gate reads only added and changed files, so a large file that is already on origin and does not change passes. The allowlist starts with the Workshop branch's two motion videos and its five figure samples over the limit.

This ticket replaces the checks spec's stub `gate` with the real repo gate: one Node command with the modes `staged`, `push` and `history`. Exit 0 passes, 1 refuses, 2 is a gate fault and refuses. Each fault is one line on stderr: rule, short commit (or "index"), path, and for a secret the secret file name, never a value. This ticket makes `staged` mode and the size rule work; tickets 05 to 07 add the other modes and rules.

**Blocked by:** checks-and-hooks/02 (the stub `gate` script, the pre-commit hook that calls `gate -- staged`, and the `tempRepo()` harness)

**Status:** ready-for-agent

**Owns:** `tools/gate.mjs` (the file the checks spec's `gate` script starts), `tools/gate/` (rule modules and `size-allowlist.txt`), `tools/gate.test.ts`

**Verify:** `npm test`; then `npm run gate -- staged` in the checkout with nothing staged gives exit 0

- [x] In `tempRepo()`, a commit that adds a 3 MB file fails through the real pre-commit hook; stderr has one line with the rule `size` and the path.
- [x] The same commit passes when the allowlist holds the path and a reason.
- [x] An allowlist line with no reason, an unknown mode and a corrupt input (for example a bad object id from git) each give exit 2 and one fault line.
- [x] A commit that changes only a small file passes while a large file that is already committed stays in the tree.
- [x] A commit that changes a large file that is not on the allowlist fails.
- [x] The allowlist holds the seven paths (two motion videos, five figure samples) with a reason each; a test asserts that each listed path exists in the tree and is over 2,000,000 bytes, so a stale line fails.
- [x] Exit 0 gives no output.

## Comments

Build 2026-10-07, branch `build/secrets-and-public-gates-04`.

- Files: `tools/gate.mjs` (the real gate; the stub is gone; the header keeps the checks spec's interface and adds exit 1 and 2 and the fault line format), `tools/gate/size.mjs` (size rule and allowlist parser), `tools/gate/fault.mjs` (the exit-2 fault class, in its own module so that a rule module does not import the command), `tools/gate/size-allowlist.txt` (seven paths, a reason each), `tools/gate.test.ts`.
- Staged mode: `git diff-index --cached -z --no-renames --diff-filter=AMT` against HEAD (or the empty tree before the first commit), then one `git cat-file --batch-check` for the sizes. Submodule entries are skipped. A rename counts as an added file.
- Fault lines: `gate: size: index: <path>: <bytes> bytes is over 2000000; add the path and a reason to tools/gate/size-allowlist.txt` (exit 1); `gate: fault: index: <path>: git cannot read object <id>`, `gate: fault: tools/gate/size-allowlist.txt: line <n>: <path> has no reason`, `gate: fault: unknown mode "<mode>"; the modes are staged and push` (exit 2). Any other error gives `gate: fault: internal: ...` and exit 2.
- Allowlist format: path, one or more spaces, reason; `#` lines and blank lines are comments; a path cannot hold a space. The gate reads the work tree copy of the allowlist (the hook starts in the top folder), not the staged copy. Ticket 05 can read it from the pushed commit for push mode.
- `push` mode is a known mode that applies no rule yet and exits 0, so that the pre-push hook (checks-and-hooks/04) does not refuse every push before ticket 05 lands. `history` is an unknown mode until ticket 07.
- Tests (`npx vitest run tools/gate.test.ts`, 10 pass): through the real pre-commit hook: a 3 MB file refuses with one `gate: size: index: media/big.bin` line and no commit; the same commit with an allowlist line passes with empty stderr; a small change passes while a 3 MB file committed with `--no-verify` stays in the tree; a change to that large file refuses. The gate command: an allowlist line with no reason, an unknown mode, no mode, and an index entry for an object that git does not have (`update-index --info-only`) each give exit 2, empty stdout and one `gate: fault:` line; a clean staged file gives exit 0 with no output. This repository's allowlist: the seven paths with a reason each; each path exists and is over 2,000,000 bytes.
- The slices: the first test was red against the stub; the allowlist and fault tests passed at once, because the first implementation already held the allowlist and the fault path.
- `npm test` after the merge of the integration tip `5982c83`: typecheck ok; vitest 47 files, 850 tests pass; node tests 42 pass.
- Verify: `npm run gate -- staged` in this worktree with nothing staged gives exit 0 and no output. This branch's own commits went through the real pre-commit hook with the real gate.
- Not changed: the `stub gate` block in `tools/git-hooks/pre-commit.test.ts` (checks-and-hooks/02 owns it). It still passes against the real gate (both modes exit 0 there, the header holds the interface words); its name "stub gate" is now stale. The merger or ticket 05 can rename it.
