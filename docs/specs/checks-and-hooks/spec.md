# Checks and hooks

Status: ready-for-agent
Source: docs/specs/retro-2026-10-06/retro.md items 2, 4, 24

## Problem Statement

`npm test` skips the type check; a type error passed on 2026-10-03. No git hook and no push or pull-request workflow exist. A known-red QA case stayed on main for two days. Commits name AI models. The 13 browser checks need a hand-started server, and eight overwrite tracked files. A rewrite cut the Workshop check from 712 to 74 lines, and no tool saw it.

## Solution

`npm test` runs the type check, vitest and the node tests. `npm ci` starts tracked git hooks, which call the secrets spec's repo gate. `npm run check:browser [names]` builds, serves and runs the browser checks one at a time. All checks share one module (this spec's part of retro item 2).

## User Stories

1. As the owner, I want a type error or an unused name to fail `npm test` and the commit. Check: `npm test`; git-hook test.
2. As an agent, I want `npm ci` to start the hooks, and to pass in the Kaggle sparse checkout. Check: git-hook test.
3. As the owner, I want each push to run the full `npm test` on the pushed commit. Check: git-hook test.
4. As the owner, I want the pre-push hook to refuse a direct push to main that touches a protected path (decision 10). Check: git-hook test.
5. As an agent, I want each refusal to name the fix, such as "fetch first" or the worktree script. Check: git-hook test.
6. As the owner, I want the commit-msg hook to refuse a model name and show the word (decision 4). Check: git-hook test.
7. As the owner, I want each agent commit to end once with its tool's neutral trailer and to hold no `Claude-Session:` line. Check: git-hook test.
8. As a reviewer, I want the commit-msg hook to refuse an unnamed removal of an assertion call, so that no rewrite drops checks in silence. Check: git-hook test.
9. As the secrets builder, I want one named gate script with fixed modes and exit codes. Check: git-hook test.
10. As an agent, I want `npm run check:browser workshop qa` to run those checks with one line each (ok or FAIL, seconds, first fault, log). Check: runner self-test.
11. As the owner, I want the run to fail when a check changes or adds a file in the checkout. Check: status unit test; runner self-test.
12. As an agent, I want the runner to free its server and lock on every exit, and to wait for a run in another worktree. Check: lock unit test; runner self-test.
13. As an agent, I want every check to read the same three settings, and to fail on a page error it does not allow. Check: check lint; runner self-test.
14. As the Workshop finish builder, I want each shared assertion to fail on a broken page, so that the restored groups can fail. Check: runner self-test.
15. As an agent, I want each known-red QA case to have an open ticket, and the run to fail when a listed case passes. Check: classifier unit test; ticket lint.
16. As the owner, I want each pull request into main to run `npm test` on GitHub, because a merge runs no local hook. Check: workflow lint.

## Implementation Decisions

**Package file.** `typecheck` runs the compiler. `test` runs `typecheck`, vitest and the node tests, and stops at the first failure. `test:docs` runs only the doc-lint files (names end in `.docs.test.ts`); `npm test` runs them too. `check:browser` starts the runner; `gate` starts the repo gate. `prepare` is one inline git command that sets `core.hooksPath` to the tracked hook folder as a relative path, and always exits 0. Dev dependencies: `sharp` 0.35.4; `happy-dom` only if the Workshop motion probe passes.

**Compiler and vitest.** This spec removes eight unused names: `rootTurn`, `kingLabel`, `KingChoice`, `Q`, `ALL_CARDS`, `Color`, `readFileSync`, `Rules`. The Workshop finish spec removes five more. Then this spec turns on `noUnusedLocals`. Vitest collects tests from the source, tools and Claude hook folders.

**Shared check module:**
- `env(name)` gives `PLAYABLE_URL` (default 127.0.0.1 port 5189); `PLAYABLE_OUT` (default the check's folder in the output root); `PLAYABLE_BROWSER` (`chromium` when `CLAUDE_CODE_REMOTE` is `true`, else `chrome`). `launch()` opens that channel.
- `trapErrors(page, allow)` collects page and console errors; each allowed pattern has a reason. `assertNoErrors` fails on any other error.
- Assertions: `noSidewaysScroll`, `insideViewport` (both axes), `noOverlap`, `textNotCut`, `minTarget` (takes a minimum size; default 44 px), `noRunningAnimations`, `imageIs` (compares the end of the resolved path). A failure names the selector, viewport and box. `shot(page, name)` writes into the out folder.
- `tempRepo()` makes a test repository, a bare remote and the hooks, with no `GIT_` variable from the caller (only `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_NOSYSTEM`), empty global and system configs and a local identity. A hooks-off option, for the dev environment spec's tests, leaves out the hooks.

**Check edits.** This spec owns the 11 other checks, visual design included. Each uses `env`, `launch`, `trapErrors` and `assertNoErrors`, and holds no port, channel or tracked output path. The QA script drops `QA_BASE`.

**Runner.**
- A registry names the 13 checks and the self-test, each with a time limit and an optional channel. With no names, it runs all.
- The runner makes one lock file with exclusive create in git's common directory, which all worktrees share. A second runner waits, says so once, and takes a dead process's lock.
- The runner builds and starts Vite's preview on 127.0.0.1, port 0.
- The output root is one fixed system temp folder. The runner prints it, refuses a root inside the checkout, and empties it.
- Each check runs as a child process with a time limit, a log and the three settings; the registry's channel sets `PLAYABLE_BROWSER`.
- Before and after, the runner hashes each path in the git working-tree status, untracked files included. A difference fails the run and names the paths.
- On every exit, the runner stops the server and frees the lock.

**QA known-red list.** A data file maps a case id to a ticket. A listed failure gives XFAIL; a listed pass gives XPASS, which fails. The list starts empty.

**Git hooks.** Each hook is a shell launcher that adds the Homebrew node folders to PATH and starts its Node script. Test commands start without git's `GIT_` variables; the repo gate keeps them.
- `pre-commit` runs `typecheck`, then the gate in `staged` mode. Without `node_modules`, it refuses and names the dev environment spec's worktree script.
- `commit-msg` refuses a model name: whole word, any case, any version tag. One name module holds the names, the one exception to decision 4: a matcher must hold its words.
- `commit-msg` also counts removed assertion calls (`assert`, `expect` or a shared assertion) in each registered check. A line the commit also adds does not count. Each counted line needs one `Removed-check:` trailer.
- `prepare-commit-msg` removes each `Claude-Session:` line, then adds a trailer only when the message has none. The Codex marker wins, because Codex inherits `CLAUDECODE` from Claude Code shells. Codex gets `Co-Authored-By: Codex <noreply@openai.com>`; Claude Code gets `Co-Authored-By: Claude Code <noreply@anthropic.com>`; no marker gets none.
- The builder finds the Codex marker in a Codex shell; until then, Codex briefs write their trailer.
- `pre-push` skips deletions and refuses when a pushed commit is not HEAD or tracked files differ from HEAD. For main, it refuses a protected path among the files changed from the remote head. With an unknown remote head, it refuses and says "fetch first". Then it runs `npm test` and the gate in `push` mode.
- Protected paths: `src/`, `public/`, `index.html`, the package files, `supabase/` (decision 10), the hook folder, the Claude settings folder and `tools/`.

**Gate interface.** The `gate` script is the entry point: `gate -- staged` from pre-commit, and `gate -- push <remote> <url>` with git's stdin from pre-push. Exit 0 passes. Any other exit or a missing script refuses; the hook shows stderr. This spec ships a stub `gate` that exits 0; the secrets spec replaces it.

**Test workflow.** One workflow file runs on pull requests into main: Node 22, `npm ci` without browser downloads, `npm test`. It has no push trigger, because the pre-push hook tests each push.

**Shared files.** The Workshop finish spec owns the judge test and gives its seeded case "never lowers W" a 30 s limit; the 5 s default fails under load.

## Testing Decisions

- A good test drives the real hook, runner or page from outside and asserts the verdict, reason, trailer and exit code.
- The git-hook test runs the hooks in `tempRepo()` with a fixture gate and package. It covers stories 1 to 9, both markers set, `prepare` in a sparse checkout with the Kaggle paths, and hooks-off.
- Unit tests cover the lock, the status comparison, `env` defaults, the name matcher, the assertion counter, the changed-file list and the known-red classifier.
- The check lint fails on a port or channel literal, or on a registered check without `env`, `trapErrors` and `assertNoErrors`. The ticket lint fails on a missing or resolved ticket. The workflow lint asserts the triggers, `npm test` and no browser download.
- The runner self-test builds pages with `page.setContent`; each assertion fails on its bad page and passes on its good page. Bad pages: a wide row, a box below the fold, a 30 px button, overlapping boxes, a cut label, a running animation, a thrown error, a wrong image name. `imageIs` passes under relative and absolute bases.
- A second self-test entry writes a scratch file in the checkout; the run must fail and name it.
- Prior art: `src/account/account.test.ts`, `src/workshop/judge.test.ts`, `tools/new-game-ui.mjs`, `tools/king-effects-preview.mjs`.

## Out of Scope

- In other specs: the gate rules (secrets); the doc lints (steering cut, Workshop finish) and the check recipe (steering cut); Vite hosts, worktree links, attribution (dev environment).
- Capture and study scripts: they write tracked files on purpose.
- A type check of tools scripts: many need fixes first.
- Browser checks in hooks or before a merge: they need Chrome and ten minutes; the deploy script runs them.
- A check of each `Removed-check` trailer: it needs a person's judgement.
- Item 25's doc-with-code check: most code commits need no doc change.
- Retro items 9 to 13 and 22 need runs to test. Items 18, 19, 21, 23 and 28 to 30 are small rules for sessions. A history purge needs a force-push.

## Further Notes

- Build this spec first on the integration branch. The `noUnusedLocals` commit lands after the Workshop finish spec's removal commit. The hook folder, `prepare` and the stub `gate` land in one commit, so no commit refuses for a missing gate.
- The last three protected paths extend decision 10, so that gate changes get review; the owner approved this extension on 2026-10-07 (ticket `retro-2026-10-06/10`).
