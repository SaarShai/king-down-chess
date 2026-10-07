# 10: A commit that removes an assertion from a check must name it

**What to build:** The commit-msg hook stops a rewrite that drops checks in silence. It counts the assertion calls that the staged change removes from each registered browser check: calls to `assert`, to `expect` or to a shared assertion. A line that the same commit also adds does not count, so a moved line is free. Each counted line needs one `Removed-check:` trailer in the message. When the trailers are fewer than the counted lines, the hook refuses, shows the count and the removed lines, and says how to add the trailers. The hook does not judge the reasons in the trailers; a reviewer does.

**Blocked by:** 03, 06

**Status:** resolved

**Owns:** `tools/lib/removed-checks.mjs`, `tools/lib/removed-checks.test.ts`, the commit-msg Node script under `.githooks/`, `tools/git-hooks/commit-msg.test.ts`

- [x] Assertion-counter unit test: removed `assert(`, `expect(` and shared-assertion calls count; a removed comment or a removed non-assertion line does not count; a line removed and added again in the same diff does not count; files outside the registry do not count.
- [x] The counter reads the registered check paths from the runner's registry and the assertion names from the shared module's exports, not from a copy.
- [x] Git-hook test, story 8: a commit that removes three assertion lines from a registered check with two `Removed-check:` trailers is refused, and the output shows the count 3 and the three lines.
- [x] Git-hook test: the same commit with three trailers passes; a commit that only moves an assertion passes with no trailer.
- [x] The model-name refusal of ticket 03 still works in the same hook (its test stays green).

**Verify:** `npm test`; in a scratch clone after `npm ci`: remove one assertion from a registered check and commit without a trailer (refused), then with one `Removed-check:` trailer (passes).

## Comments

Built on `build/checks-and-hooks-10` (2026-10-07).

- Counter: `tools/lib/removed-checks.mjs`. `removedAssertions(diff)` reads a `-U0` diff; `stagedRemovedAssertions()` runs `git diff --cached`. The check paths come from `registry.mjs` (`registeredChecks()`). The assertion names come from the export lines of `checks.mjs` (`assertionNames()`): an export whose name starts with `assert` or whose parameters start with `(page, selector)`. The counter reads the module text and does not import it, so the hook needs no browser package. The counter ignores comments and text in quotes. It compares lines without the indent; one added copy frees one removed copy, in any file of the commit.
- Merges: a line counts only when the merge removes it from each parent. So a merge of a branch that named its removals passes, and a merge that drops a line that both sides hold needs a trailer. Without this rule, each `git merge claude/retro-2026-10-06` with checks-and-hooks/07 and 08 in it was refused (seen once in this build).
- Hook: `.githooks/commit-msg.mjs` collects both faults (model name, removed checks) and refuses once, with the count, each line as `file:line: text`, the trailer form and `git commit -F`.
- Outside `Owns:`: `tools/lib/temp-repo.mjs` copies the three new hook modules (`removed-checks.mjs`, `registry.mjs`, `checks.mjs`) into the temporary repository. The hook test needs them.
- Tests: `tools/lib/removed-checks.test.ts` (9 tests: assert, expect and shared calls count; comments, strings and other lines do not; moved lines do not; files outside the registry do not; a deleted check; lines that start with dashes; the lists come from the registry and the shared module's exports, checked against the imported module). `tools/git-hooks/commit-msg.test.ts` (10 tests: the 4 of ticket 03, still green; story 8 with 3 removed lines and 2 trailers refused, the output shows "removes 3 assertion lines" and the three lines; the same with 3 trailers passes; a moved assertion passes with no trailer; both faults in one run; the two merge cases).
- `npm test` after the merge of the integration tip: type check clean, vitest 56 files, 1043 tests passed; node tests 42 passed.
- Verify in a scratch clone after `npm ci` (browser download off): `core.hooksPath` was `.githooks`. One removed `assert.equal` in `tools/verify-workshop.mjs` without a trailer: refused, exit 1, the line shown. The same commit with one `Removed-check:` trailer: passed. The clone is deleted.
- History check with the counter: the Workshop rewrite `80b9b65` removes 136 assertion lines; `8c91940` removes 33; checks-and-hooks/08 (`1883fb1`) removes 5 (`assert.deepEqual(errors, [])` lines that became `assertNoErrors()`).

Open points for the owner:
1. A changed assertion line counts as a removed line (the spec says that only a line the commit adds again is free). Example: ticket 08 changed 5 lines to the shared assertion and would need 5 trailers. A softer rule (count removed minus added assertion lines per file) is possible; it lets an edit pass but also lets a swap of one assertion for a weaker one pass.
2. Limits: `git commit --amend` counts only the change from the old commit, and the old trailers stay in the message. A commit that deletes a check and also removes it from the registry counts nothing, because the counter reads the registry of the work tree.
