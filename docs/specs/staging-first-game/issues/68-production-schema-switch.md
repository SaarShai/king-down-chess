# Prove that the production schema switch is safe both ways

Status: resolved (lead decision, 2026-10-22). The test is done on `staging/lane-dbcompat`. The release order in the production plan failed one check (see "Finding"); the plan now applies the current block 4 after 0018 in section 2.4 step 1, Phase D step 10 and section 4.3. Parent: production release plan, blockers B4 and B11.

## What

Production has migrations 0001-0014 and runtime-role blocks 1-11 of `cc1081b2`. The production release plan (sections 2.2-2.4) applies 0016, block 12, 0017 and 0018 while the old build (`cc1081b2`, `dpl_7v1Q…`) is live, then deploys the new build, and applies 0015 last. Section 4.3 says: "Phase A step 2's disposable-database test must prove it." This ticket adds that test and runs ticket 01's database suites (B4).

## Why

The rollback target is the old build on 0014 + 0016-0018. Without a test, nobody knows that both builds start on that schema, or that 0015 ends the rollback window.

## Scope

- New test `tools/plugin-db/production-switch.db.test.ts`.
- Fixtures in `tools/plugin-db/fixtures/`: `plugin-db-check-cc1081b2.mjs` and `runtime-role-cc1081b2.sql` (the `cc1081b2` files, unchanged below a header that cites `cc1081b2`), and a type file for the old check.
- Ticket 01: its status and its database results.
- No product code, migration or runtime-role change. No hosted database. No deploy.

## Acceptance

1. Ticket 01's database suites pass, and ticket 01 records them.
2. In a fresh database at 0001-0014 and the `cc1081b2` blocks 1-11, as the runtime role:
   (a) the old and new start checks pass;
   (b) 0016, block 12, 0017 and 0018 apply in that order;
   (c) both start checks pass again;
   (d) a game that the old insert writes (no `setup_admission`, no `rating_policy`) gets `rating_policy = 'legacy'`, and the new code reads it;
   (e) the new code's game read fails on the 0014-only schema;
   (f) after 0015 the old start check fails and the new one passes.

## Result

### Finding: the new build needs the current block 4

Step (a) and step (c) fail for the new start check. The plan's order is not enough to start the new build.

- Cause: the new start check (`tools/plugin-db-check.mjs`) reads `select id,user_id,kind,payload,created_at from public.notifications`. The runtime role gets `id` and `created_at` only from the current block 4 of `plugin-deploy/runtime-role.sql` (`grant select (id, user_id, kind, payload, created_at) on public.notifications`). Commit `35f5fd14` ("Show private account notices in the shared profile", 2026-10-20) changed block 4 in place. The `cc1081b2` block 4, which production has, grants `select (user_id, kind, payload)` only.
- Evidence: one probe at a time, as the runtime role, at 0014 + blocks 1-11 of `cc1081b2`: each probe passes except `FAIL 42501 permission denied for table notifications :: select id,user_id,kind,payload,created_at from public.notif…`. The start check reports `Apply migrations 0005-0015, then plugin-deploy/runtime-role.sql, before starting the server`.
- The plan's step 10 and section 2.4 list 0016, block 12, 0017, 0018. They do not list block 4. So a deploy that follows the plan answers 503 on every function path, the same way as a missing migration.
- Diagnosis, not a change: when the test applies the current block 4 after 0018, both start checks pass. Grants only add, so the old email grant stays and the old build still starts. The current block 4 is repeatable (`grant`, `drop policy if exists`, `create policy`).
- The other blocks: the diff from `cc1081b2` to the current `runtime-role.sql` changes block 4 and adds block 12. No other block changes.

The task said: if a check fails, record the cause and stop. No migration or runtime-role file changes. The owner decides the release-order fix. The test's pick is: apply the current block 4 after 0018, before the new deploy. It is in the test, so the test fails if a later commit breaks that order.

### Test steps (`tools/plugin-db/production-switch.db.test.ts`)

The test resets the schema of its own copy (`kingdown_lane_dbcompat_prodswitch_test`), applies 0001-0014 once each (they are the same at `cc1081b2` and now: `git diff --stat cc1081b2 HEAD -- supabase/migrations/` lists 0015-0018 only), the audience hook, and blocks 1-11 of the `cc1081b2` fixture for a new runtime role. Each start check runs as that role (`set local role`) in a transaction that it rolls back. The old insert also runs as that role. The new code's `PostgresMatchStore` uses its own pool, whose connections start as that role (`options: -c role=<role>`); the test asserts `current_user` on it. The admin pool only sets up, applies migrations and grants, and checks the stored row.

- (a) Old start check: pass. New start check: **fail**, `SCHEMA_REQUIRED` (the block 4 cause above). The test asserts this result.
- (e) `PostgresMatchStore.load` and `GameService.create` of the new code, as the runtime role, fail with `42703` (missing column) on the 0014-only schema. The new start check does not probe 0017/0018, so it cannot stop this. **Never deploy the new build before 0017 and 0018.**
- (b) 0016, block 12 (current file), 0017, 0018 apply in that order: pass.
- (c) Old start check: pass. New start check: **fail**, `SCHEMA_REQUIRED` (same cause). After the current block 4: old start check pass, new start check pass.
- (d) The new `GameService.create` writes a game as the runtime role. The old insert SQL (`cc1081b2` `src/match/store.ts:51-56`, which names neither new column) writes a game row as the runtime role. The row has `rating_policy = 'legacy'` and `setup_admission = null`. The new `PostgresMatchStore.load` reads it with the same status, setup and players.
- (f) After 0015: the old start check fails with `SCHEMA_REQUIRED` (`kingdown_jobs.user_email` is absent). The new start check passes. So 0015 ends the rollback window.

### Plan section 4.3 statement

"Phase A step 2's disposable-database test must prove it": the test proves it with one added step. The old build `dpl_7v1Q…` starts on 0014 + 0016-0018 and reads and writes games there (`rating_policy` defaults to `legacy`). The new build starts there only after the current block 4 is applied too. 0015 ends the rollback window. The plan file is outside this repo. The lead added "apply the current block 4" to section 2.4 step 1, Phase D step 10 and section 4.3 on 2026-10-22.

### Checks

- Red run (the store runs as the runtime role, so a missing grant bites): a temporary edit before step (d) revoked the role's `select` on `public.games` and granted `select` on every column except `rating_policy`. `KINGDOWN_TEST_FILE=tools/plugin-db/production-switch.db.test.ts npm test`: `Test Files  1 failed (1)`, `Tests  1 failed (1)`, `error: permission denied for table games` at `PostgresMatchStore.load src/match/store.ts:43:16`, from the step (d) `store.load`. The edit was then removed, and the same command passes again (below).
- `npm run plugin:db:init-test`: `Disposable PostgreSQL schema ready (migrations 0001-0018); every migration is repeatable`.
- Ticket 01 suites (eight files, see ticket 01): `Test Files  8 passed (8)`, `Tests  105 passed (105)`.
- `KINGDOWN_TEST_FILE=tools/plugin-db/production-switch.db.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  1 passed (1)`.
- Ticket 01 suites and the new test together: `Test Files  9 passed (9)`, `Tests  106 passed (106)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs`: `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
- Full `npm test` with `PLUGIN_TEST_DATABASE_URL` at `5f5d9179`: fails. `Test Files  4 failed | 252 passed (256)`, `Tests  11 failed | 4668 passed | 8 skipped (4687)`. All 11 failures are the plugin browser tests that tickets 54 and 57 record at their bases: `tools/plugin-app.test.ts` (3), `tools/plugin-lobby.test.ts` (2), `tools/plugin-profile.test.ts` (1), `tools/plugin-screen-lifecycle.test.ts` (5). The errors are the same: Playwright timeouts, `expected '' to be '2 min left'`, `expected 9 to be 8`. This ticket changes no file that they use.
