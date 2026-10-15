# Recover Kaggle notebook receipts

Status: claimed
Type: task
Blocked by: none

## Request and plan

The owner requests receipt handling that lets the browser complete a run and
link verified results without manual recovery. An uncertain launch must never
be retried. The owner also requests productive M1 work.

1. Save an exclusive notebook attempt before submission. Save safe response
   facts, including rejection or uncertainty. Accept only an exact identity.
2. At the existing scheduled check, bind remote metadata and source to that
   attempt. Preserve the original response. Never submit from a status check.
3. Test lost responses, conflicting identities, repeated calls and restart.
   Check the browser result path, validation and backup gates.
4. Run a bounded baseline test and build on M1 while the repair is built.
   Record dispatch, collect terminal hashes and preserve remote sources.

## Checks and boundaries

Use offline API fixtures for response variants and negative controls. Run the
focused transport and coordinator tests, type checks, browser and doc checks.
No new games, dataset mutations, deployment or change to the completed live
proof. Its original uncertain records and verified browser link stay intact.

## Implementation and evidence

The driver saves the exact source hash, notebook identity and expected first
version before one submission. It stores safe response facts or an unknown
response record. A successful URL-only response can supply identity when the
SDK omits ref. Conflicting identity, errors and invalid sources cannot produce
an accepted receipt. The SDK mutation retry wrapper is disabled.

The scheduled status and collection calls now receive the saved attempt folder.
They require the exact private notebook, version and source hash. A later
read-only observation stays separate from the original response. Missing proof
stays unknown. The coordinator can use this observation after a restart without
another approval or submission. Old runs without an attempt record fail closed.

The focused suite passes 18 tests and 50 artwork checks. The browser check passes
at all three existing viewport sizes. It starts with an unknown launch, confirms
no second approval or early result link, then links the checked result through
the normal study controls. Browser evidence: `designer-test-framework-RxS8jn`
in the local check output folder. Fixtures use no remote mutation. The installed
SDK types and its pull implementation confirm the response and source fields.

The earlier live proof remains complete in issue 10. This repair has no new live
Kaggle submission. The exact cause of its lost response remains unproved.

M1 baseline work uses a separate checkout of 29c681a3, its own installation and
a one-hour limit. Dispatch and terminal evidence use the card results folder
`receipt-baseline-m1-20261015`. No simulation games are added.

## M1 handoff

The baseline starts once at 19:35:34 UTC with PID 47321. Its first check is at
20:00:34 UTC. The patched revision 434deb48 is queued next, with an exclusive
checkout and a one-hour test and build limit. Its thin bundle and checksum are
in card state `study-runs/receipt-validation-20261015`. The scheduled follow-up
collects both jobs, checks hashes, verifies the cloud backup and closes this
ticket. It does not query Kaggle or start games.

Final local checks pass: 18 focused tests, 50 artwork checks, 113 document
checks, production build and the Studies browser check. The ticket stays
claimed until the M1 evidence and backup are complete.

## Validation checkpoint

The baseline fails before tests: the copied supervisor retains an old root.
Clone exits 128 because that old checkout exists. It overwrites only the old
status, clone log and hash list; earlier collected and verified cloud copies
remain intact. New failure files are kept separately and status/clone hashes
match. Old mixed logs are not current validation evidence.

The patched job starts once at 20:05:41 UTC, PID 1853, with its own root derived
from the supervisor file. Its first check is 20:25:41 UTC, with a one-hour bound.
The stale lock has an exact known owner and no live supervisor before transfer.
The main machine guide now records the root check. No baseline retry occurs.

## Passed validation and browser approval

The patched M1 run passes at 434deb48: 2,396 tests, 129 skipped, 50 artwork
checks and the production build. All eight terminal file hashes match.
Evidence is in card results `receipt-patch-m1-20261015/terminal` and
`collection.json`. Remote sources stay in place. No further M1 query is needed.
Backup waits for the live browser proof to avoid a competing maintenance lock.
