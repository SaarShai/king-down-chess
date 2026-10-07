# 03: Commit messages hold no model name and end with one neutral trailer

**What to build:** The commit-msg hook refuses a message that holds a model name: a whole word, in any case, with or without a version tag. The refusal shows the word it found and says how to fix the message. One name module holds the model names; it is the one exception to decision 4, because a matcher must hold its words, and the steering spec's lint imports it. The prepare-commit-msg hook removes each `Claude-Session:` line, then adds a trailer only when the message has no `Co-Authored-By:` trailer. The Codex marker wins over the Claude Code marker, because Codex inherits `CLAUDECODE` from Claude Code shells. Codex gets `Co-Authored-By: Codex <noreply@openai.com>`; Claude Code gets `Co-Authored-By: Claude Code <noreply@anthropic.com>`; no marker gets no trailer. The builder finds the Codex marker in a Codex shell and records its name in the hook; until then, Codex briefs write their own trailer.

**Blocked by:** 02

**Status:** ready-for-agent

**Owns:** `.githooks/commit-msg` and its Node script, `.githooks/prepare-commit-msg` and its Node script, `tools/lib/model-names.mjs`, `tools/lib/model-names.test.ts`, `tools/git-hooks/commit-msg.test.ts`, `tools/git-hooks/prepare-commit-msg.test.ts`

- [x] Name-matcher unit test: each name in the module matches as a whole word in lower, upper and mixed case, with and without a version tag; the same letters inside a longer word do not match; a clean message gives no match.
- [x] Git-hook test, story 6: a commit whose message holds a model name exits non-zero, and the output holds the word it found and the fix.
- [x] Git-hook test, story 7: with the Claude Code marker set, the commit ends with exactly one `Co-Authored-By: Claude Code <noreply@anthropic.com>` line and no `Claude-Session:` line.
- [x] Git-hook test: with both markers set, the commit ends with exactly one `Co-Authored-By: Codex <noreply@openai.com>` line.
- [x] Git-hook test: with no marker, the hook adds no trailer and still removes `Claude-Session:` lines.
- [x] Git-hook test: a message that already has a `Co-Authored-By:` trailer keeps exactly one trailer.
- [x] The Codex marker name comes from a real Codex shell; the builder records the variable name (never its value) under `## Comments` in this file. If no Codex shell is at hand, the ticket says so there and the Codex test case uses the name that the hook reads.

**Verify:** `npm test`; in a scratch clone after `npm ci`: a commit with a model name in the message (refused), and a commit with `CLAUDECODE=1` set (one neutral trailer).

## Comments

Build 2026-10-07, branch `build/checks-and-hooks-03`.

- Files: `tools/lib/model-names.mjs` (`MODEL_NAMES`, `findModelNames(text)` gives `{ word, line }` for each find), `.githooks/commit-msg` and `commit-msg.mjs`, `.githooks/prepare-commit-msg` and `prepare-commit-msg.mjs` (sh launchers as in ticket 02), `tools/lib/model-names.test.ts`, `tools/git-hooks/commit-msg.test.ts`, `tools/git-hooks/prepare-commit-msg.test.ts`.
- **One edit outside Owns:** `tools/lib/temp-repo.mjs` (ticket 02) now copies `tools/lib/model-names.mjs` into the temp work tree and lists it in `.git/info/exclude`. The commit-msg hook imports the module, so without the copy every hook test of tickets 02, 04 and 10 fails.
- **Codex marker:** `CODEX_THREAD_ID`. Source: a real Codex shell (`codex exec`, CLI 0.159.2, read-only sandbox) printed only the variable names. Codex set `CODEX_CI`, `CODEX_SANDBOX`, `CODEX_SANDBOX_NETWORK_DISABLED`, `CODEX_SESSION_ID`, `CODEX_THREAD_ID` and `CODEX_VERSION`; the Claude Code shell that started it had none of these. `CODEX_SANDBOX` is not used, because Codex does not set it with full access. Only the non-interactive mode was read; the hook header records the name and the date.
- **The name list** (14 family names) holds the Claude families, the OpenAI series name and nine other families, among them the local models of `docs/DELEGATION.md`, because the steering spec says "Helpers and machines names no model". Not in the list: tool names (Claude Code, Codex), the product name Jev (the steering spec keeps it), and the two-character series names, because the same letters occur in code and data (690 tracked files). Some names are also English words; a commit that uses one of them in its English sense is refused. The owner can shorten the list in one place.
- Match rule: a whole word in any case, then an optional version tag (space, hyphen, dot or underscore, optional `v`, digits with dots or hyphens, optional letters). A letter or digit before the name or after the find stops it.
- commit-msg reads no comment line (`core.commentChar`, default `#`) and nothing below the scissors line of `git commit -v`. The refusal names each word and its line, the two neutral trailers, and `git commit -F "<message file>"`.
- prepare-commit-msg: removes each `Claude-Session:` line (any case), then runs `git interpret-trailers --if-exists doNothing`, so a `Co-Authored-By:` trailer in any case stops the add. A message with no text of its own gets no trailer, so git still refuses an empty message. The hook also adds the trailer to merge commits (the merge of the integration tip into this branch got one trailer).
- Tests (`npx vitest run tools/lib/model-names.test.ts tools/git-hooks`): 31 matcher tests (each name in lower, upper and mixed case with 8 tag forms, inside a longer word, line numbers, a clean message with chess squares and both trailers); commit-msg 4 (story 6 word, line and fix, no commit made; each name through the launcher; a clean message passes; a name in the `-v` diff passes); prepare-commit-msg 5 (story 7; both markers give Codex; no marker removes the session line and adds none; an existing trailer stays the only one, also in lower case; an empty message is still refused).
- `npm test` after the merge of the integration tip (`b94145a`): typecheck ok; vitest 46 files, 840 tests pass; node tests 42 pass.
- Verify, scratch clone of this branch: `npm ci` exits 0 and sets `core.hooksPath` to `.githooks`. A commit with a model name and a version tag exits 1 and shows the word, line 3 and the fix. A commit with `CLAUDECODE=1` and a `Claude-Session:` line gives "Add zz", a blank line and one `Co-Authored-By: Claude Code <noreply@anthropic.com>` line. Scratch clone removed.
- The commits of this branch ran through the new hooks (`git -c core.hooksPath=.githooks commit`); each one has one trailer.
