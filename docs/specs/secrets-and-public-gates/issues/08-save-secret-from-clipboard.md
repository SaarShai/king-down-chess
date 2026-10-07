# 08: Store a secret from the clipboard without printing it

**What to build:** The owner copies a key, then runs one command with a name. The command writes the clipboard text into one file with that name in the main checkout's secrets folder, also when it runs from a worktree. The file gets mode 600 and the folder mode 700. The command prints only the name, the size in bytes and a short hash, then clears the clipboard. It refuses an empty clipboard, a name with a slash or a leading dot, and, without `--force`, an existing file. `GATE_SECRETS_DIR` replaces the target folder for tests. So no key enters a chat, and the repo gate finds the new value at once.

**Blocked by:** checks-and-hooks/01 (vitest collects tests from the tools folder), checks-and-hooks/02 (`tempRepo()` with the hooks-off option)

**Status:** ready-for-agent

**Owns:** `tools/save-secret.sh`, `tools/save-secret.test.ts`

**Verify:** `npm test`

- [ ] The test puts fake `pbpaste` and `pbcopy` on `PATH`. A run writes the file with the clipboard bytes, mode 600, in a folder with mode 700.
- [ ] Stdout holds the name, the size and a hash prefix, and does not hold the value; stderr is empty.
- [ ] The fake `pbcopy` receives an empty string after the write.
- [ ] A run from a linked worktree of a `tempRepo()` writes into the main checkout's secrets folder, not the worktree's.
- [ ] An empty clipboard gives a non-zero exit and no file. An existing file gives a non-zero exit and stays unchanged; with `--force` the file gets the new value.
- [ ] A name with `/` or a leading `.` gives a non-zero exit.
