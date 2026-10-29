# Run old-server invitation reads across release changes

Status: resolved
Type: task

## Fault and scope

Retro item 3 finds no CI test for old-server invitation reads across migration 0022 release, rollback, and restore. The guide has the corrected order. Its text test cannot prove that an unrelated account gets no named-invitation details.

Keep the service and store from `38f8aefa` as test fixtures. Use a disposable local database with migration 0022. Keep the existing old-write tests and the separate guide text test.

## Plan

1. Add a database test. Run the privacy assertion with each unsafe order from the two release reviews. Record the failures before the repair.
2. Run the documented order with held requests and a late send. Keep the unsafe orders as controls that must fail the same privacy assertion.
3. Run affected tests, the full unit suite, and doc checks with the shared test and browser locks. Commit, push, and open a PR into main.

## Acceptance

- Release and restore finish old requests before the new server can send a named invitation.
- Rollback finishes a late new-server send before it cancels named invitations and enables old traffic.
- An unrelated account gets no sender or game details in the documented order.
- Each unsafe order fails the same behavior check.
- The existing PostgreSQL CI job collects the new test. It uses no remote database.

## Evidence

The first test run has six privacy failures and two fixture hash passes. The Node 24 repeat also has six privacy failures. Its six unsafe controls and two fixture checks pass. The failed cases cover release, rollback, and restore, by token and by code:

```text
An unrelated account must get no named-invitation details:
expected 'fulfilled' to be 'rejected'
Test Files  1 failed (1)
Tests       6 failed | 8 passed (14)
```

First run: `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_plugin_test KINGDOWN_TEST_FILE=src/match/invite-transition.db.test.ts npm test`.

The Node 24 repeat uses `KINGDOWN_TEST_FILE=src/match/invite-transition.red.test.ts npm test` with the same local database. The copy changes only the action order to each unsafe sequence.

The Node 24 before log is `/private/tmp/fix-invite-probes-before-node24.log`. The test copy is `/private/tmp/fix-invite-probes-red-node24.test.ts`. The first before log is `/private/tmp/fix-invite-probes-before.log`.

The repair reads the action order and rollback SQL from `supabase/README.md`. It runs these actions with the old service and store. Each unsafe control must expose the sender handle and game options, then fail the same privacy assertion. Each documented order must refuse the unrelated account. The rollback checks both an existing invitation and the late send. It also checks old join refusal after cancellation. The old minute sweep ends both cancelled waiting games before the zero-count check.

The test uses one disposable local database, three independent pools, a held real transaction, and a queued real preview. It drops the database after the suite. The fixture hashes cover both whole prior files after import path changes are removed. The files stay under `tools/fixtures/` to keep the production source error-text scan unchanged. The existing PostgreSQL `verify` CI job collects the file through `npm test`.

Node 24.21.0 and local PostgreSQL 17.11 on port 55432 run the checks. The affected run passes 76 tests in three files: 14 new checks, 59 friend invitation checks, and 3 guide checks. Both type checks and all 67 art checks pass. This is a selected pass, not a full-suite pass.

Selection: `KINGDOWN_TEST_FILE='{src/match/{invite-transition,friend-invites}.db,tools/invite-rollback.docs}.test.ts'`. No test-name filter applies. Log: `/private/tmp/fix-invite-probes-affected.log`.

All checks hold the shared test lock through `tools/test-lock.sh`. Each phase checks the quiet lock. The first full-suite attempt has a lock timeout before tests start. The retry uses the documented test-lock path. No hook input changes.

The first full run ends with `ENOSPC`. The doc checks cannot start because disk space is exhausted. The npm download cache is cleared. The retry passes. Logs: `/private/tmp/fix-invite-probes-full-enospc.log` and `/private/tmp/fix-invite-probes-docs-enospc.log`.

The full `npm test` retry passes 5,716 tests in 288 files, both type checks, and all 67 art checks. It skips 8 tests. It uses no file, name, or skip filter. `npm run test:docs` passes 183 tests in 16 files. The local database bootstrap passes with every migration applied twice, including 0022.

The final database query finds no remaining invitation transition test database. Logs: `/private/tmp/fix-invite-probes-full.log`, `/private/tmp/fix-invite-probes-docs.log`, and `/private/tmp/fix-invite-probes-db.log`.

## Review

The diff adds tests, fixed prior code, and this ticket. Production source files match `f8fcec0a`. The fixture location keeps the production error-text scan unchanged. The existing write and guide tests stay in place. The PR needs an independent review before merge.
