# 02: Tracked git hooks start on `npm ci`; pre-commit runs the type check and the gate

**What to build:** After `npm ci`, git uses the tracked hook folder. The `prepare` script is one inline git command that sets `core.hooksPath` to the hook folder as a relative path, and it always exits 0, also in the Kaggle sparse checkout that has no hook folder. Each hook is a shell launcher that adds the Homebrew node folders to PATH and starts its Node script. The pre-commit hook runs `typecheck`, then the repo gate in `staged` mode. Without `node_modules` it refuses and names the dev environment spec's worktree script and its `add` command. Test commands start without git's `GIT_` variables; the gate keeps them. A stub `gate` script exits 0; the secrets spec replaces it. The gate interface is fixed here: `npm run gate -- staged` from pre-commit; exit 0 passes; any other exit or a missing script refuses, and the hook shows the gate's stderr. A `tempRepo()` harness makes a test repository, a bare remote and the hooks, with no `GIT_` variables, empty global and system git configs and a local identity. A hooks-off option leaves out the hooks, for the dev environment spec's tests. The hook folder, `prepare` and the stub gate land in one commit, so that no commit refuses for a missing gate.

**Blocked by:** 01

**Status:** ready-for-agent

**Owns:** `.githooks/pre-commit` and its Node script, `tools/gate.mjs` (the stub), `package.json` (scripts `prepare` and `gate`), `tools/lib/temp-repo.mjs`, `tools/git-hooks/pre-commit.test.ts`, `tools/git-hooks/fixtures/**`

- [ ] `tempRepo()` returns a work tree with a bare remote, the tracked hooks copied in and `core.hooksPath` set. The test asserts that no `GIT_` variable reaches git, and that the global and system configs are empty.
- [ ] The fixture package has `typecheck`, `test` and `gate` scripts; each one passes or fails by a marker file, and the `gate` fixture writes its arguments, its stdin and the `GIT_` variable names it sees to a file. Tickets 03, 04 and 10 add no fixture.
- [ ] `tempRepo({ hooks: false })` sets no hooks path; a commit with a type error passes there.
- [ ] Git-hook test, story 1: a staged type error (the fixture package's `typecheck` fails) makes `git commit` exit non-zero, and the output holds the compiler fault.
- [ ] Git-hook test, story 9: a fixture gate that exits 1 refuses the commit and its stderr shows; a fixture gate that exits 0 lets it pass; a package with no `gate` script refuses and says that the gate is missing.
- [ ] Git-hook test: the fixture gate receives `staged` as its argument and sees the `GIT_` variables that git set; the `typecheck` command does not see them.
- [ ] Git-hook test, story 5: with no `node_modules`, pre-commit refuses and the message names the worktree script and its `add` command (`tools/wt.sh add`).
- [ ] Git-hook test, story 2: `npm run prepare` in a clone sets `core.hooksPath` to the relative hook folder; in a sparse checkout with only the Kaggle paths it exits 0.
- [ ] The stub gate exits 0 and its header states the interface (modes, arguments, exit codes) that the secrets spec implements.

**Verify:** `npm test`; in a scratch clone: `npm ci`, `git config core.hooksPath`, then a commit with a type error (refused) and a clean commit (passes).
