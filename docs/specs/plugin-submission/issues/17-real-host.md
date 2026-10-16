# 17 · WebKit checks and a host like ChatGPT

Type: task
Status: closed

## Scope

Build part 17-a on `claude/real-host`. The owner asks for WebKit support and
checks on both engines. Part 17-b has its own section below.

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
- `npx tsc --noEmit` passes on this Mac and the M1. The full local `npm test`
  run passes: 163 files,
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
  The full suite takes 135.68 seconds. The final M1 board repeat also passes on
  both engines after the control-ready wait. All temporary capture code is gone.
- The workflow tests check the new CI job. CI itself does not run in this task;
  the owner bars a push.
- Logs are in `/tmp/kd-real-host-checks/` on this Mac and
  `/tmp/kd-real-host-results/` on the M1 for the widget and phone-size checks.
  The final board logs on the M1 are `/tmp/kd-real-host-board-final-chromium.log`
  and `/tmp/kd-real-host-board-final-webkit.log`.
- No visual or game design choice is needed. Part 17-b stays outside this task.

## Review fixes

Two reviewers checked `d02a24d6`. Each finding below is confirmed in the code
and by a test that fails before the fix.

- **Sheet focus on WebKit.** WebKit does not focus a clicked button, so eight
  sheet openers gave focus to the page dialog when their sheet closed. One
  capture-phase click listener in `src/plugin/app.ts` now focuses a clicked
  button before its handler runs. It skips script clicks. The coin-only line
  in `board.ts` is gone.
- **King coin on the seat (both engines).** The King sheet gave focus back while
  its coin was still disabled. `pickKing` now focuses the coin again after it
  unlocks, when the focus is on the page body.
- **Use on a coin (both engines).** The refresh after **Use** rebuilt the coins
  and removed the focus. `strips()` now gives the focus to the new coin.
- **Clipboard check.** Chromium reads the real clipboard back again. Only
  WebKit captures the widget's clipboard call. The first try read the engine
  flag from the wrong `evaluate` argument, so Chromium still used the stub and
  the real read failed. The flag now comes from the second argument.
- **Help text.** Both help texts now say that `webkit` is for the plugin widget
  only. Some other checks use CDP or open Chromium directly.
- **Tests.** A new phone-size test opens 14 sheets by pointer and checks the
  focus after Escape or ×. It also checks that a click shows no focus ring.
  Two new board tests check the focus after **Use** on a card coin and a power
  coin. One launcher test reads the runner help. Before the fix, the phone-size
  test failed on Chromium (King coin) and on WebKit (eight openers). The board
  tests failed on both engines.
- **Results.** `npx tsc --noEmit` passes. The full `npm test` passes: 163 files,
  2,567 tests, 8 skipped tests and 50 document tests. On WebKit, the board file
  passes 32 tests and the phone-size file passes 27 tests.
- **Widget check.** At `4d1462a1`, plugin-ui passes on Chromium on the M1
  (97.6 s) and on WebKit on this Mac (118.9 s). Both runs use the shared check
  runner. The runner does not send `PLAYABLE_BROWSER` to the M1, so the WebKit
  run uses this Mac. No time limit changes.

## Part 17-b · A host like ChatGPT

### Scope

The local harness must act more like ChatGPT. The widget page comes from a
second origin, in a sandboxed frame, with the CSP of its resource. Each chat
result can mount a new frame while the old frames stay live. New checks cover
two live widgets, a page that sleeps, and a page that goes offline. All
current checks must pass on the new host. No product code changes.

### Plan

1. Serve the widget page from a second loopback port. Build the sandbox, the
   `allow` list and the CSP header from the resource's `_meta.ui`, as the MCP
   Apps spec says. Quote the spec in a comment.
2. Move `window.openai`, the boot delay and the check hooks to postMessage.
   Change each check that reads the frame from the host page.
3. Add `?frame-per-result`: each `harnessShow` mounts a new frame with its own
   bridge and widget state.
4. Add checks for the origin and CSP, two live widgets on one game, sleep and
   wake, and offline and online.
5. Run `npx tsc --noEmit`, `npm test`, plugin-ui and plugin-ui-http.

### Verification criteria

- The frame origin differs from the host origin. The frame cannot read the
  host page. The browser applies the CSP.
- Two live widgets on one game both show each move. The older widget writes
  only its own state and selects only its own board.
- A page that sleeps reads nothing. When it wakes, it reads the board once and
  shows no error.
- Offline, three failed polls show "Cannot connect" with no Retry. Online, the
  next poll shows the current board and clears the error.
- All current tests and browser checks pass. No time limit changes.

### Results

- `tools/plugin-ui-harness.ts` serves the widget page from a second port on
  127.0.0.1. `framePolicy()` builds the CSP from `_meta.ui.csp` (or the spec's
  restrictive default) and the `allow` list from `_meta.ui.permissions`. The
  frame has `sandbox="allow-scripts allow-same-origin allow-forms"`. Each
  origin returns 404 for the routes of the other.
- `FRAME_SHIM` gives the frame its `window.openai` by postMessage. The host
  keeps each widget's state. The hooks `harnessWidgetState` and
  `harnessWidgetStates` are the newest widget's. Frame code sets host hooks
  with a `harness: 'set'` message.
- With `?frame-per-result`, each chat result appends a new frame and scrolls
  to it. Each frame has its own bridge, calls and widget state.
- The checks that read the frame from the host page now read it in the frame:
  `plugin-ui-check.mjs`, `plugin-app`, `plugin-journeys` and `plugin-lobby`.
- One app test passed only by a sub-millisecond race. It replaced the saved
  state just after the friend screen wrote it. With postMessage, the write
  comes about 35 ms later. The test now waits for that write first.
- The browser checks found a harness fault. A check's clock step runs the
  boot timer inside a DevTools call, and that call may evaluate strings in
  spite of the CSP. The built widget started in that call, so zod's eval probe
  passed and its first parse of a host message failed. The remounted widget
  stayed on "Connecting". The boot timer now ends with a MessageChannel
  message, so the widget code starts in its own task. A real host has no such
  call. A new check fails before this change and passes after it.
- Chrome stops animation frames in a cross-origin frame out of view, as an
  older chat widget is. The new waits on such frames poll on a timer. The
  widget's own polls use timers and keep their pace.
- New tests in `tools/plugin-real-host.test.ts`: the second origin and its CSP;
  a clock step over the boot delay; two live widgets on one game; sleep and
  wake; offline and online. A new unit test checks `framePolicy()` against the
  spec.
- `npx tsc --noEmit` passes. The full `npm test` passes: 164 files, 2,572
  tests, 8 skipped tests and 50 document tests. After the boot fix, the eight
  harness test files pass again: 209 tests.

### Taste choices

- The second origin is a second loopback port, not a second host name. A port
  needs no DNS or hosts file on this Mac or the M1.
- The sandbox adds `allow-forms` to the spec's two tokens, because the widget
  submits forms.
- `clipboardWrite` becomes the `clipboard-write` feature, as the spec permits.
- One frame stays the default, so each current check keeps its flow. The
  per-result mode is a query flag.
- A new frame starts with the host context of the page (fullscreen when it is
  set) and an empty widget state.
- Sleep is a simulation: `document.hidden`, `pagehide` and `pageshow` with
  `persisted: true`, and `visibilitychange`. It is not a real back-forward
  cache restore.
- Offline uses the browser context. The friend moves through Node's fetch.
- The widget gets no `online` listener. Its next poll finds the board.

### Not built

- A real back-forward cache restore. The friend, wait, lobby and join screens
  stop their runners on `pagehide`. Nothing starts them again on a `pageshow`
  with `persisted: true`. The board screen recovers, because its poll uses
  `visibilitychange`. This is a possible product fault, outside this task. It
  needs the owner's decision.
