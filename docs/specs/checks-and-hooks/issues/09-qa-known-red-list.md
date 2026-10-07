# 09: QA runs through the runner, and each known-red case has an open ticket

**What to build:** The QA check runs under the runner like the other checks: it uses the shared module's settings, launch and error trap, and drops `QA_BASE` and its dev-server port. A data file maps a QA case id to an open ticket in the specs tracker. A listed case that fails gives XFAIL and does not fail the run. A listed case that passes gives XPASS, which fails the run, so that the list cannot go stale. An unlisted failure still fails. The list starts empty. A ticket lint in `npm test` fails when a listed ticket file is missing or its status is resolved or wontfix. A known-red case can no longer sit on main for days with no record.

**Blocked by:** 06

**Status:** ready-for-agent

**Owns:** `tools/qa.mjs`, `tools/qa-known-red.json`, `tools/lib/known-red.mjs`, `tools/lib/known-red.test.ts`, `tools/qa-known-red.lint.test.ts`

- [ ] Classifier unit test, story 15: a listed fail gives XFAIL and the run passes; a listed pass gives XPASS and the run fails; an unlisted fail fails the run; an unlisted pass passes.
- [ ] Ticket lint: an entry whose ticket file does not exist fails; an entry whose ticket has `Status: resolved` or `Status: wontfix` fails; an entry with an open ticket passes; the empty list passes.
- [ ] `tools/qa.mjs` holds no `QA_BASE`, no port and no channel literal; it uses `env`, `launch`, `trapErrors` and `assertNoErrors`.
- [ ] The QA summary prints PASS, FAIL, XFAIL or XPASS per case, and the final line counts each.
- [ ] Runner self-test: `npm run check:browser qa` prints one line; each QA case that fails today gets a ticket and a list entry, or a fix, and the builder names them under `## Comments`.
- [ ] The QA file header says how to add a known-red case: open a ticket, then add the case id and the ticket path to the list.

**Verify:** `npm test`; `npm run check:browser qa`.
