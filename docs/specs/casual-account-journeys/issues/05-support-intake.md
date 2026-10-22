# Record support reports and publish appeal steps

Type: task
Status: resolved

## Plan and scope

1. Add an operator intake method and command that reuse normal report validation, target resolution and report/action/appeal records.
2. Keep a bounded support evidence reference in the report's existing private note. Return the existing report ID. Check the moderation grant before creating a report.
3. Point statements of reasons to the public Support appeal steps. State the approved owner handling and 7-day first-response target, including manual support for a player who cannot sign in.
4. Add focused disposable-database tests for actor/target scope, evidence, report/action/appeal identity, runtime refusal and the CLI path. Wait for the main task to free the test lane.

No new report table, schema migration, email sender, notice API/view or public matching enablement. The source CLI keeps its disposable loopback guard. A checked compiled operator path or approved SQL procedure remains separate public-release work.

## Acceptance

- An operator names the verified reporter UUID separately from the reported handle, account or shared game. Ordinary report input cannot forge the reporter.
- A support case preserves its evidence reference and note through queue, action and appeal; the CLI returns the report ID.
- The runtime connection cannot use operator intake; refusal creates no report.
- The existing actions and appeal records stay authoritative. Public Support gives the real email path and reason/action references to include.
- Existing report and CLI tests, focused new cases and typecheck pass against only the disposable database.

## Operational evidence still needed

The approved policy names the owner as handler and targets a first response within 7 days. This change does not verify mailbox staffing, email delivery, manual identity checks or an owner handling rehearsal. Those facts must be recorded before public matching; no text claims they have been tested. Verify the reporter's account from the support exchange before using its UUID. Keep the evidence reference to that exchange; do not copy passwords or sign-in codes.

## Answer and evidence

Added `SafetyService.intake` and the existing moderation CLI's `intake` command. Intake requires the moderation connection, reuses the normal actor and target rules, and stores the support evidence reference in the existing private report note. Action and appeal records retain that report ID. Statements of reasons now point to the public Support appeal steps, including support without sign-in.

Focused verification: `PLUGIN_TEST_DATABASE_URL` named the passwordless disposable loopback database, and `KINGDOWN_TEST_FILE='{src/online/accounts.db,tools/plugin-db-config}.test.ts' npm test` passed 2 files / 40 tests, full typecheck and 54 art checks. No tests were skipped. The checks include support intake through the actual source CLI, report/action/appeal identity, reporter and target scope, evidence validation, runtime-role refusal and the existing live-database guard. Log: `/tmp/kingdown-u07-support-intake.log`.

No browser check, build, deployment, email delivery or live database write was run for this slice. Public matching remains off; the operational evidence and compiled operator path above remain release gates.
