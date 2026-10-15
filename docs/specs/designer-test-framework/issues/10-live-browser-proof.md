# Live browser run proof

Status: claimed
Type: task
Blocked by: none

## Owner go

Owner, 2026-10-14: “continue on this branch and do a small live end-to-end test on
m1 and kaggle, using the browser to approve the run, track progress, and link
the verified results back into the study.”

This approves one small workflow proof. It does not approve a balance campaign,
rule change or repeated launch after an uncertain reply.

## Plan and checks

1. Save a separate Rook control study in the browser. Prepare a piece-activity
   plan: four color pairs, eight games, depth 1, 80-ply cap, seed 214314 and the
   custom Rook-only pool. Split whole pairs equally between M1 and Kaggle.
2. Use the live browser to prepare and approve that exact work. Record its ID,
   immutable bundle, source and originating study/version. The service writes
   its main queue row before dispatch. Each part starts once.
3. Track stored browser progress and respect the recorded worker-check times.
   With no matching measured time estimate, the first check is one hour after
   dispatch. Keep the existing eight-hour hard limit. Never query early or
   enlarge the run.
4. Collect both parts, verify all eight scheduled games, replay all games and
   pass an illegal-action control per part. Preserve partial failures and raw
   sources. Check the result hash, source, plan and original study binding.
5. Review results in the browser, link selected activity measurements, reload,
   and confirm the new study version retains the evidence. Verify the separate
   downloaded-byte backup receipt. Keep small-sample and cap limits explicit.

## Preparation repair

The M1 availability command contains its own unescaped process patterns. The
earlier test checks a separate safe pattern, so it misses this fault. The command
now uses bracketed initial letters. The test extracts the actual command's
pattern, rejects self-matching and confirms that real worker and busy-app
commands still match. No machine is changed by this repair.

The first browser preparation freezes `study-20261015-3187d94a2d12` but fails
before approval. Its key is null, its queue flag is false and it has no launch
receipts. M1 passes all four identity facts, AC power and availability. The
Kaggle script is named `kaggle.py`, so Python imports that file instead of the
installed SDK package. Rename it to `kaggle-driver.py`. A test now runs the real
script entry point against a fake SDK package; it makes no network call. Keep
the failed preparation record. No launch retry or extra games occur.

The second preparation, `study-20261015-ab76cd7e1b63`, also stops before
approval. A direct read-only probe reproduces HTTP 429 at account status read
12. The same reference returns COMPLETE alone. The list contains at least 100
notebooks. The audit now spaces its reads by two seconds and handles HTTP 429
with at most two waits per read. It honors numeric Retry-After values up to 120
seconds, with a 60-second minimum and a 15-minute total audit limit. Other
errors fail closed. The transport allows that bounded audit to finish. This
retry applies only to audit reads; submission is still attempted once. An
offline rate-limit fixture fails before the fix and passes after it.

## Live checkpoint

The browser starts the paced preparation at 2026-10-15 03:54 UTC. No approval
or launch exists at this checkpoint. The main queue holds the owner's exact go
for this named run, with browser approval pending.

- Run: `study-20261015-01dfffbcc6f5`.
- Study: `77e3d7e0-e42b-4aef-b0c6-085f1dc1460a`, version 2.
- Source: `a04ecaa4b16f8b23447d4096354be16c16df2296`.
- Bundle: `6eac04d4d5c3a4ecbd0c2f7939f02635a0c12534538c920c47302f68317ee7e4`.
- Plan: `7f4de04358c28f976dda6cc7a66a75210d67502fc80f7e3f7ac9937708249009`.
- Local state: `state/study-runs/study-20261015-01dfffbcc6f5.json` on the card.
- Browser: `http://127.0.0.1:57321/`, saved study's Run saved plan panel.
- Checks: typecheck, five transport tests and 50 art tests pass. The earlier
  documentation check passes all 113 assertions. The rate-limit regression
  fails before the repair and passes after it. No remote launch is retried.

Next: read the bounded preparation result. If prepared, approve these eight
games once through the browser. Then use each recorded next-check time. Finish
collection, validation, backup and browser linking before marking this task done.

The third preparation fails before approval. Its key remains null and no launch
receipt exists. The owner asks again to finish the same live proof. A bounded
read-only audit trace now records status counts and HTTP codes. It starts at
about 2026-10-15 04:06 UTC, with a 17-minute hard limit. Its logs are
`/tmp/kingdown-kaggle-audit-trace.log` and
`/tmp/kingdown-kaggle-audit-trace-result.log`. Do not run a second trace while it
is active. The follow-up is set to 21:24 Pacific.

The adapter now returns known local failure names or an HTTP status code to the
browser. It never returns a raw service body. An entry-point test supplies a
secret-bearing HTTP error and confirms that only HTTP 403 reaches stdout.
Typecheck, five transport tests and 50 art tests pass. This change improves the
failure evidence; it does not make a failed preparation ready for approval.

During preparation, the panel kept the previous failed run on screen. It now
clears that selection and shows a preparation message in its status text. This
changes no approval or dispatch rule. `npm run check:browser studies` passes
with output in `/tmp/kingdown-live-proof-browser.log`.

The trace stops at status call 262 with an empty notebook reference. This is
not a rate-limit failure. Page 3 includes empty placeholder entries with ID 0,
empty reference/author/slug and version 0. Page 4 still has real notebooks:
91 entries, four empty placeholders. The audit skips only that exact empty
identity and continues pagination from the original page length. A nonzero ID
with a missing reference still fails closed. The regression includes a full
page of placeholders followed by a real next-page item. It fails before the
repair and passes after it. Typecheck, five transport tests and 50 art tests
pass. No approval or launch exists for the failed preparations.

The corrected browser preparation starts at 2026-10-15 04:19:24 UTC:
`study-20261015-133d971aa3e7`, source
`6dc87838af63e2971574831719f96738ce6eacdc`, bundle
`25e314f88b61d872def5d6e3c48b89600f5da082637494189039491abea2c15c`.
It uses the same saved study, plan and eight-game limit. The main queue holds
the owner's renewed instruction to approve and finish this test. The browser
shows preparation in progress; no approval or dispatch occurs yet. The next
bounded preparation check is 21:37 Pacific. Preserve all prior failed records.
No subagents are used for this live proof.

## Renewed preparation repair

The owner asks to fix Kaggle preparation and finish the same eight-game browser
proof. The fourth preparation has HTTP 404, no approval and no remote receipts.
A read-only probe lists 391 account entries. A bounded status probe examines
entries after the earlier verified prefix. It records only state, reference and
HTTP code in `/tmp/kingdown-kaggle-status-404.log`; it prints no service body or
credential. No run starts during diagnosis. The repair must retain a conservative
capacity check, pass an offline negative control, and commit before a fresh
browser preparation freezes the source. Keep the same study, plan and game limit.

The probe finds ten status-404 entries. Full notebook reads identify all ten
as saved drafts with version zero. A completed control has version 8 and a
valid status. The account list omits version fields even for that control, so
its zero value cannot prove that a notebook is a draft. The adapter now reads
full notebook metadata only after status 404. It requires a positive notebook
ID, the same reference and version zero before it excludes that draft from
batch capacity. Missing metadata, a different reference, a published version
or another HTTP failure still stops the audit. Kaggle's notebook guide states
that a saved batch version runs in a separate session from the draft editor:
<https://www.kaggle.com/docs/notebooks>.

The offline draft regression fails before this repair and passes after it.
Typecheck, five transport tests and the 50 art checks pass. Controls reject
missing metadata, zero IDs, changed references, published notebooks with no
status, a second 404 and HTTP 500. The actual bounded browser preparation is
next; it makes no game launch until approval. No prior preparation has a launch
receipt. Evidence logs: `/tmp/kd-draft-red.log`, `/tmp/kd-draft-green.log` and
`/tmp/kd-kaggle-resolve-rest.log`.

## Approved run and first collection

Preparation passes for `study-20261015-32c624f2d6ae`. The browser records one
approval at 2026-10-15 05:22:18 UTC. Source is
`d6eafe9db2c3a698f50a89adfa5d9cbfb7443793`; bundle is
`ae1a54e84406fc6096b6d5ccf033b5bd18f0654388d18b858d6caa53aafcf586`.
The study and eight-game plan above stay the same.

M1 accepts its part at 05:36:38 UTC. The first scheduled check at 06:37 UTC
finds four complete games. Collection retains games, status, attestation,
supervisor receipt and log under `parts/part-m1`. The supervisor records
15.432 seconds. Remote sources remain in place.

Kaggle launch returns HTTP 400 and has no accepted receipt. Its state is
unknown, not failed or complete. The first scheduled status check cannot read
a remote state. The next bounded check is 2026-10-15 07:07:03 UTC. Never repeat
the launch. No Kaggle results exist in the local collection at this check.

A separate frozen-source report checks the four collected M1 games as partial
evidence. The detached script is `/tmp/kd-verify-m1-partial.py`, PID 79274,
with a 20-minute limit and log `/tmp/kd-verify-m1-partial.log`. It checks the
archive hash and exact runtime, installs the frozen dependencies, and invokes
only the report path. It launches no games. Its output belongs in
`partial-m1-validation`; do not present it as an eight-game pass. Validation,
backup and browser linking for the full proof remain open.

The partial report finishes with `state: failed`, four collected games, zero
legal replays and zero illegal controls. It stops at game 0, ply 12: the frozen
replay reader parses `Ta1-a2` as an invalid move. The result is not verified
measurement evidence. `partial-m1-validation/report-reply.json` preserves the
failure. Do not link it as valid evidence or change the frozen report to pass.
The source archive and all remote files remain unchanged. A later repair must
cover custom-piece notation and retain an illegal-action negative control.

## Replay repair and launch diagnosis

The owner asks to repair replay validation, diagnose Kaggle and finish without
an uncertain launch retry. The shared `parseLan` reader omits the custom-piece
letter from its fixed list. Use the engine's piece letters instead. Add quiet
move and capture round-trip tests. The new test fails on the old reader and
passes after the change. Recheck the stored M1 games with a separately recorded
corrected verifier; retain the original frozen report failure and source.
Check all source differences before that report and record verifier provenance.
Do not describe a partial schedule as complete or launch missing games again
while Kaggle's state is uncertain.

The submitted Kaggle script is 2,640,994 bytes. Its embedded archive is
1,851,007 compressed bytes before base64. A first-hand Kaggle report associates
HTTP 400 with a source limit below one megabyte:
<https://www.kaggle.com/product-feedback/236663>.
This is a likely cause, not a recovered server error body. The adapter retained
only HTTP 400. No submission is repeated to obtain its response. The scheduled
read-only status checks and preserved payload remain the evidence boundary.

Repair commit `6ce3b2eb` passes eight tuner/replay tests, typecheck, 50 art
checks and the doc checks. The corrected verifier first validates the original
bundle against its untouched extracted source. It then proves that the only
changed source files are `src/sim/tune.ts` and its test, and that the runtime
change is exactly the piece-prefix repair. It records both commits and file
hashes in `corrected-m1-validation/verifier-provenance.json`.

All four collected games pass legal replay. One illegal-action control passes.
All four games reach the 80-ply cap. The report stays incomplete (4 of 8 games)
and exports a missing score with no interval, not activity or balance claims.
The export SHA-256 is
`76bca0a3461675a5030c8032c9d4a7d668cbb65373814dde2180798d2ba14084`.
No remote files or frozen source files change, and no games run again.

A partial-evidence backup starts with PID 84274. Its log is
`/tmp/kd-partial-backup.log`; receipt and downloaded-byte proof belong under
`state/study-backups/study-20261015-32c624f2d6ae-partial-m1` on the card.
It covers the collected files, both reports and verifier provenance. Preserve
its live lock and inspect this attempt before any further backup. The browser
previews the one incomplete result row in the original saved study. Linking
and persistence checks remain open until the backup proof completes.

## Partial proof saved; full test blocked

The partial backup passes at 2026-10-15 07:18:07 UTC. Snapshot:
`drive:King Down/results-backups/20261015-000727-390625000`.
The downloaded-byte proof covers 34 required files and 4,734,200 bytes. Its
saved receipt matches `verified-final.json`. A final local check confirms that
all 34 files still match the exact SHA-256 and byte counts in that proof.
The backup releases its maintenance lock. No duplicate upload occurs.

Kaggle's second and final status attempt occurs at 07:16:53 UTC, after the
backup releases the lock. It still cannot read a remote state. The local record
retains two bounded checks and no accepted launch receipt. No Kaggle games
are collected or verified. The launch is never retried. The full eight-game
proof remains blocked; this ticket is not resolved.

The browser links the corrected report's one incomplete evidence row into the
original study and saves version 3. After a full page reload, reopening that
saved version shows one linked measurement: missing score, no interval, four
games, incomplete. This does not claim a complete run or useful balance values.
The four games all hit the ply cap. The UI retains the original source context.
Screenshot: `live-partial-linked.png` in this chat's visualization folder.

The owner is told that M1 replay, evidence backup and partial browser linking
finish, but Kaggle blocks the full proof. The follow-up is removed after this
checkpoint. No additional games, adoption, deploy or merge occurs.

## Payload repair plan

The owner asks to remove the Kaggle source-size failure and determine whether
the prior launch was rejected, without retrying an uncertain launch. Keep the
old run immutable. Check the exact notebook with an authenticated known-present
control. A missing or forbidden read alone does not prove rejection.

Move the frozen archive and bundle into a private, run-specific Kaggle dataset.
The notebook carries only a small loader and exact hashes. Check loader size
before account calls and before submission. Create the dataset and submit the
notebook once; preserve uncertain outcomes. Test large payloads, corrupted
mounted bytes, unsafe paths, private metadata and no submission retry. Preserve
the original archive, source manifest and supervisor checks. Launch no work
unless the previous submission is conclusively resolved within the owner's go.

The repaired transport keeps the full frozen archive and bundle in a private,
run-specific dataset. Binary filenames avoid archive extensions in the uploaded input.
A small loader verifies all four file sizes and SHA-256 hashes before it stages
or imports the supervisor. It rejects missing or ambiguous mounts and paths
outside the input root. Existing supervisor and source-manifest checks remain.
The dataset retains original-author copyright. It is never public or versioned
by this adapter. Dataset creation disables the SDK's default mutation retry;
notebook submission also remains a single call. A bounded readiness check
requires dataset version 1. Both preflight and the submission path enforce the
notebook source-size limit before account or mutation calls.

Offline checks cover a two-megabyte source payload, unchanged binary files,
private metadata, exact hashes, corrupted bytes, path escape, wrong dataset
version, uncertain dataset creation, uncertain notebook submission and source
size rejection before the account audit. No dataset or notebook is created by
these checks. The production dataset upload remains untested because the
previous submission has not been conclusively resolved.

A new authenticated read of the exact old notebook returns HTTP 403. A known
notebook owned by the same account reads successfully with version 8. An
account search for the exact old notebook name returns one private-notebook
placeholder with no reference or ID, not an identifiable run. This does not
prove rejection or acceptance. Evidence is in `/tmp/kd-earlier-launch-read.log`
and `/tmp/kd-earlier-launch-list.py`. No old or replacement launch is sent.
The owner is told that the payload repair can be verified offline, but the full
live test remains blocked by the unresolved prior submission. Saved study
version 3 still retains the backed-up, explicitly incomplete M1 evidence.

SDK and metadata contracts checked against the installed SDK and
<https://github.com/Kaggle/kaggle-cli/blob/main/docs/datasets_metadata.md>.

The browser also opens the exact notebook URL and shows “We can't find that
page.” A browser missing-page result does not resolve private access or prove
that a submission never ran. The read-only findings are saved in
`state/study-runs/launch-investigation-32c624f2d6ae.json` on the card.
Six transport tests (including the Python negative controls), typecheck, 50
art checks and doc checks pass. No new campaign or replacement run is approved
or sent by this repair. The full proof stays blocked.

## Signed-in browser recovery

The owner asks to check Kaggle in the browser and finish the live test if safe,
without retrying an uncertain launch. The owner supplies a signed-in Chrome
tab. The account is Saar shai. The exact notebook opens as a draft. The
private work list also marks it as draft. Show Versions reports zero and an
empty Version History with “Starting Fresh”. No committed batch version exists.
This resolves the earlier HTTP 400 as a failed batch submission that left a
draft, rather than an accepted batch run. The browser editor itself stays in
Loading; no session start or Run control is used.

Recovery plan: preserve the old state and payload. Use the repaired transport
once for only the original Kaggle part, with the exact frozen archive, bundle
and job indexes 2, 3, 6 and 7. Keep the original hard deadline. Record attempt
and receipt separately. Stop on any uncertain outcome. Do not run M1 again.
After the bounded check, collect terminal files, apply the corrected replay
verifier to all eight games, verify cloud backup bytes, then link the full
result through the browser and confirm it after reload. The existing partial
link remains until a full verified export is ready.

Browser evidence: `kaggle-draft-zero-versions.png` in the task visualization
folder. No new rule or balance conclusion follows from this workflow proof.

The one-shot recovery wrapper starts detached at 08:29:19 UTC. Its PID is
5425 and its log is `/tmp/kd-kaggle-recover.log`. It verifies the frozen archive,
bundle, exact four jobs and unchanged supervisor before preflight. Its state
is `recovery-kaggle/recovery-state.json` under the original result folder.
The original studio record stays unchanged. The wrapper creates its attempt
folder exclusively and records an attempted launch before any submission.
Its time budget reserves 30 minutes for dispatch within the original deadline
13:36:38 UTC. The first worker check is one hour after an accepted receipt.
A stopped shell wrapper created no attempt folder and sent no request; the
separate detached process above is the first recovery preflight.

## Recovery local rejection

At the 09:16 UTC local check, the recovery has no accepted receipt. Its error
is `Kaggle launch: invalid dataset payload`. The saved wrapper state says
unknown because it groups all launch-method errors together. Inspection of
the exact error branch establishes a local rejection before any upload or
notebook submission. The four required payload files each have an AppleDouble
`._` sidecar on the card. The driver rejects that file set before it writes
dataset metadata or calls dataset creation. Neither dataset metadata nor a
dataset receipt exists. The notebook source is 2,115 bytes.

Evidence is saved in `recovery-kaggle/local-rejection-evidence.json`. All old
files and states remain. No worker query, upload, submission or retry occurs
in this check. The full proof remains blocked by card metadata handling in
the dataset transport. A repair must stage only the four declared files for
upload and test AppleDouble sidecars without admitting other unexpected files.
The verified partial backup and browser study version 3 still hold the four
M1 games as incomplete. The recovery follow-up is removed because this is a
confirmed local blocker, not a running job. No full-result link is claimed.

## Metadata repair and idle-machine work

The owner asks on 2026-10-15: “what's next? in the meantime - give m1 and
kaggle productive work to do, if they are idle”. M1 identity matches all four
facts, uses mains power, and has no listed run, test, art or model process or
active study lock. Plan: fix the common Kaggle upload boundary, run the
transport regression and negative controls, then send the frozen branch to
M1 for its test suite. Use Kaggle only for the four original missing jobs
after its bounded account audit confirms capacity. Keep prior failed attempts.
Require exact payload bytes, exclude only matching AppleDouble sidecars from
the SDK upload enumeration, reject unknown files and symlinks, and make no
second submission on an uncertain outcome. Keep original execution source and
schedule. Check worker completion only at its recorded expected time.

The metadata repair checks the payload before the account audit. Only the
four required file names and their exact sidecar names are accepted. The SDK
upload callback excludes those sidecars; unknown names, directories and
symlinks fail. The SDK method and no-retry wrapper are restored after success
or failure. Six transport tests, typecheck, 50 art checks and doc checks pass.
The source archive, game bundle and supervisor do not change.

Repair commit `0215cca3` starts productive work after the idle checks. M1 runs
`npm test` and `npm run build` in its own checkout at that commit, using the
existing Node 26 runtime and its own dependency install. Source transfer uses a
verified Git bundle. PID 11243 has a one-hour limit and releases only its own
study lock. First bounded check: 11:10 UTC. Its local dispatch record is in
`results/framework-check-m1-20261015/dispatch.json`; remote output is under
`/Users/new/projects/kd-framework-check-20261015/sim/out`. No extra simulation
games are assigned to M1.

Kaggle recovery attempt 2 starts at 10:47:10 UTC with local supervisor 27979.
Its launch audit checks account capacity before upload. State is preserved in
`recovery-kaggle-2/recovery-state.json`; log `/tmp/kd-kaggle-recover-2.log`.
No accepted receipt exists at 10:48:38 UTC. The loader and original four jobs
are unchanged. The original deadline remains 13:36:38 UTC. The wrapper reserves
30 minutes for dispatch and records the first worker check one hour after
acceptance. No worker status query occurs before that check. Any uncertain
outcome stops further submissions. A bounded follow-up covers both jobs.

## First machine validation result

M1 completes its test command with 2,394 tests passed, 129 skipped and one
failed. Build does not start after the test failure. Six collected terminal
files match the remote SHA-256 manifest. The failed test assumes the checkout
name contains `king down chess`; M1 uses an isolated path with another name.
Repair the test with a temporary Git main checkout and linked worktree under
arbitrary names, then repeat the test suite and build on M1. This changes no
production rule or run source. Preserve the failed logs.

Kaggle recovery 2 ends with `dataset creation not confirmed` and no accepted
notebook receipt. The driver stops before notebook submission, but dataset
creation is uncertain. No upload or launch is repeated. The next permitted
read remains 11:47:10 UTC. Inspect dataset metadata and notebook state then,
without creating or changing either.

Portable fixture repair `6489c08f` passes all three focused tests, typecheck,
50 art checks and doc checks. M1 recheck starts at 11:18:23 UTC, PID 69064,
in `/Users/new/projects/kd-framework-check-20261015-recheck`. It repeats the
full suite and build with a one-hour limit. Source bundle SHA-256 is
`93c455ec16c9cd772d4b9de1be8203e1a734399687217c17e0213c1f7d8b1de3`.
The first recheck is 11:50 UTC, combined with the permitted Kaggle read.
No new Kaggle request is made at this checkpoint.

## Final machine check and evidence backup

The permitted 11:54 UTC check finds the M1 recheck complete. At commit
`6489c08f`, the full suite passes 2,395 tests and skips 129. All 50 art checks
and the production build pass. Seven terminal files match the remote SHA-256
manifest. The collection receipt is
`results/framework-check-m1-20261015/recheck/collection.json` on the card.
The first failed run and both remote source folders remain. No additional
simulation games run on M1. No further M1 query is needed.

The scheduled Kaggle read returns HTTP 403 for the exact dataset and HTTP 404
for notebook status. The signed-in account is `saarshai`. Its private dataset
search shows no result for the exact reference. The notebook editor shows zero
saved versions and an empty history. The home page's generic “Commit complete”
label does not establish a saved batch. The history is the direct evidence.
Screenshots and the read-only SDK result are saved in `recovery-kaggle-2/`.
`final-read-evidence.json` records the observations and limits.

Recovery 2 stops before notebook submission. Its dataset creation outcome
remains unconfirmed; no accepted receipt or Kaggle game result exists. No
upload, dataset mutation, notebook submission or approval is repeated. This
is a clear blocker for the full proof. The browser study stays at version 3
with the verified, explicitly incomplete four-game link. There is no full
eight-game pass, balance claim or rule change.

One evidence backup starts detached at 12:02:24 UTC, PID 37781. Its state is
`state/study-backups/framework-machine-work-20261015-final` on the card.
It uses the main results-store backup command without remote collection.
Its manifest covers the full original proof folder and both M1 validation
runs. The project tool has a 90-minute limit; downloaded-byte verification
has a further 30-minute limit. Preserve its maintenance lock and do not start
another upload. The next local check is 12:45 UTC. No further worker query is
scheduled. Record the receipt and exact decoded SHA-256 counts after proof
passes, then remove the follow-up. Backup is pending at this checkpoint.

## Dataset failure investigation

Owner, 2026-10-15: “resolve the Kaggle dataset creation failure, then finish
the remaining four games and link verified results if it's safe. don't retry
an uncertain launch.”

Plan: reproduce the response boundary with the installed SDK contract, retain
a safe structured creation receipt, and test rejection and uncertain replies.
Use read-only account evidence to establish the old dataset and notebook
state before any continuation. Keep all old attempts and the frozen four-job
assignment. Do not retry an uncertain mutation. Do not extend the original
hard deadline. New diagnostic files stay outside the active backup manifest.
Require exact payload and source hashes, all eight legal replays, both illegal
controls, verified cloud bytes and a saved browser link for full completion.

The offline response test reproduces `dataset creation not confirmed` when
the SDK returns status `ok`, the exact dataset URL and an empty `ref`. The
installed SDK's own CLI uses status and URL. The adapter now requires status
`ok`, no service error and an exact identity match. A conflicting identity
fails. It saves an attempt record before creation, then records accepted,
rejected or unknown status without a raw service message. A second invocation
cannot repeat the same attempt. The response test, rejection and uncertainty
controls pass. Typecheck, six transport tests and all 50 art checks pass.

This proves a response defect, not the cause of the old service reply, which
was not retained. The 12:21 UTC read confirms exact notebook ID 138796673 with
version 0. The account lists 12 datasets, with no matching old payload. No
game batch exists. The old dataset remains untouched. A new private dataset
uses an ID derived from the frozen bundle and part. The loader binds that ID
and all four payload hashes. This prevents reuse of the uncertain dataset.
Only the same original notebook and four assigned games may be submitted.
The one-shot recovery uses a separate state folder while backup runs. It
keeps the original hard deadline and a 25-minute worker limit. Its bounded
account audit runs before creation. A rejected or uncertain response stops
the recovery. No full-result or backup pass is claimed yet.

Repair commit `c9e61596` also passes all 113 doc checks. The continuation is
prepared, not launched. Its script is `/tmp/kd-kaggle-recover-3.mts`; SHA-256
is `25d0bc0bc7c31f617f65d4944abc1f205390ea51a8447bebdd0758dafcec0ae4`.
`state/study-runs/dataset-investigation-20261015/continuation.json` holds its
checkpoint. The next local check is 12:45 UTC. The script uses the existing
storage guard and refuses a live maintenance lock. It reserves 30 minutes
for dispatch and requires at least ten minutes for workers within the
original deadline. A lock or insufficient time prevents launch.

## Recovery dispatch and backup authentication failure

At the 12:45 UTC check, the evidence backup has failed before cloud upload.
Google Drive rejects the stored credential with `invalid_grant`. No fresh
receipt or downloaded-byte proof exists. The project tool releases its own
maintenance lock. Its logs and failure record remain; no upload is repeated.

The prepared continuation passes its script hash and source checks. One
detached supervisor starts at 12:46:40 UTC, PID 44324. Its log is
`/tmp/kd-kaggle-recover-3.log`. Dispatch evidence is
`state/study-runs/dataset-investigation-20261015/dispatch-3.json` on the card.
The next local launch check is 13:04 UTC. The new payload ID leaves the old
dataset untouched. The account audit runs before mutation. No accepted
notebook receipt is claimed at dispatch. Never start another copy.

The existing Drive client reconnects with its current account and unchanged
Drive scope. The reconnect command exits zero. A read-only download of the
existing cloud `latest.json` then succeeds. Its decoded byte hash and size
are saved in `drive-auth-recovery.json` under the investigation state folder.
The browser success screenshot is saved. This restores backup access; no
backup upload is repeated. The prior verified partial snapshot remains valid.
All 113 doc checks pass for this dispatch checkpoint.

## Dataset rejection and final evidence backup

The bounded 13:04 UTC local check finds an explicit dataset rejection.
The saved creation receipt has status `error`, state `rejected`, and an error
hash. No accepted dataset identity, notebook receipt or kernel metadata
exists. The exact driver from `c9e61596` raises before dataset readiness and
`kernels_push`. The wrapper's `unknown` label stays unchanged. A separate
`recovery-kaggle-3/terminal-evidence.json` records this narrower conclusion.
The raw reason is not saved, so the cause of the service rejection is unknown.
No worker query, upload, submission or game is repeated. The uncertain old
dataset stays intact. No further compute work is scheduled for this proof.

`recovery-kaggle-3/REPORT.md` records the terminal result. Only four of eight
expected games exist. Four legal replays and one illegal control pass with
the corrected verifier. All four M1 games reach the 80-ply cap. The browser
study stays at version 3 with its verified incomplete link. The full proof
cannot pass, and no full export is linked. This is no balance conclusion.

A new final evidence backup starts once at 13:06:06 UTC, PID 46666. It includes
the recovery report, structured rejection, prior investigation, failed backup,
restored Drive access, original proof and M1 validation. Its required manifest
contains 182 files and 11,517,293 bytes. State is
`state/study-backups/framework-machine-work-20261015-recovery-final` on the
card. The wrapper uses the current main project backup tool without M1
collection. It allows 90 minutes for backup and 30 for downloaded-byte proof.
Preserve its lock and do not repeat its upload. The next local check is
13:45 UTC. Backup is pending at this checkpoint. Final closure requires the
saved receipt and downloaded decoded hashes to pass for every required file.

## Rejection cause follow-up

Owner, 2026-10-15: “find out why Kaggle rejected the dataset, fix the cause,
then finish the remaining four games and link verified results if safe.
don't retry an uncertain launch.”

Plan: compare the saved error hash against known SDK and service messages;
read exact dataset metadata and account limits without mutation. Build a
regression for the confirmed cause and keep safe diagnostic reason codes.
Do not alter files in the active backup manifest. Check the backup only at
13:45 UTC. Preserve both uncertain and rejected attempts. Any continuation
requires proof that no prior notebook batch exists, a passed repair check,
and a recorded bounded schedule. The old deadline is not silently changed.
Acceptance remains eight exact scheduled games, legal and illegal replay
controls, downloaded-byte backup proof and a saved browser result link.

A dataset-only diagnostic request returns `Please select a valid license`.
Its SHA-256 exactly matches the saved recovery 3 error. The probe disables
notebook submission and stops after the same explicit rejection. It uses
only the rejected payload identity and leaves the earlier uncertain dataset
untouched. The license `copyright-authors` is listed in Kaggle's documents,
but this service rejects it. The repair uses `other` with explicit original
author rights, no redistribution permission, and private visibility.

The regression reaches the real adapter metadata boundary and reproduces
`dataset creation rejected` before the fix. The adapter also saves the safe
`invalid-license` reason code for this exact message; other service text
stays out of exported receipts. Diagnostic evidence is separate from the
active backup in `state/study-runs/dataset-rejection-cause-20261015`.

The repaired adapter passes six transport tests, typecheck, all 50 art checks
and 113 doc checks. The old hard deadline remains in the original attempt.
The owner's renewed request authorizes a separate recovery for only original
Kaggle jobs 2, 3, 6 and 7. It uses a new bounded window ending at 21:45 UTC
on 2026-10-15, at most 25 minutes of worker time and 30 minutes of dispatch.
It waits for the existing backup lock, checks exact notebook version zero
and unchanged frozen source, and submits once. Any uncertain outcome stops
the recovery. It does not change the original studio record or M1 results.

Repair commit `c17b4001` is ready. A read-only check at 13:41 UTC confirms
notebook ID 138796673, exact reference, version zero. The prepared one-shot
recovery script is `/tmp/kd-kaggle-recover-4.mts`. Its SHA-256 is
`f52ca776f779bc3b70e3765bf677f2cdfdffe98c944e89ac49d908b9f5d98fa6`.
It has not launched. Its checkpoint is `continuation-4.json` in the rejection
cause state folder. An accepted receipt is saved separately before the run
state update, so a later backup lock cannot erase launch evidence.

At the permitted 13:45 UTC check, the existing evidence backup is verified.
Snapshot `drive:King Down/results-backups/20261015-062733-883499000` binds
182 required files and 11,517,293 bytes to the saved receipt, downloaded
metadata and decoded object bytes. The local manifest still matches every
verified file. The maintenance lock is released. No backup is repeated.

The corrected one-shot recovery starts at 13:45:54 UTC, PID 51380. Its log is
`/tmp/kd-kaggle-recover-4.log`; dispatch is `dispatch-4.json` in the rejection
cause state folder. The next local launch check is 14:05 UTC. An account
audit runs before creation. No accepted notebook receipt is claimed at this
checkpoint. Never repeat the wrapper. A worker status read waits until one
hour after acceptance. The original four-game browser link stays incomplete
until all eight games, validation, backup and browser persistence pass.

## Corrected dataset request has no confirmed response

The bounded 14:05 UTC local check finds recovery 4 stopped with an unknown
outcome. The dataset creation record remains `attempted`. No accepted
dataset receipt or kernel metadata exists. The exact `c17b4001` driver stops
before notebook submission in this state. No accepted notebook receipt or
Kaggle game is claimed. The safe error says the operation failed; it does
not establish whether the dataset was created. No request is repeated.

`recovery-kaggle-4/uncertain-creation-checkpoint.json` binds this conclusion
to the driver hash and local files. The original unknown state stays intact.
The first permitted remote read remains 14:45:55 UTC; the next bounded check
is 14:47 UTC. Read exact dataset metadata and notebook identity then. Do not
create, version, delete or upload a dataset, or submit a notebook, while the
outcome remains uncertain. The browser study stays incomplete at four of
eight games. The prior 182-file verified backup remains valid; new recovery
evidence still needs its own backup after the read-only investigation.

## Existing dataset verified for first notebook submission

The permitted 14:47 UTC read resolves dataset creation. Dataset ID 12608110
has the exact reference, private visibility, ready status and version 1.
Its license is Other. The exact notebook remains ID 138796673 at version
zero. No earlier game batch exists. No dataset mutation is repeated.

All four version-1 files are downloaded and checked against the frozen
payload: source, bundle, supervisor and config. Their decoded hashes and
1,980,476 total bytes match. The notebook loader binds the same hashes.
`verified-dataset-v1.json` and `recovery4-read-only.json` in the rejection
cause state folder retain the proof. The original unknown launch state stays
unchanged; the new evidence resolves it without a false accepted receipt.

A separate one-shot process prepares the first notebook submission at
14:50:48 UTC, PID 66625. It does not create, version or upload a dataset.
It checks account capacity, exact notebook version zero and private dataset
version 1 again before one submission. The frozen four original jobs and
25-minute limit stay fixed; the notebook also has a 1,500-second limit.
Any uncertain submission stops without a retry. The hard deadline stays
21:45 UTC. A fresh receipt is required before a worker check is scheduled.

Script `/tmp/kd-submit-verified-dataset.py` has SHA-256
`597f09f501afe4aacda8389eeb5d1a4574119245d6ae1d886f803bdbb723d632`.
Log: `/tmp/kd-submit-verified-dataset.log`. Dispatch: `notebook-dispatch.json`
in the rejection cause state folder. The next local check is 15:12 UTC.
The first worker read waits until one hour after acceptance. No accepted
notebook receipt is claimed at this checkpoint. Full result linking still
requires all eight games, replay validation and new verified backup.

## Notebook preflight stops before submission

The bounded 15:14 UTC check finds `preflight-failed`, zero submission
attempts and no accepted receipt. The notebook attempt marker and kernel
metadata are absent. The process ends at 15:05:51 UTC, before submission.
Its saved RuntimeError does not retain the exact cause. The 901-second
elapsed time is consistent with the account audit limit; that cause is not
proved. Do not repeat the process or claim a running notebook.

The private version-1 dataset and its four verified files remain valid.
No new games are available. The saved study stays at version 3 with its
incomplete four-of-eight link. There is no full export to link.

`recovery-kaggle-4/final-preflight-evidence/report.json` records the blocker
and copies the diagnostic proof without changing the original records.
One new evidence backup starts with PID 70307. Its state folder is
`state/study-backups/framework-machine-work-20261015-preflight-final` on
the card. It uses the main results-store tool, then verifies downloaded
cloud bytes. The existing backups stay intact. Do not repeat the upload.
The next local backup check is 15:50 UTC. Preserve its live lock. Complete
the final backup evidence and tracker update before removing the heartbeat.

## Final evidence backup verified; live proof remains blocked

At 15:51:56 UTC the final evidence backup passes. Snapshot
`drive:King Down/results-backups/20261015-083717-229645000` contains all
253 required files and 17,618,170 bytes. The saved receipt matches the
proof receipt. Downloaded metadata and three decoded cloud objects bind
every required file to its SHA-256 and byte count. All local required
files still match at the 15:53 UTC check. The maintenance lock is released.
Remote sources and all earlier failure records remain intact.

Proof: `state/study-backups/framework-machine-work-20261015-preflight-final/verified-final.json`
on the card. The receipt tree hash is
`4e73170ebe5f2b62d0b1aca5112d5bcb33a134de48ec087aae7ab014790f8038`.
No upload, worker query, game or submission is repeated in this check.

Evidence preservation is complete. The eight-game live proof is not
complete: notebook preflight stops before submission, with zero attempts.
The exact preflight cause remains unconfirmed. The original study version
3 keeps the verified incomplete four-of-eight link. There is no full result
export to link. All four M1 games reach the 80-ply cap; these results prove
part of the workflow, not game balance. Remove the heartbeat after the
tracker update and doc checks. A future repair must preserve these records
and establish a safe launch path before any submission.

## Preflight repair plan

Owner asks to find and fix preflight, then finish the four missing games
if safe. Capture a bounded read-only audit trace with safe error codes.
Reproduce its failure in the transport checks and fix the shared audit.
Verify focused tests, types, art and docs. Before a first submission,
prove exact notebook version zero and private dataset identity and hashes.
Record the owner quote on main. Submit only the original four jobs once;
stop on uncertainty. Collect, replay, back up and link only verified data.

The read-only account list contains 357 notebooks on four pages. The audit
adds two seconds after each successful request and another two before a
draft metadata check. A 357-notebook regression with one-second replies
fails with `account audit time limit`. Removing those fixed pauses makes
it pass. HTTP 429 backoff, unknown-state rejection and the 900-second limit
remain. Six transport tests, 50 art checks, types and 113 doc checks pass.
A bounded live read-only audit must pass before submission. Its trace is
`state/study-runs/preflight-diagnosis-20261015/audit-proof.json` on the card.

The repaired live audit passes at 17:23:41 UTC in 434.38 seconds. It checks
all 357 notebooks across four pages, handles five HTTP 429 waits and
verifies eleven draft-only 404 responses. It finds zero active notebooks.
The exact target remains ID 138796673, version zero. No mutation occurs
during this audit. The old fixed pauses alone add at least 744 seconds
for the same successful reads and draft checks, before network time.

The owner quote and narrow scope are recorded in the main queue. A new
one-shot notebook-only process starts at 17:24:13 UTC, PID 67650, with
`/tmp/kd-submit-after-audit-fix.py`. It rechecks the notebook and existing
private dataset after the fresh audit. It does not upload or create a
dataset. It uses only jobs 2, 3, 6 and 7 with the original frozen payload.
The 25-minute worker limit and 21:45 UTC recovery deadline remain.
A fresh accepted receipt is required; any uncertainty stops without retry.

At 17:24:29 UTC the fresh process records its single notebook submission.
It stops at 17:24:31 UTC with an unconfirmed response and no accepted
receipt. The launch outcome is unknown. No submission is repeated. The
safe error retains RuntimeError but no service response, so rejection is
not proved. The original records stay unchanged.

`recovery-kaggle-4/notebook-after-audit-fix/uncertain-checkpoint.json`
records the next read-only check at 18:26 UTC, after the first-hour bound.
Read the exact notebook metadata and status then. If a batch exists,
collect and verify it against the frozen inputs before any result link.
Do not infer acceptance from the audit pass. The saved study stays at
four of eight games. New diagnostics require a final verified backup.
