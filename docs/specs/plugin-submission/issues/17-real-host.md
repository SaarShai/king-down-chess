# 17 · WebKit checks

Type: task
Status: in-progress

## Scope

Build part 17-a on `claude/real-host`. The owner asks for WebKit support and
checks on both engines. Part 17-b is outside this task.

Source: the owner's scratch ticket `tickets/issues/17-real-host.md`.

## Plan

1. Let `PLAYABLE_BROWSER=webkit` select WebKit in the shared launcher.
2. Use that launcher in the board and phone-size tests. Add unit tests for
   engine selection and launch options.
3. Add a separate CI job for the WebKit checks. Keep all current time limits.
4. Run typecheck and `npm test`. Run plugin-ui, plugin-board and
   plugin-ios-size on Chromium and WebKit on the M1. Fix each confirmed fault.
5. Check the diff and commit the change with both requested trailers.

## Verification criteria

- The launcher selects WebKit from one setting. Chromium channels still work.
- Tests cover both launch paths and option forwarding.
- CI installs WebKit and runs all three checks in its own job.
- All required checks pass with their current time limits.
- No dependency, game rule, visual design or server change is in scope.
  A confirmed WebKit widget fault may get a small fix.

## Results

- `PLAYABLE_BROWSER=webkit` selects WebKit. The board and phone-size tests
  keep bundled Chromium as their default. Other Chromium channels still work.
- The separate `browser-webkit` CI job installs WebKit and runs the board,
  phone-size and widget checks. Its limit is 15 minutes. No existing limit changes.
- Six new launcher tests cover engine selection, options and channel precedence.
  Two new workflow tests cover the separate job and its three checks.
- `npx tsc --noEmit` passes. The full local `npm test` run passes: 163 files,
  2,563 tests, 8 skipped tests, and 50 document tests. The test database uses
  the owner's local test URL.
- The two focused unit files also pass on the M1: 24 tests.
- WebKit exposes check assumptions: one board-width check reads before layout;
  the widget check asks for Chromium clipboard permissions. The checks now wait
  for layout and capture clipboard writes with a test stub.
- The three seat-line checks use a raw source page. It lacks the build's seat
  selector rewrite, so the board collapses. WebKit returns no rendered veil text.
  A targeted capture confirms that the text exists but the board is absent.
  These checks now use the built page with real solo and friend setup games.
  They require a nonzero canvas and the correct visible caption.
- WebKit also exposes a focus fault. A pointer click does not focus the coin,
  so Escape returns focus to the page body. The coin now takes focus before
  it opens its sheet. The pointer-open test stays and checks both card and power
  coins. A keyboard-only replacement would miss this fault.
- The passive-drawing check mixes callbacks from page load with a later fake
  clock. It now installs the clock before the page loads. The five-second
  cutoff and the exact frame-count assertion stay the same.
- The tap-area check now waits for an enabled coin after mount. Its 48 px
  targets, image sizes and edge-hit assertions stay the same.
- No time limit changes.
- All six M1 checks pass. The board file has 30 tests per engine. The phone-size
  file has 26 tests per engine. The widget check takes 97.6 seconds on Chromium
  and 165.3 seconds on WebKit. The later changes affect only the board test and
  this ticket; the widget and phone-size results use the same product code.
- The final local test file and full suite pass. The board file has 30 tests.
  The full suite has 163 files, 2,563 tests, 8 skipped tests and 50 document tests.
  The last M1 board repeat is pending after the control-ready wait.
- Logs are in `/tmp/kd-real-host-checks/` on this Mac and
  `/tmp/kd-real-host-results/` on the M1.
- No visual or game design choice is needed. Part 17-b stays outside this task.
