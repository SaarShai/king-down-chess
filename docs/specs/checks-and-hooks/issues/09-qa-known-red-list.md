# 09: QA runs through the runner, and each known-red case has an open ticket

**What to build:** The QA check runs under the runner like the other checks: it uses the shared module's settings, launch and error trap, and drops `QA_BASE` and its dev-server port. A data file maps a QA case id to an open ticket in the specs tracker. A listed case that fails gives XFAIL and does not fail the run. A listed case that passes gives XPASS, which fails the run, so that the list cannot go stale. An unlisted failure still fails. The list starts empty. A ticket lint in `npm test` fails when a listed ticket file is missing or its status is resolved or wontfix. A known-red case can no longer sit on main for days with no record.

**Blocked by:** 06

**Status:** resolved

**Owns:** `tools/qa.mjs`, `tools/qa-known-red.json`, `tools/lib/known-red.mjs`, `tools/lib/known-red.test.ts`, `tools/qa-known-red.lint.test.ts`

- [x] Classifier unit test, story 15: a listed fail gives XFAIL and the run passes; a listed pass gives XPASS and the run fails; an unlisted fail fails the run; an unlisted pass passes.
- [x] Ticket lint: an entry whose ticket file does not exist fails; an entry whose ticket has `Status: resolved` or `Status: wontfix` fails; an entry with an open ticket passes; the empty list passes.
- [x] `tools/qa.mjs` holds no `QA_BASE`, no port and no channel literal; it uses `env`, `launch`, `trapErrors` and `assertNoErrors`.
- [x] The QA summary prints PASS, FAIL, XFAIL or XPASS per case, and the final line counts each.
- [x] Runner self-test: `npm run check:browser qa` prints one line; each QA case that fails today gets a ticket and a list entry, or a fix, and the builder names them under `## Comments`.
- [x] The QA file header says how to add a known-red case: open a ticket, then add the case id and the ticket path to the list.

**Verify:** `npm test`; `npm run check:browser qa`.

## Comments

Builder, 2026-10-07, branch `build/checks-and-hooks-09`.

- Classifier: `tools/lib/known-red.mjs` (`verdict`, `classify`, `lintList`). Unit test `tools/lib/known-red.test.ts`, 5 tests: a listed fail gives XFAIL and the run passes; a listed pass gives XPASS and the run fails; an unlisted fail fails; an unlisted pass passes; the counts and the summary line.
- Ticket lint: `tools/qa-known-red.lint.test.ts`, 7 tests: the empty list passes; an open ticket passes (both `**Status:**` and `Status:` forms); a missing ticket file fails; `resolved` and `wontfix` fail; two extra faults: a ticket with no Status line, and a path outside `docs/specs/`. The last test lints the real list in the checkout.
- `tools/qa-known-red.json` starts empty (`{}`).
- `tools/qa.mjs` uses `env('PLAYABLE_URL')`, `launch()`, `trapErrors(page)` and `assertNoErrors(errors)`. `assertNoErrors` runs after each case that passes, so a page error that a case does not check also fails it. No `QA_BASE`, no port, no channel literal, no `require('playwright')`. `QA_ONLY` stays as a filter. Each case prints PASS, FAIL, XFAIL or XPASS (with the ticket path for a listed case); the last line is `qa: N PASS, N FAIL, N XFAIL, N XPASS`. The header says how to add a known-red case.
- Known-red cases today: none. `npm run check:browser qa` gave `ok qa 164.8 s`, and the QA log ends `qa: 17 PASS, 0 FAIL, 0 XFAIL, 0 XPASS`. Thus no case needed a ticket or a list entry.
- `npm test` after the merge of the integration tip: typecheck clean; vitest 57 files, 1040 tests passed; node tests 42 passed.
- A first runner run failed with `changed in the checkout: tools/qa.mjs`, because I committed during the run. The guard worked as the spec says; the clean rerun passed.

Notes for the merger and the owner:

- The runner's first-fault line (`tools/check.mjs`, ticket 06) takes the first log line with `FAIL`, `Error`, `failed`, `Timeout` or `timed out`. When a run fails by XPASS, an earlier XFAIL line with `Error` or `Timeout` in its detail can become the reported fault. With no XFAIL line, the reported fault is the summary line, which names the XPASS count. I did not change the runner, because this ticket does not own it.
- The lint does not check that a listed case id still exists in `tools/qa.mjs`. A renamed case leaves its entry with no XPASS. A follow-up can add that check if the owner wants it.

Merger, 2026-10-07: merged into `claude/retro-2026-10-06` with no conflicts. `npm test` on the merge: typecheck clean; vitest 57 files, 1040 tests passed; node tests 42 passed. The first run had one timeout in `src/sim/piece-activity.test.ts` (load average about 20 on this Mac); the file passed alone in 2 s, and the full rerun was green. The two open questions above go to the owner.
