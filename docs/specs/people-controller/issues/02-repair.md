# Part 02: repair

Status: ready-for-human

## Scope

Verify the faults in the two lane checks. Fix the major faults and the small, safe minor faults. Keep each repair in this lane. Keep the old pages and the shared UI files unchanged.

## Changes

- Keep the poll command list with `pollSince`, also during the rematch watch.
- Discard only the saved receipt, or the unreadable bytes that the check reads.
- Read the old page's computer command receipt.
- Report sign-in and service faults from the second-engine check.
- Add tests for the first failed read, activity calls, rematch polling and refused commands.

## Verification

The report records the red tests, the final tests, the build, and the browser matrix. Paths start in the design project at `parallel/people/run/repair/`.

## Carry

The 320 px game-board fault is in the base and in `src/interface/play/`. This lane must not edit that folder. The lead needs to repair it in the play lane. No live sign-in, live server, physical device or screen reader is in this repair.
