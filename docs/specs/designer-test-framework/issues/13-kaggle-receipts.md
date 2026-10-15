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
