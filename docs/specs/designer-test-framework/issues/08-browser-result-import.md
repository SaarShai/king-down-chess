# Browser plans and result import

Status: resolved
Type: task

## Plan

1. Add typed worker calls for plan preview and full saved-plan checks.
2. Read one local result file in the worker. Hash its original bytes. Keep complete row metadata.
3. Return pages of at most 100 rows or runs. Select at most 500 rows. Reject stale file tokens and invalid rows.

## Checks

Use focused tests for plans, file errors, byte hashes, duplicate IDs, page bounds, retained metadata and stale selection. No game or remote request runs.

## Result

The worker exposes plan, verifyPlan, openResults, resultRuns, resultRows, selectResults and clearResults. Existing study calls keep their API. Plan checks compare all saved fields with a fresh preview from the current source.

The worker holds one local dataset. Files have a 64 MiB limit. Pages have a 100-item limit. Selections have a 500-row limit. Run and element filters use exact names. Failed file reads keep the last complete dataset. Tokens block stale selection and late file reads.

`KINGDOWN_TEST_FILE='src/study/{browser-service,measurement-service,evidence}.test.ts' npm test` passes: 15 tests in three files, type checks, and 50 art checks. Tests cover original-byte hashes, complete metadata, malformed files, duplicate IDs, page bounds, large selection, prototype names, stale tokens, overlapping file reads, clear, and altered saved-plan fields.

No game or remote request runs. Browser UI checks belong to the parent task.
