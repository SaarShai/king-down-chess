# 06: Repo gate refuses a secret value in a commit or a message

**What to build:** When a commit or a push adds the exact value of a current secret, the gate refuses it. It finds the value in text files, in binary files and in commit messages, and in a pushed commit that a later commit cleans. The fault line names the rule, the short commit, the path (or "message") and the secret file name; no output holds the value.

The gate takes the values from the main checkout's secrets folder, found through git's common folder also from a worktree, and from the Typesafe key file that AGENTS.md names. A JSON file gives only string values under a key whose name holds `secret`, `token`, `password` or `apikey` (case ignored); another file gives its trimmed content. The search is a fixed byte search. `GATE_SECRETS_DIR` and `GATE_TYPESAFE_KEY` replace the two sources for tests. A missing source gives no values from it; a source that does not read gives exit 2.

**Blocked by:** 05

**Status:** ready-for-agent

**Owns:** `tools/gate.mjs`, `tools/gate/`, `tools/gate.test.ts`

**Verify:** `npm test`

- [x] Each case uses fake sources through `GATE_SECRETS_DIR` and `GATE_TYPESAFE_KEY`, in `tempRepo()` with a bare remote.
- [x] A push fails for a fake value in a text file, in a binary file and in a commit message.
- [x] A push of a commit that adds the value and a later commit that removes it fails and names the first commit.
- [x] A JSON value under a key such as `username` is not a secret: a push that holds it passes. A value under `secretapikey` or `token` fails.
- [x] A commit through the real pre-commit hook that stages a fake value fails.
- [x] For each failing case, stdout and stderr do not hold the fake value; the test asserts this.
- [x] A source folder with no read access gives exit 2.

## Comments

Build 2026-10-07, branch `build/secrets-and-public-gates-06`.

- Files: `tools/gate/secret.mjs` (new: the sources and the rule), `tools/gate.mjs` (the secret rule in both modes, `git cat-file --batch` for the content, the header), `tools/gate.test.ts`.
- Sources: the secrets folder is the parent of `git rev-parse --path-format=absolute --git-common-dir` plus `.secrets`, so a linked worktree finds the main checkout's folder. The gate reads each file in it and its sub-folders and skips names that start with ".". The Typesafe key file is `~/.config/typesafe/key` (AGENTS.md). `GATE_SECRETS_DIR` and `GATE_TYPESAFE_KEY` replace them. A `.json` file gives each string whose own key holds `secret`, `token`, `password` or `apikey` (case ignored); a string in an array takes the key of the array. Another file gives its trimmed content. An empty value is no value. ENOENT gives no values; another read error, or JSON that does not parse, is a gate fault (exit 2). The JSON fault does not give the parse error, because that error can quote the text.
- Search: a fixed byte search (`Buffer.includes`) in each added or changed blob, and in push mode in each commit message (the bytes after the first blank line of the commit object). The gate reads no content when no source gives a value, and loads the sources only when there is a file or a commit to check.
- Fault line: `gate: secret: <12-character commit or index>: <path or message>: <.secrets/<file> or typesafe key>: holds a secret value; <fix>`. The push fix says to rotate the secret if the value left this computer. Lines come in commit order.
- Staged mode sees no commit message (pre-commit runs before git has one); push mode checks each message.
- Tests (`npx vitest run tools/gate.test.ts`, 28 pass; 8 new in `secret rule`, each in `tempRepo()` with a bare remote and fake sources through the two variables): a push with a value in a text file, in a binary file (non-UTF-8 bytes around the value, from the key file with spaces trimmed) and in a commit message refuses with three lines in commit order; a value that one commit adds and the next removes refuses and names only the first commit; a JSON value under `username` passes, values under `secretapikey` and a nested `Token` refuse; a commit through the real pre-commit hook refuses (`index`); a linked worktree with no `GATE_SECRETS_DIR` finds the main checkout's `.secrets`; missing sources pass; a folder and a key file with mode 000 each give exit 2; bad JSON gives exit 2 and one fault line. Each failing case asserts that stdout and stderr do not hold any fake value. `make()` now points both sources at missing files, so no older case reads the real secrets.
- Red first: 6 of the 7 first cases failed before the rule (the missing-sources case passed at once). The secret cases have a 30 s time-out: a push case runs the fixture hooks and git many times, and at load average 30 it took over 5 s.
- `npm test` after the merge of the integration tip `935ce25`: type check clean; vitest 61 files, 1116 tests pass; node tests 42 pass. Two earlier runs at load average 40 to 60 had time-outs in hook tests and `src/workshop/judge.test.ts` (not in this change); the runs at a lower load passed.
- Real sources, no values printed: the gate reads 7 values (`.secrets/kaggle_api_token` 1, `.secrets/oauth.json` 3, `.secrets/porkbun_api.json` 2, `typesafe key` 1). Dry run, no push: `gate push origin url` with this branch tip as a new branch checks the 190 commits that `origin/*` does not reach, gives exit 0 and no output in about 1 s. Ticket 12 makes the real rehearsal after a fetch.
- Hooks: `core.hooksPath` is not set in this repository's config, so `git commit` here does not start the hooks. I ran `.githooks/pre-commit` by hand on the staged change before the first commit (exit 0). I did not set `core.hooksPath`, because that changes the shared config of every checkout.
