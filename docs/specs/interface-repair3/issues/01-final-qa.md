# Final QA repair

Status: resolved

## Scope

Repair P01, P02 and P03 from the final QA report. The owner gives this scope.
Keep the old page, game rules, server and tall-screen hero unchanged.

## Changes

- P01: start the surface and required piece images beside the board code.
  Use this surface for the first frame. Keep the old stone as the default.
  An art retry uses a new address to clear the failed image from the memory
  cache. Keep that address for later boards in this page session.
- P02: put the square and effects control in one fixed choice row.
- P03: limit the hero height on short screens.
- Check repair: let the People sheet entry finish before the test records its
  position. Keep the exact position check. One full run finds a 0.014 px change
  while the entry is still in progress. The selected case passes on repeat.
- Check repair: keep offline active for Start and Join. Remove a reconnect
  that the case does not test. Keep both exact connection-sentence checks.

## Checks

The run report and evidence are in `parallel/repair3/run/` outside this copy.

- Full tests: 6,971 cases pass; 385 cases keep their existing skip gates.
  All 114 painted tests pass.
- Document tests: 195 cases pass; one case keeps its existing skip gate.
- Type checks and build pass.
- Chromium and WebKit: all 28 size and inset cases pass for Home, game and
  choice. No normal case has a console error. The board position stays fixed.
- Four surface failure and retry cases pass. The save stays. The next board
  also opens. Both old-page start checks pass.
- Cold first play: 4,925.5, 4,665.6 and 4,777.6 ms. Median: 4,777.6 ms.
- All owned servers stop by PID. The patch passes an apply check against the
  start copy. No commit or deploy runs in this task.
