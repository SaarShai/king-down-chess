# 07: History scan for current secret values

**What to build:** The owner runs one command and learns if a current secret value is in any public history. `gate -- history` reads each blob and each commit message that any origin ref reaches, runs only the secret rule, and prints one line per secret file: the file name and "found" or "not found". It prints no value and no path. Exit 0 means nothing was found; exit 1 means at least one value was found, so the owner rotates that key.

**Blocked by:** 06

**Status:** ready-for-agent

**Owns:** `tools/gate.mjs`, `tools/gate/`, `tools/gate.test.ts`

**Verify:** `npm test`; then `npm run gate -- history` in the checkout (output goes into ticket 12, no values)

- [ ] In `tempRepo()`, a fake value in an old commit on a remote branch that is not main gives "found" for its file and exit 1.
- [ ] A value only in a local branch that no origin ref reaches gives "not found" and exit 0.
- [ ] Each secret file in the source gets exactly one line.
- [ ] The output does not hold the fake value.
- [ ] A corrupt repository input gives exit 2.
