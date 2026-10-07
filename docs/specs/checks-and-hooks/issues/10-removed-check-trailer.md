# 10: A commit that removes an assertion from a check must name it

**What to build:** The commit-msg hook stops a rewrite that drops checks in silence. It counts the assertion calls that the staged change removes from each registered browser check: calls to `assert`, to `expect` or to a shared assertion. A line that the same commit also adds does not count, so a moved line is free. Each counted line needs one `Removed-check:` trailer in the message. When the trailers are fewer than the counted lines, the hook refuses, shows the count and the removed lines, and says how to add the trailers. The hook does not judge the reasons in the trailers; a reviewer does.

**Blocked by:** 03, 06

**Status:** ready-for-agent

**Owns:** `tools/lib/removed-checks.mjs`, `tools/lib/removed-checks.test.ts`, the commit-msg Node script under `.githooks/`, `tools/git-hooks/commit-msg.test.ts`

- [ ] Assertion-counter unit test: removed `assert(`, `expect(` and shared-assertion calls count; a removed comment or a removed non-assertion line does not count; a line removed and added again in the same diff does not count; files outside the registry do not count.
- [ ] The counter reads the registered check paths from the runner's registry and the assertion names from the shared module's exports, not from a copy.
- [ ] Git-hook test, story 8: a commit that removes three assertion lines from a registered check with two `Removed-check:` trailers is refused, and the output shows the count 3 and the three lines.
- [ ] Git-hook test: the same commit with three trailers passes; a commit that only moves an assertion passes with no trailer.
- [ ] The model-name refusal of ticket 03 still works in the same hook (its test stays green).

**Verify:** `npm test`; in a scratch clone after `npm ci`: remove one assertion from a registered check and commit without a trailer (refused), then with one `Removed-check:` trailer (passes).
