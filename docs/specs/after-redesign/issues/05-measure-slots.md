# 05 · Measure before N = 3

Status: needs-info (tell the owner before the 45 minutes of checks start)
Blocked by: 01

## Scope

- [Spec §3.4](../spec.md#34-measurement-before-n-goes-above-2). On this Mac, at a quiet time, on one commit: `king-effects`, `painted-game` and `qa` 3 times alone, 3 times beside one functional run, 3 times beside a build and an `npm test` in another worktree.

## Plan

1. [ ] Tell the owner; wait for a quiet Mac (no build agent, no simulation).
2. [ ] Run the 27 checks; record each frame rate, millisecond value and time from the logs.
3. [ ] If no value moves near its limit, change the default N to 3 in one commit with the table in its message; else keep 2 and record why.

## Verification

- [ ] The table of values in Comments, with the commit and the date.

## Risks

- A measurement on a busy Mac gives false alarms: run it only at a quiet time.

## Does not do

- No change to the exclusive list unless the table shows a check that moves under load.

## Comments
