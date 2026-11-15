# Part 02: repair

Status: ready-for-human

## Scope

Verify the faults in the two lane checks. Fix the major faults and the small, safe minor faults. Keep each repair in this lane. Keep the old pages and the shared UI files unchanged.

## Changes

- Open the person sheet after its optional rows load. Stop the wait at 1.5 seconds. A later answer does not move the controls.
- Keep the name-search frame at one height while its rows change.
- Open the sign-in sheet after its ways load. At 1.5 seconds, show the service sheet. A later answer does not replace it.
- The opener stays busy until the sheet opens. A second tap cannot open another sheet.
- Close ends the sheet task. A late answer cannot reopen it or continue a join.
- Use product copy for email and code validation. Remove non-digit characters before the ten-digit limit (the field takes 6 to 10, decision 109).
- Keep error status lines in the tree. Link each email and code field to its status line.
- Show the ready name and picture after the check. Keep the busy button height stable. Focus and show the link when the copy fails.
- Add Try again to a failed landing read. Restore focus after a landing state change.
- Apply safe areas to recovery panels. Use turn in the sign-in-again line.
- Include the fixture page only with `KINGDOWN_TEST_PAGES=1`.

## Text changes

- `Checking your name…`
- `Copy this link and send it to your friend.`
- `Your sign-in has ended. Your turn stays on this device. Sign in to send it.`

## Verification

The report records the red tests, the final tests, the build, and the browser matrix. Paths start in the design project at `parallel/people/run/repair/`.

## Carry

The 320 px game-board fault is in the base and in `src/interface/play/`. This lane must not edit that folder. The lead needs to repair it in the play lane. No live sign-in, live server, physical device or screen reader is in this repair.
