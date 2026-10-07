# 07: History scan for current secret values

**What to build:** The owner runs one command and learns if a current secret value is in any public history. `gate -- history` reads each blob and each commit message that any origin ref reaches, runs only the secret rule, and prints one line per secret file: the file name and "found" or "not found". It prints no value and no path. Exit 0 means nothing was found; exit 1 means at least one value was found, so the owner rotates that key.

**Blocked by:** 06

**Status:** resolved

**Owns:** `tools/gate.mjs`, `tools/gate/`, `tools/gate.test.ts`

**Verify:** `npm test`; then `npm run gate -- history` in the checkout (output goes into ticket 12, no values)

- [x] In `tempRepo()`, a fake value in an old commit on a remote branch that is not main gives "found" for its file and exit 1.
- [x] A value only in a local branch that no origin ref reaches gives "not found" and exit 0.
- [x] Each secret file in the source gets exactly one line.
- [x] The output does not hold the fake value.
- [x] A corrupt repository input gives exit 2.

## Comments

Build 2026-10-07, branch `build/secrets-and-public-gates-07`.

- Files: `tools/gate.mjs` (the `history` mode, the header, `messageOf` shared with push mode), `tools/gate/secret.mjs` (new `readSources`: each secret file in name order with its values; `readSecrets` now uses it), `tools/gate.test.ts`.
- Behaviour: `git rev-list --objects --no-object-names --remotes=origin` gives the objects; `git cat-file --batch-check` gives type and size; the gate reads each blob and commit (message only, as in push mode) with `git cat-file --batch`, at most 64 MB in one call. One stdout line for each secret file that exists, also a file that gives no value: `<name>: found` or `<name>: not found`. No value, no path, no commit. Exit 0 when nothing is found, 1 when a value is found, 2 for a gate fault.
- Addition to the ticket: a repository with no `refs/remotes/origin/*` ref is a gate fault (exit 2, "no origin ref; do git fetch origin, then try again"). Without it the scan reads nothing and says "not found", which is false comfort.
- Tests (`npx vitest run tools/gate.test.ts`, 31 pass; 3 new in `secret rule > history mode`, each in `tempRepo()` with fake sources): a value in an old commit (a later commit removes it) and a value in a commit message, on a remote branch `side` that is not main and has no local branch, give `found` for their files and exit 1; a JSON file with no secret key and a file whose value is not in history give `not found`; the four lines are exactly one per secret file. A value only in a local branch gives `not found` and exit 0. A missing loose blob that origin reaches, and a repository with no origin ref, each give exit 2, empty stdout and one fault line. Each case asserts that stdout and stderr do not hold a fake value; the first case also asserts that they do not hold a path.
- Red first: the 3 new cases failed with `unknown mode "history"` before the change.
- `npm test` after the merge of the integration tip `226bf2c`: type check clean; vitest 62 files, 1128 tests pass; node tests 42 pass.
- Real scan (Verify, for ticket 12), from this worktree on the shared repository, origin refs as of the last fetch (2026-10-06 23:47), no new fetch: `npm run gate -- history` gives `.secrets/kaggle_api_token: not found`, `.secrets/oauth.json: not found`, `.secrets/porkbun_api.json: not found`, `typesafe key: not found`, exit 0, in about 7 s. A probe with a temporary source folder that held the start of the first origin/main commit subject gave `found` and exit 1, so the scan reads the messages. Ticket 12 runs it again after a fetch.
- Hooks: `core.hooksPath` is not set here; I ran `.githooks/pre-commit` by hand on the staged change (exit 0).
