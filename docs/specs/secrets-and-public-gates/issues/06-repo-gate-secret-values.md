# 06: Repo gate refuses a secret value in a commit or a message

**What to build:** When a commit or a push adds the exact value of a current secret, the gate refuses it. It finds the value in text files, in binary files and in commit messages, and in a pushed commit that a later commit cleans. The fault line names the rule, the short commit, the path (or "message") and the secret file name; no output holds the value.

The gate takes the values from the main checkout's secrets folder, found through git's common folder also from a worktree, and from the Typesafe key file that AGENTS.md names. A JSON file gives only string values under a key whose name holds `secret`, `token`, `password` or `apikey` (case ignored); another file gives its trimmed content. The search is a fixed byte search. `GATE_SECRETS_DIR` and `GATE_TYPESAFE_KEY` replace the two sources for tests. A missing source gives no values from it; a source that does not read gives exit 2.

**Blocked by:** 05

**Status:** ready-for-agent

**Owns:** `tools/gate.mjs`, `tools/gate/`, `tools/gate.test.ts`

**Verify:** `npm test`

- [ ] Each case uses fake sources through `GATE_SECRETS_DIR` and `GATE_TYPESAFE_KEY`, in `tempRepo()` with a bare remote.
- [ ] A push fails for a fake value in a text file, in a binary file and in a commit message.
- [ ] A push of a commit that adds the value and a later commit that removes it fails and names the first commit.
- [ ] A JSON value under a key such as `username` is not a secret: a push that holds it passes. A value under `secretapikey` or `token` fails.
- [ ] A commit through the real pre-commit hook that stages a fake value fails.
- [ ] For each failing case, stdout and stderr do not hold the fake value; the test asserts this.
- [ ] A source folder with no read access gives exit 2.
