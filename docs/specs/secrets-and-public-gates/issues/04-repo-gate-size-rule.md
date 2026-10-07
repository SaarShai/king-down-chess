# 04: Repo gate refuses a large file at commit

**What to build:** When an agent or the owner commits a file over 2,000,000 bytes, the commit stops with one line that names the rule and the path. A file passes when the size allowlist holds its path with a reason. The gate reads only added and changed files, so a large file that is already on origin and does not change passes. The allowlist starts with the Workshop branch's two motion videos and its five figure samples over the limit.

This ticket replaces the checks spec's stub `gate` with the real repo gate: one Node command with the modes `staged`, `push` and `history`. Exit 0 passes, 1 refuses, 2 is a gate fault and refuses. Each fault is one line on stderr: rule, short commit (or "index"), path, and for a secret the secret file name, never a value. This ticket makes `staged` mode and the size rule work; tickets 05 to 07 add the other modes and rules.

**Blocked by:** checks-and-hooks/02 (the stub `gate` script, the pre-commit hook that calls `gate -- staged`, and the `tempRepo()` harness)

**Status:** ready-for-agent

**Owns:** `tools/gate.mjs` (the file the checks spec's `gate` script starts), `tools/gate/` (rule modules and `size-allowlist.txt`), `tools/gate.test.ts`

**Verify:** `npm test`; then `npm run gate -- staged` in the checkout with nothing staged gives exit 0

- [ ] In `tempRepo()`, a commit that adds a 3 MB file fails through the real pre-commit hook; stderr has one line with the rule `size` and the path.
- [ ] The same commit passes when the allowlist holds the path and a reason.
- [ ] An allowlist line with no reason, an unknown mode and a corrupt input (for example a bad object id from git) each give exit 2 and one fault line.
- [ ] A commit that changes only a small file passes while a large file that is already committed stays in the tree.
- [ ] A commit that changes a large file that is not on the allowlist fails.
- [ ] The allowlist holds the seven paths (two motion videos, five figure samples) with a reason each; a test asserts that each listed path exists in the tree and is over 2,000,000 bytes, so a stale line fails.
- [ ] Exit 0 gives no output.
