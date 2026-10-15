# Build interaction discovery

Status: resolved
Type: task
Blocked by: none

## Request

The owner approves the discovery spec and rendered sample: “approved. build pair
proposals, coverage gaps, and replay-to-regression saving on this branch.”

## Plan and checks

1. Add a finite pair catalog and deterministic proposals. Preserve unsupported
   cells, exclusions and the complete denominator. Check budgets and stable IDs.
2. Add source-bound coverage and three authored scenario adapters. Keep draft
   expectations separate from reviewed checks. Test positive and negative cases.
3. Scan selected local replays with action and game limits. Keep full history,
   source and file hashes. Save reviewed expectations and an ordinary test in
   one atomic discovery record. Check invalid input, failed checks, repeat saves,
   storage failure, export and import.
4. Connect the approved browser flow to these modules. Check the rendered flow,
   cancellation, reload and the existing Studies flow. Run focused tests, type
   checks, document checks and the Studies browser check. Commit this scope only.

## Boundaries

No game rule changes, new runs, worker queries or deployment. The live proof
keeps its own ticket and schedule. Triples and reply search remain later work.

## Implementation

The saved study has an Explore interactions entry. The planner lists pairs,
orders and ownership cells. Scope and budget limits are explicit. Unsupported
cells remain in the total; a filter does not change the total. The first three
adapters cover Rook paths, Haste extra actions and Frost Freeze expiry. A custom
piece adapter currently requires the authored Rook design. Other custom designs
and changed rules show an adapter gap. A proposal uses a constructed fixture
with its full rules shown before review. It does not assert reachability.

Coverage executes reviewed checks under the current source. A failure takes
priority. Source and study changes make prior evidence stale. A check at an
unrelated boundary cannot fill a cell. Opening a scenario saves a draft; saving
reviewed expectations publishes an ordinary test and provenance in one local
storage write. A failed write publishes neither. Imports require the exact
parent version and validate the scope, references and content hashes.

The replay view scans a saved study or an explicitly selected validated local
run. A read-only service route checks the frozen bundle, part attestations,
raw hashes, schedule and stamps. The browser worker then checks every selected
move. It retains complete history, actual actors, run/part/game/pair identity,
settings and cap/terminal labels. Scan manifests record input hashes and limits.
Cancellation terminates the scan worker. No scan dispatches a run.

The review shows the real board at a chosen action boundary. Designers select
facts, edit expected values, give a basis and explicitly confirm. An intended
result can save a failing regression. Export/import retains the test and its
provenance. The normal study library opens and runs the saved case. Original
raw files are not in the export and import does not reverify them.

## Verification

The first browser pass checks desktop and two phone sizes. It saves an
intentional failing case, checks the unchanged denominator, filters failures,
exports/imports, reopens the test and scans its Haste sequence. The quota
control preserves the exact prior storage bytes. Existing study, measurement
and run controls pass in the same check. No remote service is dispatched.

A focused suite passes 88 tests in 13 files, plus the 50 artwork checks run by
`npm test`. Document checks pass 113 assertions. Final checks cover the added
scan cancellation control and the final source changes before commit.

## Limits

There are three authored adapter families. Other cells show unsupported and
need an authored adapter; shared state alone is not proof. Run scanning selects
whole local runs up to 200 games and 20,000 actions. Larger-run selection,
triples, reply search, causal attribution and human fun judgments remain outside
this slice. This work does not adopt a rule or launch games. The separate live
proof remains failed in preparation with a Kaggle HTTP 404 and no approval.

## Final evidence

The final focused run passes 24 tests in three files, including cancellation,
exact-parent imports, unrelated-check rejection and the local replay export.
The browser check passes at 1440 × 900, 390 × 844 and 375 × 667. It also checks
that adding a fact preserves edited expectations and unchecked facts.

Browser log: `/tmp/discovery-final-proof.log`. The full browser evidence is in
`/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/designer-test-framework-ZDVKHS/`.
An earlier check is invalid because source files changed during the check; the
final pass runs against stable source. Type checks and `git diff --check` pass.

A manual browser check reopens the saved case and shows 22 obligations:
19 unsupported, one deliberately failed negative control and two missing.
This is verification data, not a proposed game-rule change. The original live
study and its versions remain in the library. No subagents are used.
