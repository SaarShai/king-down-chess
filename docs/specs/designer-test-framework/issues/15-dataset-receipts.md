# Confirm dataset receipts without repeat creation

Status: claimed
Type: task
Blocked by: none

## Request and plan

Owner 2026-10-15: "fix the dataset receipt handling, then finish the live browser test through verification, backup and linking results if safe. don't retry an uncertain launch."

1. Reproduce receipt identity variants with offline transport fixtures. Inspect
   the SDK contract. Keep unknown responses and never repeat creation.
2. Bind a dataset to its exact private identity, version and frozen bytes
   before any safe continuation. Check whether a notebook attempt exists.
3. Repair the shared receipt path and test accepted, conflicting and lost
   responses. Preserve diagnostics without raw service bodies or secrets.
4. Continue only the original two games if no uncertain notebook submission
   exists. Verify results, cloud bytes and saved browser links. If proof is
   missing, retain the blocker and do not submit.

## Verification

Transport regression tests, type checks and document checks must pass. Live
success requires two scheduled games, two legal replays, one illegal control,
exact source/plan/bundle hashes, a downloaded-byte backup proof and a saved,
reloaded study link. No new dataset or extra game is authorized by this plan.

## Diagnosis and repair

The old response ref was not retained. Its exact format remains unknown.
The installed SDK CLI uses status and URL for creation. The old adapter also
requires ref to be a slug, then has no read-only dataset proof path. An offline
numeric-ID fixture reproduces `dataset creation not confirmed` before the fix;
it is not evidence that the lost live value was numeric.

The repair accepts a numeric ref only when it equals the ID read from the exact
private dataset. It checks version 1 before and after downloading all four
version-pinned files and matching their hashes and byte counts. Different slugs,
IDs, privacy, versions and payload bytes fail. Safe response identity fields and
a hash are retained; raw service errors are not stored.

A separate browser continuation action uses the existing approved bundle. It
never creates or uploads a dataset. It saves an exclusive continuation marker,
requires no notebook attempt, verifies the dataset and runs the account audit
before the first notebook submission. Repeated calls and uncertain notebook
attempts fail closed. The original deadline stays in force; the notebook gets
at most 25 minutes and no more than the time remaining. Checks wait one hour
after dispatch finishes, including time spent in the audit.

## Live read-only proof

Card results `study-runs/study-20261015-32dd60188ebc/dataset-receipt-repair`
retain the new evidence. Dataset 12616509 is private, READY, version 1. All four
downloaded files match the frozen local inputs, with no dataset mutation.
The signed-in browser initially finds no exact notebook, and the API returns
403. The browser creates one empty draft with the exact run name. The API then
confirms notebook 138958863, version 0. No cell runs or batch submission occur.
The original dataset response and blocked run evidence remain unchanged.

Type checks and 113 document checks pass. The focused transport/coordinator
suite and Studies browser check must pass before live continuation.

## Checkpoint before live continuation

The Studies browser check passes at all three viewports, including the new
one-time continuation control and normal result linking. Output:
`designer-test-framework-8VnQxO` in the browser check folder. Type checks and
113 document checks pass. The earlier transport-only check passes six tests
and 50 artwork checks. The current transport/coordinator suite waits for the
shared test lock; it must pass before continuation. Its log is
`/tmp/kd-dataset-checks.log` and exit file is `/tmp/kd-dataset-checks.exit`.

The lock belongs to a separate pre-push on `submission-fixes`. Its fixture
commit waits in `git cat-file --batch-check`. The owner is asked whether that
separate stalled pre-push may be stopped. No such process is stopped without
an answer. Current repair files stay uncommitted while this gate is pending.
The live browser still shows the original run and its continuation button.
No continuation click or notebook submission occurs in this checkpoint.
The original deadline is 2026-10-16 04:33:20 UTC. The continuation control
refuses less than 30 minutes remaining; the driver refuses less than 10.
Next bounded local check: 2026-10-16 03:50 UTC.

## Checks passed

The shared test lock clears without intervention. The focused suite passes
20 transport and coordinator tests and 50 artwork checks. The Studies browser
check passes at three viewports. Type checks pass. The original deadline and
one-time submission guards remain in force.

## Browser continuation

Repair commit `c10741e3` passes 20 focused tests, 50 artwork checks,
113 document checks, type checks and the three-viewport browser check.
The browser continuation is clicked once at 2026-10-16 03:53:33 UTC.
The saved run records `datasetContinuation` and shows launching. No accepted
notebook receipt is claimed. The control disappears. The original deadline
stays 04:33:20 UTC. The next local launch check is 04:14 UTC. Worker checks
wait for the saved next-check time after dispatch. No upload is repeated.
Screenshot: `/Users/za/.codex/visualizations/dataset-receipt-continuation-20261015.png`.

## Bounded launch observation

At 04:14 UTC, the saved state shows one notebook attempt at 04:00:50 UTC.
The dataset proof passes for the exact private version and all four frozen
files. The response has the exact URL, notebook ID 138958863 and version 1,
with no error or invalid sources, but its ref does not match. Acceptance
remains unknown. The attempt and response files remain intact. No retry occurs.
The studio records its first worker check at 05:00:51 UTC. The next bounded
check is 05:01 UTC. The compute deadline stays 04:33:20 UTC; later observation
does not extend worker time. Validation, backup and linking remain pending.

## Automatic collection

The scheduled studio check at 05:01:36 UTC confirms notebook 138958863,
version 1, complete, with the exact submitted source hash. The studio collects
all five terminal files and the notebook log. It then starts validation.
The unknown submission response remains preserved; no submission is repeated.
The next bounded local validation and backup check is 05:35 UTC.

## Local validation failure

At 05:35 UTC, the studio reports validation interrupted or failed. No backup
starts. An isolated reproduction fails during runtime setup with
`CERTIFICATE_VERIFY_FAILED`. The system Python verifies the same Node HTTPS
endpoint with certificate checks enabled. A second isolated check uses
`/usr/bin/python3`; it reads the original archive and collected files and writes
only to `work/study-runs/receipt-validation-system-python`. Its PID is 96787;
log `/tmp/kd-validation-system-python.log`. The original failed reproduction
stays in `work/study-runs/receipt-validation-diagnosis`. No game or submission
is repeated, and no live run state is changed. Next local check: 05:55 UTC.
