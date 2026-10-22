# Remove unused code and close email access

Status: done
Type: task

## Plan and proof

1. Remove the dormant email jobs, sender, endpoints, and their tests.
2. Add migration 0015. Remove the email grant and function. Keep account deletion. Update release checks and add database probes.
3. Remove the unused Workshop outputs and their tests. Keep the worth, labels, flags, memory, note, and fair-value tests.
4. Remove the unused web poll. Keep the client and its command retries.
5. Remove the QA waiver path. Each failed case must fail the run.
6. Call the search exports directly in the simulator. Remove the draw no-op.
7. Write the engine removal plan. Keep all bundles in this branch.

Each code part gets a commit. Search for readers after each removal.
Run `npx tsc --noEmit`. Commit, then use `m1-unit.sh` for the full suite.
Use the check runner for `plugin-ui`. The current house rules permit either runner.
Run `plugin-ui-http` through the same runner on this Mac. It needs the local test
database; the runner refuses it on the M1. Run one browser check at a time.
The commit hook reads local secret files. This run disables hooks to obey the owner's ban on those reads. Type checks run explicitly.
The M1 skips database tests. Record each changed database test for the main session.
Do not connect to production.

## Part 2: dormant email code

Remove the reminder job, outbox sender, mail module, and email endpoints.
Keep deadline sweeps, account deletion, and daily cleanup.
Keep notification data, preferences, row writes, and their transaction tests.
The HTTP tests now require 404 for both removed endpoints.
Database tests keep all checks for jobs that stay.

## Part 1: runtime email access

Migration 0015 revokes the runtime email grant and drops the helper if it exists.
It uses no `cascade`. An external database dependency stops the drop.
The role script grants only `delete_account` on that line.
The startup probe requires deletion access. It passes with or without the email helper.
The migration runners, release SQL, function lists, and release guides include this change.
The database test starts with a legacy email grant. It applies 0015 twice.
It checks the email call fails, the deletion call works, and startup probes pass.

### Production SQL for the owner

Deploy the code without email jobs first. It starts on schemas 0014 and 0015.
Then apply migration 0015 in release runbook step 9 at any later time.
For an existing 0014 schema, paste only this SQL as the admin role:

```sql
-- The MVP sends no email. Remove the private email reader without a data change.
do $$
begin
  if to_regprocedure('kingdown_jobs.user_email(uuid)') is not null then
    if exists(select from pg_roles where rolname = 'kingdown_plugin_runtime') then
      revoke execute on function kingdown_jobs.user_email(uuid) from kingdown_plugin_runtime;
    end if;
    drop function kingdown_jobs.user_email(uuid);
  end if;
end $$;
```

Then use these read-only checks as the admin role:

```sql
select to_regprocedure('kingdown_jobs.user_email(uuid)') is null as email_removed,
       has_function_privilege('kingdown_plugin_runtime',
         'kingdown_jobs.delete_account(uuid)', 'execute') as deletion_allowed;
```

Both values must be true. Run the startup probes as the runtime role.
This branch does not run SQL on production.

## Part 3: Workshop outputs

Remove `full`, rule removal comparisons, `idle`, `why`, fixes, and rule deltas.
All product and test callers now use `judge(d)`.
Keep the formula, measured anchors, labels, band words, like line, blocked line,
empty prompt, flags, memory, metal, note, stats, and warning fields.
Keep the fair-value table, monotonicity test, and line length test.
Remove only the assertions for deleted outputs. Add an empty prompt test.
Update the Workshop guide.

## Part 4: unused web poll

Remove `merge`, `watch`, and their tests. Keep `onlineClient` and all retry tests.
Add a test for full and incremental game reads. Keep `src/api/http.db.test.ts`.
The product poll in `src/plugin/poll.ts` stays.

## Part 5: QA failures

Delete the empty waiver list, classifier, ticket lint, and their tests.
QA reports only PASS and FAIL. Any failed case sets exit code 1.
Keep each case result and the summary counts.
Remove the waiver branches from the first-fault reader.
A test runs the actual report code with fixed case results and no browser.
It checks the output, counts, and exit code for a pass and a failure.

## Part 6: simulator fallbacks

Remove `applyDrawRules` and its test. Remove the optional reset and key lookups.
Import `resetSearchState` and `positionKey` from the search module.
Keep a key for each position before search. Reset search at each game and each
change to the evaluation or power settings.
The new test drives repeated knight moves with the rule set before play.
It checks both threefold settings, search history, and the reset call.

## Part 7: engine removal plan only

No engine bundle or fixture changes in this branch.

### Runbook step 16

[Step 16](../../chatgpt-mvp/release/RUNBOOK.md) retires the old connection after one
week, with the owner's word and a check for other users. It covers the old client,
resource row, OAuth client, and separate project. It says to postpone removal if a
dependency remains.

The [release record](../../web-adaptation/issues/08-release-evidence.md) dates the
new release to 2026-10-19. Today is 2026-10-20. The week has not passed.
The earliest date from that record is 2026-10-26. The repo gives no proof that the
owner checks all remaining users. The step 16 condition does not hold today.

The 2026-10-19 report lists only `bab22e94` (one unfinished game) and `e668782a`
(four unfinished games). That report is not a fresh query. The current engine
check reads `games` when it exists. It then does not read `plugin_matches`.
A removal needs a read of both tables and the owner's recovery choice.

### Read-only SQL for the owner

Use the private read-only connection. This query reads no player data:

```sql
begin read only;
select 'games' as source, engine_fingerprint as engine, count(*) as games
from public.games
where status not in ('finished', 'aborted', 'annulled')
  and not (status in ('waiting', 'setup') and engine_fingerprint is null)
group by engine_fingerprint
union all
select 'plugin_matches' as source, save::jsonb->>'engine' as engine,
       count(*) as games
from public.plugin_matches
where snapshot->>'status' = 'playing'
group by save::jsonb->>'engine'
order by source, engine;
rollback;
```

Keep null or malformed engines visible. Stop if a row cannot be read or mapped.
Do not treat a failed query as an empty result. A missing old table needs a schema
check before the owner can say that it has no games.

### Exact removal steps for the main session

1. Keep all files until the owner supplies the query result. Check every row
   against the full fingerprints below. Stop if either table uses a target.
   Confirm the recovery build needs none of them. Keep `bab22e94` and `e668782a`.
2. In a new branch, delete these six files with `git rm`:

   ```text
   engines/2675a7e6e32d635615350089a490902f4842ae26a7866d7123c6d95b49c60c5b.mjs
   engines/2675a7e6e32d635615350089a490902f4842ae26a7866d7123c6d95b49c60c5b.save.json
   engines/a5750f9695e8f3cc341a69fb02bd709eed142ce7a36b2c69eaedd612fe1f5d16.mjs
   engines/a5750f9695e8f3cc341a69fb02bd709eed142ce7a36b2c69eaedd612fe1f5d16.save.json
   engines/a6f9ebec5f0f2d5ff0a7b24e726e196fd27821a5133176bcfda26b70de9b75cd.mjs
   engines/a6f9ebec5f0f2d5ff0a7b24e726e196fd27821a5133176bcfda26b70de9b75cd.save.json
   ```

3. Follow [engines/README.md](../../../../engines/README.md): do not edit a bundle.
   Delete one only when no unfinished game uses it. Delete its fixture with it.
   Keep this rule. Remove the two deleted fingerprints from `legacyBundles` in
   `tools/engines.test.ts`; remove that empty list and only its dependent tests.
   Keep the generic archive tests and the `sourceAliases` entry and byte check.
   Update the archive count in web-adaptation ticket 07 to two.
4. Commit. Run the archive and full unit tests on the M1. Run the release archive
   check against the exact release files. The owner supplies a fresh result from
   both tables before release. Keep full command-history replay.

## Changed database tests

- `src/online/jobs.db.test.ts`
- `src/api/http.db.test.ts`
- `tools/plugin-db/migrations.db.test.ts`
- `tools/plugin-db/release-packet.db.test.ts`

Run these only on the disposable loopback database that the lane rules name.
The full M1 suite skips their database cases. The review run below uses an SSH
tunnel to run these files on the M1 against that database. No local unit test runs.

## Taste choices

None. The owner approves the cuts in this ticket. Keep the flags, memory, metal,
note, row writes, and all engine files within the stated scope.

## Checks

- `npx tsc --noEmit`: pass on this Mac.
- `node --check tools/qa.mjs` and `node --check tools/plugin-db-check.mjs`: pass.
- `git diff --check`: pass.
- Reader searches: no caller remains for the deleted email exports, web poll,
  Workshop outputs, QA waiver, or simulator helpers. The email function remains
  only in migration history, its removal, and checks of that removal.
- No diff changes an engine bundle, fixture, alias test, worker, or replay code.
- Full M1 suite at `7f73881f`: exit 1. Vitest reports 172 files passed,
  11 files failed, and 11 files skipped. It reports 2,975 tests passed,
  53 failed, and 185 skipped. The M1 runs out of disk space. Its free space
  after the run is 241 MiB. Temporary files and test repositories fail to write.
  Two failures are stale records from these cuts: the privacy reminder assertion
  and the Workshop test table. Both are fixed. The art tests do not start because
  the Vitest step fails. Log: `unit-1.txt` in the lane output folder.
- Focused M1 run at `8d176281`: exit 0. All changed unit and document tests pass.
  Fourteen files pass and three skip. There are 110 passes and 18 database skips.
  The run also includes all four changed database files. Their database cases skip
  because the M1 has no PostgreSQL. Log: `unit-targeted-1.txt`.
- `plugin-ui-http` at `8d176281`: pass on this Mac in 216.5 s. The check uses the
  required runner and a separate loopback database made from the lane test base:
  `kingdown_dbc_fault_round_2_retrodeadcode_test`. This keeps migration 0015 out
  of other lanes' shared test schema. No local unit test runs.
  Log: `checks-http-1.txt`.
- `plugin-ui` at `8d176281`: pass on the M1 in 218.2 s. The check uses the
  required runner with `KD_RUNNER=m1`. Log: `checks-ui-1.txt`.

- Final full M1 suite at `8d176281`: exit 0. Typecheck passes. Vitest reports
  182 files passed and 12 skipped. There are 3,108 passes, 161 skips, and no
  failures. All 51 art tests pass, with no skip or failure. The earlier disk fault
  and stale records do not recur. Log: `unit-2.txt`.

The original tested code stays at `8d176281`. Its final commit changes only this record.
Parts 1–6 are built. Part 7 is the written plan that the ticket requires.
No requested code part remains unbuilt.
The review run below completes the four changed files' database checks.
The new runtime grant probe is in `tools/plugin-db/migrations.db.test.ts`.
This run does not connect to production.

## Review fixes: plan and proof

1. Check both reported faults against the code and its callers.
2. Remove the startup check for an absent email helper. Keep the deletion probe.
   Test startup as the runtime role before and after migration 0015.
   Keep the migration test for removal and the release SQL checks.
3. Correct the deadline module comment. Check all readers and run its tests.
   Keep the module and its tests within this review's scope.
4. Commit the fixes. Run the full unit suite on the M1 with `m1-unit.sh`.
   Run `plugin-ui` and `plugin-ui-http` with the required runner, one at a time.
   Run the four named database files only by a path the owner's rules permit.
5. Record each finding, the test results, and the final head.

Pass criteria: startup passes on both schemas with the runtime grants. The email
helper is absent after 0015. The deletion helper still works. The deadline comment
matches its readers. All required checks pass. No production action runs.

### Findings

- Review A has no finding.
- Review B, finding 1: confirmed and fixed. The old startup condition makes
  `allowed` false while the email helper exists. The server then returns 503.
  Remove that condition and keep the deletion privilege check. The unit test
  rejects an email-helper lookup or call in the startup query. The database test
  checks startup as the runtime role before and after 0015. It also checks that
  the email helper is absent and the deletion helper works after 0015. The release
  order now says: deploy the new code, then apply 0015 at any later time.
- Review B, finding 2: confirmed and fixed. A search of `src` and `tools` finds
  no product reader of any deadline module export. Correct the module comment.
  Keep its code and tests. All 14 deadline tests pass in the full M1 suite.

### Review check results

The code commit is `d5847169`. Logs are in the lane output folder that the owner
names. Each command ends before the next check starts. Keep the checkout unchanged
from each browser check's launch until its exit. Record its result after it ends.

- Full suite with `m1-unit.sh`: exit 0. Typecheck passes. Vitest reports 182 files
  passed and 12 skipped; 3,108 tests pass and 161 skip. All 51 art tests pass.
  The three startup unit tests and all 14 deadline tests pass.
  Log: `unit-review-fix-1.txt`.
- Four changed database files: exit 0. All four files and all 19 tests pass,
  with no skip. Vitest runs on the M1, one file at a time. An SSH reverse tunnel
  connects M1 loopback port 55432 to this Mac's loopback port 55432. The base URL
  is `postgresql://kingdown_test@127.0.0.1:55432/kingdown_dbc_fault_round_2_test`.
  Each file uses its own disposable copy, as its test helper requires. The run
  holds both runner locks. The SSH connection ends and releases the tunnel.
  Log: `db-review-fix-1.txt`.
- The first `plugin-ui` command uses `KD_RUNNER=m1`. It starts no check. This
  session stops only its PID, `34810`, during a lock sleep. The next command takes
  the first free runner, as the current house rules permit. No test
  failure causes this change.
- `plugin-ui` through the required runner: exit 0 on this Mac in 203.9 s.
  Log: `checks-review-ui-2.txt`.
- First `plugin-ui-http` check: exit 1 in 213.8 s. This session changes the ticket
  during the check. The checkout guard rejects that file change. Commit the
  record, then rerun the check with no checkout change until the command ends.
  Log: `checks-review-http-1.txt`.
- Final `plugin-ui-http` check: exit 0 on this Mac at `20f7ef97` in 212.5 s.
  The checkout stays unchanged during the check. The code matches `d5847169`;
  only this record differs. Log: `checks-review-http-2.txt`.

Both confirmed findings are fixed. All required checks pass. The commits after
`d5847169` change only this record. No local unit test or production action runs.
