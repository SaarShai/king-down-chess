# 08: Store a secret from the clipboard without printing it

**What to build:** The owner copies a key, then runs one command with a name. The command writes the clipboard text into one file with that name in the main checkout's secrets folder, also when it runs from a worktree. The file gets mode 600 and the folder mode 700. The command prints only the name, the size in bytes and a short hash, then clears the clipboard. It refuses an empty clipboard, a name with a slash or a leading dot, and, without `--force`, an existing file. `GATE_SECRETS_DIR` replaces the target folder for tests. So no key enters a chat, and the repo gate finds the new value at once.

**Blocked by:** checks-and-hooks/01 (vitest collects tests from the tools folder), checks-and-hooks/02 (`tempRepo()` with the hooks-off option)

**Status:** resolved

**Owns:** `tools/save-secret.sh`, `tools/save-secret.test.ts`

**Verify:** `npm test`

- [x] The test puts fake `pbpaste` and `pbcopy` on `PATH`. A run writes the file with the clipboard bytes, mode 600, in a folder with mode 700.
- [x] Stdout holds the name, the size and a hash prefix, and does not hold the value; stderr is empty.
- [x] The fake `pbcopy` receives an empty string after the write.
- [x] A run from a linked worktree of a `tempRepo()` writes into the main checkout's secrets folder, not the worktree's.
- [x] An empty clipboard gives a non-zero exit and no file. An existing file gives a non-zero exit and stays unchanged; with `--force` the file gets the new value.
- [x] A name with `/` or a leading `.` gives a non-zero exit.

## Comments

Build (branch `build/secrets-and-public-gates-08`, commit `ea79b45`):

- `tools/save-secret.sh [--force] NAME`. It writes the `pbpaste` bytes unchanged (a trailing newline stays) to a temporary file in the target folder, then moves it to `NAME`, so a refusal leaves no file. It finds the main checkout from the script's own folder through `git rev-parse --git-common-dir`, so the copy in a linked worktree writes into the main checkout. Output: `saved NAME: N bytes, sha256 XXXXXXXX` (8 hex digits). Exit 0 saved, 1 refused, 2 bad arguments.
- `tools/save-secret.test.ts`, 8 tests: the file and its modes; stdout without the value, empty stderr and the cleared clipboard; an empty clipboard; an existing file with and without `--force`; the names `a/b`, `../up` and `.hidden`; a run from a linked worktree.
- Each test fails when its branch in the script is removed (checked one at a time: the name rule, the exists rule, the empty rule, `--show-toplevel` in place of the common folder, no `pbcopy`).
- Difference from the ticket: checks-and-hooks/02 was not merged when this build started, so `tempRepo()` did not exist. The worktree test makes its own repository with no `GIT_` variables and an empty global and system git config (the same isolation as `tempRepo()`). When 02 lands, `tempRepo({ hooks: false })` can replace these lines.
- Not done: a run against the real clipboard, because it would replace the owner's clipboard. The owner can try it with a throwaway name and then delete that file.
- `npm test`: tsc clean, vitest 40 files and 685 tests passed, node tests 42 passed. An earlier run under a load average of 16 failed only the judge timeout test in `src/workshop/judge.test.ts` (13 of 13 pass alone); the checks spec owns that timeout.
