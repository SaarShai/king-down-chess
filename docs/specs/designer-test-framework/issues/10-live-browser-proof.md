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
