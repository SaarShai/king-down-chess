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
