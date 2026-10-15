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
