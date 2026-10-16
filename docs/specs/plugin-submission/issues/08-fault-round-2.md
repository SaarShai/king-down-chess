# 08 · Fault round 2

Type: task
Status: in-progress
Blocked by: 05, 06

## Question

Fix the faults from the UX synthesis and from tickets 05 and 06, then review and re-test.

## Progress

The fixes collect on branch claude/fault-round-2. Each round has an adversarial review, and its confirmed findings go to the next round. Tickets with details: docs/specs/chatgpt-mvp/issues/23 to 27 on that branch.

- Round 2 (539a74c4) and 2a (a67eeb84): the UX synthesis faults.
- Round 3 (7adaac11, review fixes 24d3fbd4): F31 command limit of 10 s with Retry, F32 idle motion stops after 5 s, F33 one connection sentence, F34 landscape board 82 → 360 px at 820 × 600.
- Round 4 (d0a0d5f4): F35 and the device matrix faults M1, M3–M5, M7–M11, M13. The wait line on Start moves to 5 s (1a18046f).
- The "Error:" prefix (stress round 2): fixed in dc0e2357.
- Round 5 (in work): 10 confirmed review findings. The largest: Retry hides after an inline remount, a start that waits for a name can stick, Create can run two times on Retry, and opponent moves do not animate.
- Checks on 1a18046f: all pass on the M1 (npm test, build, browser 962 s, plugin-ui 268 s) and the local database checks.
