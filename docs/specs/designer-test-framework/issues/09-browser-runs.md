# Approve, track and collect measurement runs in the browser

Status: claimed
Type: task
Blocked by: none

## Request and approval

Owner request, 2026-10-14: “continue on this branch and connect saved measurement
plans to m1 and kaggle, so designers can approve a run, track its progress, and
bring results back into the study from the browser.”

This ticket defines that next stage. The spec and rendered sample wait for the
owner's approval before the production build. Approval of this feature does not
approve a measurement campaign. Each campaign still needs its own visible run go.

## Outcome

A designer opens a saved plan in Studies and chooses M1, Kaggle, or both. The
browser shows the exact work and machine assignment. The owner approves that
specific run. Work continues if the browser closes. On return, the designer sees
last observed progress, collection, validation and backup as separate states.
The designer reviews the returned measurements and links them to the saved study.
The whole run workflow uses browser controls after the local studio is started.

This is a local studio feature. The service runs on the owner's Mac and uses its
existing M1 and Kaggle access. It serves the study page and API on one loopback
origin. The public game gets no machine credentials or remote launch endpoint.
A phone layout works, but this stage does not open this Mac to other devices.

## Current code and required changes

The browser already prepares and verifies five recipe schedules. It also imports
balance exports without losing context, validity or source hashes. Reuse these
contracts. Do not reconstruct a schedule from form fields or tournament flags.

The current M1 recipe and `tools/kaggle-tournament.mjs` run tournaments only.
They cannot execute every saved measurement plan. The Kaggle tool also records
accepted submissions after the push; a lost reply can leave no receipt. Do not
use that path to launch saved plans or add a retry button around it.

| Part | Reuse | Change |
|---|---|---|
| Plan verification | `src/study/measurement-service.ts`, `measurement-preview.ts` | Verify the complete saved plan on the service; freeze its exact specs and jobs |
| Game execution | `src/sim/worker.ts`, `game.ts`, stamps from `run.ts` | Add one runner for the frozen assigned jobs; keep the approved total fixed |
| Machine transport | Kaggle private notebook pattern; documented M1 SSH access | Run the same frozen payload on both; write intent before dispatch |
| Reports and checks | Campaign hash/schedule checks, worth/activity/power reports, combination reports | Extract recipe checks from historical path-specific code; retain existing fixtures |
| Results and storage | Main card resolver, results-store tools, browser evidence importer | Return one checked export and a separate collection/backup receipt |
| Browser | Saved-plan panel, typed client pattern, atomic study saves | Add run approval/status/review panels; index run links in the local service |

## One local service

Use Node and the installed dependencies. Keep one API handler and one durable
run coordinator. Use that handler in the local development server and a local
studio command that serves the built app. There is no second public backend or
new cloud queue. The normal browser worker still owns study inspection.

Bind to `127.0.0.1`. Require the expected Host, exact same-origin requests, JSON
content type and a per-session request token. Do not enable wildcard CORS. Serve
no state-changing GET route. Give API and status responses no-store headers and
exclude them from service-worker caching. The studio uses a stable local origin
so its saved library survives restart. An existing development tab can use the
same handler at its current origin. A library on another origin can use the
existing export/import controls; do not silently copy browser storage.

Browser input is a validated study, prepared run ID, target choice or selected
measurement IDs. It never supplies shell commands, file paths, SSH hosts,
notebook names, cloud folders or executable code. Credentials remain in the
existing local secret files. They never enter a plan, page, log or export.

Use bounded child processes with argument arrays. Generate internal run IDs and
paths. Bound request, archive, output and log sizes. Reject traversal, symlinks
outside the frozen source, unknown fields and output for a different run.

The service is optional for ordinary studies. If absent, the run panel explains
that the local studio is unavailable. Saved plans and manual result import keep
working. A service connection failure does not change a remote run to failed.

## Prepare, then approve exact work

Preparation verifies the saved plan against the current source and regenerates
its complete preview. A stale or mismatched plan cannot launch. Preserve the old
plan; require a new preview for the current study. Save-version changes alone
keep the existing content-based plan identity.

Preparation creates an immutable bundle on the configured results card:

- The originating study/test, saved version, full plan and plan fingerprint.
- Every resolved rule, custom design, evaluator setting, spec and scheduled job.
- Source archive and manifest for planner, engine, runner, report and their local
  dependencies; package lock, commit and runtime identity. No secret is archived.
- Complete pair or interaction-block assignments, machine names, worker counts,
  exact game total, time limits and bundle hash.

Use the same payload on M1 and Kaggle. Source is frozen before approval. A clean
reviewed source commit is required. The remote machine must prove the bundle
hash before play. Changing targets, assignment, source, settings or limits makes
a new bundle and needs a new approval. Browser-supplied approval fields or an
imported study file never grant permission to run.

Offer M1, Kaggle, or both. Assign complete independent units once. A color pair,
worth calibration block or four-cell block must not split across machines.
Show the exact split before approval. Use the documented eight M1 workers and
four workers per Kaggle notebook. Check current account capacity before dispatch;
never exceed the documented five-session ceiling or occupy an unavailable slot.
Do not silently move approved work to another machine.

Show games, blocks, depth, pool, seed, machine split and the eight-hour hard run
limit. Show an elapsed-time estimate only from a compatible measured context,
with its basis and range. Otherwise say “No measured time estimate”. Do not
invent a money estimate. No unapproved calibration games or extra pilot run.

The final browser action is **Approve and start N games**. Show the exact approval
sentence beside it: run name, bundle, machines, count and limits. The service
constructs that sentence from the immutable bundle and records the affirmative
action from its authenticated session with a service timestamp. Caller-supplied
quotes and timestamps are refused. It writes the owner's quote
and date to this run's row in main `docs/QUEUE.md` before dispatch. Preserve all
other rows and local edits; serialize the write and reject a changed input rather
than overwrite it. A queue-write failure prevents launch.

## Launch once and retain uncertainty

Write an approval and a per-part attempted-launch receipt atomically before any
external submission. Lock each run. The same approval request key and bundle
return the same run; reuse of a key for different work is refused. A second tab,
a double click, a lost response or a service restart cannot submit the part twice.

For M1, verify user, host name, hardware model and SSH server fingerprint from
main `docs/LOCAL-AI-MACBOOK.md` before any remote state change. Check mains power
and availability. Use a separate run folder; do not reset a shared active checkout.
For Kaggle, use unique private notebook references and the frozen payload. Save
the returned remote identity, but never depend on that reply as the only record.

Each remote assignment has a supervisor that starts before setup and workers.
Its eight-hour monotonic limit includes setup and play. On timeout it stops only
its owned process group/PIDs, flushes available output and writes a timeout
receipt. Persist a local dispatch-start deadline separately from the reported
remote start time so setup delays and uncertain submissions are also bounded.
This limit works while the local Mac sleeps. Tests use a short fake
clock and fake processes; they do not run games.

A timeout after submission means **Launch outcome unknown**. Reconcile only the
exact remote identity and bundle. Do not automatically retry or enlarge a run.
A confirmed pre-launch rejection reports its reason. A failed or uncertain run
keeps its partial files and receipts. This stage has no retry or resume control;
a later run needs a new bounded approval. Terminal failures do not hide successful
parts or cause the service to discard them.

## Progress that survives the browser

Persist run state outside browser storage. Separate launch, remote execution,
collection, validation and backup. A process exit is not proof of complete data.
The local service owns run links. Keep the current strict `kingdown-research/1`
format unchanged. Index each run by stable studio installation ID, run ID,
originating study ID/version, source, plan fingerprint and bundle hash. The
installation ID does not depend on the service's port or browser origin. On open
or reload, Studies reads this index for its study and marks old plans as prior
runs. An explicit export/import to another local origin can find the same run.
No run credentials or live counters enter a saved study.

The plan must be saved before approval. The service keeps that original document
and offers a Runs list, even if browser storage later fails or is cleared. The
owner can recover the original document through the existing validated import.
The service receipt always names the originating version. Linking measurements
later creates a new browser study version; it does not change the run origin.

The page reads cached local status. It shows last observed completed games,
assigned games, last check, next check and any uncertainty per machine. Distinguish
reported progress from validated final counts. Do not show a false live percentage
when Kaggle exposes only notebook state. “Refresh” rereads the local record; it
does not bypass the recorded worker-check time.

The service sets a bounded completion check from compatible timing evidence.
If no timing evidence exists, approval states a first status check after one hour;
this is a check time, not a completion estimate. The page says the completion time
is unknown. Active runs then use observed progress and the hard deadline for the
next check, with at least one hour between normal remote checks. Never check
before the saved time or use a rapid poll loop. Existing campaigns keep their
recorded check schedule; this feature does not replace it. The browser can close without stopping work. If
the Mac sleeps or the service stops, remote time limits still apply; restart
reconciles existing receipts and claims each due check atomically. A lease prevents
concurrent checks after restart. It never relaunches.

At or after the hard deadline, allow at most two read-only reconciliation checks,
at least 30 minutes apart. Apply the same finite budget to uncertain submissions.
Persist the attempt count and next check before contacting the worker. If still
unresolved, mark **Needs attention** and stop automatic remote checks. The record
retains the exact uncertainty; a timed-out status request cannot reset the budget.
These bounds prevent a past deadline or a restart from causing a rapid check loop.

Connection loss shows the last known state with its timestamp. It does not claim
completion or failure. Hide or disable approval while preflight or connection
state is unknown. Returning status from an older panel must not replace the
current run or study.

## Collect, validate, report and link

Collect every terminal part, including failed and partial output. Use the main
card resolver and existing project collection rules. Keep remote sources. Keep
mutable status in card state storage, outside the immutable result collection.
Do not write result files through a live backup maintenance lock. A missing card
or a live lock gives a clear waiting state and never falls back to this Mac's disk.

Validate bundle/source hashes, exact spec and job assignments, execution stamps,
IDs, armies, seeds, counts, complete blocks, endings and raw file hashes. Reject
extra, duplicate, torn or mismatched data. Replay up to 20 distributed legal games
per part (all if fewer exist), plus an illegal replay negative control. Each
recipe uses the frozen matching report code. Preserve original report metadata
when the plan preview is frozen; the current flattened jobs alone are not enough:

| Recipe | Frozen report inputs and adapter |
|---|---|
| Worth | Arm specs, complete swap/calibration blocks and GameRecords; paired worth and calibration intervals |
| Activity | Full specs/design and GameRecords; legal replay through piece activity tallies |
| Field and cross-play | Original tournament spec, entrant/matchup metadata and game specs; paired/army outcome statistics |
| Four-cell | Original ComboSpec and block IDs; ComboRecords through combination validation and report |

Extend the shared preview to retain these inputs without changing scheduled jobs.
Test every export, custom-T worth/activity and all permitted entrant sets. Do not
reuse the historical hard-coded Spirit/Shadow comparison for unrelated entrants.
Keep capped games, effective sample units and interval limits. Report new seed rounds separately; never pool unlike
contexts or adopt a rule from a result.

A complete run produces the existing balance measurement export format unchanged.
A separate service validation receipt binds its exact byte SHA-256 to the run,
plan and bundle. Do not add unrecognized fields to strict measurement rows. Partial or
invalid runs stay visibly incomplete or invalid. They retain their artifacts and
can expose diagnostic evidence, but cannot emit a complete valid balance claim.
The returned export keeps every measurement field and its exact byte hash.

The result route rejects an export over 64 MiB before sending it. The client checks
the declared size and enforces the same byte cap while reading; a missing or false
Content-Length cannot cause an unbounded download. The browser uses the current
result importer and selection limits. The 500-row selection limit does not waive
the 1 MiB study or 8 MiB library limits; show those save errors without losing the
selection. **Review
results** shows validity, uncertainty and the study/version the run measured.
**Link selected results** saves a new study version atomically. A failed save
retains the result for retry or export. The same measurement cannot link twice.
A changed study shows evidence for the original version; it never rewrites the
run's identity to fit the new version. Linking data does not adopt a rule or
prove that a design is fun.

Run the project's backup path after collection and report. Keep backup progress
separate from result readiness. Do not call results backed up until the receipt
matches the collected files and downloaded cloud bytes verify their hashes.
The existing backup tool verifies local decoded bytes and cloud checksums. Add a
separate bounded restore check for this run's required payload: download the
receipt's manifest, metadata and referenced objects; decode or extract the named
files; compare every SHA-256 and byte count. Test corrupt/missing objects, stale
receipts and mismatched manifests. This extra check does not recollect workers or
write through a live backup lock. Preserve live backup locks and all remote sources. A backup error is visible and
does not erase validated local results.

## Build plan and acceptance

1. **Bundle and execute:** one frozen schedule runner for all five recipes. Tests
   compare exact jobs, specs, rules, design and settings with current previews.
   Keep four-cell's custom-T refusal. Test source/parameter mutation controls.
2. **Coordinate and transport:** durable run store, approval and queue record,
   M1/Kaggle adapters, bounded checks and collection. Fake transports verify
   duplicate requests, crashes on both sides of dispatch, unavailable capacity,
   wrong M1 identity, missing card, live locks and service restart. Each must
   prevent a second submission or false completion.
3. **Validate and report:** preserve existing report fixtures. Test all recipes,
   all job/block counts, complete and partial parts, illegal replay controls,
   mismatched hashes, caps, interval scope and exact result-export provenance.
4. **Connect the browser:** approved run panel, status and return-to-study flow.
   Use fixture transports for a full browser test: save plan → prepare → explicit
   approval → status → collect/validate → review → link → reload. Check 1440 × 900,
   390 × 844 and 375 × 667, keyboard focus, stale replies and atomic save failure.
5. **Review and operational proof:** run `npm test`, doc checks and registered
   Studies and Workshop checks. Get independent review. No remote test campaign
   starts from this feature request. A live transport proof needs a separately
   approved named run; until that passes, label the real transport unverified.

## Sample and current evidence

The sample uses existing game fonts, colors, board and panel layout. It covers
approval, running, results ready, result selection/linking, partial failure,
connection loss, unknown launch and unavailable service. Values are illustrative;
its controls neither save nor launch games. See `sample/runs.html`.

Read-only checks confirm the reuse points and launcher gaps above. Two independent
code readers inspect planner/transport and browser/storage seams. No worker is
queried and no new game runs in this design phase. The previously authorized
confirmation campaign continues under its own runbook and check times.

Independent spec review finds and resolves these gaps before approval: frozen
report metadata for all five recipes; remote deadline enforcement; finite late
checks; explicit cloud restore proof; service-owned run links without a document
format migration; export-hash receipts outside strict measurements; and bounded
browser downloads. No production implementation is claimed by this review.

All 27 sample renders pass at 1440 × 900, 390 × 844 and 375 × 667. The sample
checks target assignments, navigation and approval-to-link flow, resource loads,
page errors, horizontal overflow and panel bounds. Desktop approval/progress and
phone results have visual checks. All 113 doc checks pass. Both spec readers clear
the corrected design. The sample and spec add no production run path.

Rendered evidence is at
`/Users/za/.codex/visualizations/2026/10/13/01a1338c-36c7-71e1-9c8a-05503302ca75/browser-run-approval-20261014`.
