# PR 61: reproduce and fix Linux browser faults

Status: claimed
Type: task

## Scope

Reproduce the release candidate faults in Ubuntu 24.04 with Node 24 and
locked Playwright. Keep Linux modules separate from Mac modules. Fix the
cause. Keep each check, its limits, and WebKit coverage. This ticket follows
[43](43-pr61-ci-webkit.md) and [44](44-ci-scroll.md).

## Plan and checks

1. Start the `kd` Lima VM. Install the CI tools in a copy of this worktree.
2. Run the exact WebKit CI selection. Trace paint, input, and replies.
3. Fix each cause. Each changed case must pass three times in Linux.
4. Run the full WebKit selection and Linux Chromium `plugin-ui`.
   Run Mac `npm test` through the test lock and Mac `plugin-ui`.
   Record the extra full WebKit browser check separately.
5. Review and commit the diff. Do not push. Stop the VM, but keep its disk.
   Write the full result to the owner's handoff file.

## Machine and evidence

The starting commit is `50f8da67`. The VM has Ubuntu 24.04.5 arm64,
four CPUs, and 8 GiB of memory. Node is 24.22.0, as the CI jobs use
Node 24. Playwright is the locked 1.63.0: Chromium build 1243 and
WebKit build 2359. Both browsers have their Linux system dependencies.
The guest repo is `/home/za.guest/kd`. It has its own `npm ci` installation.
The host mount contains only this worktree. A temporary 8 GiB swap file
is used to diagnose the extra WebKit browser check. It does not solve
that check's native memory growth. RAM and CPU settings stay fixed.

Logs and probes are in `node_modules/.cache/pr61-linux/`. The browser
build clears `dist`, so evidence must stay outside `dist`. The first
logs were lost in that build. Their findings below come from completed
command output and trace readings. All named logs below are retained.
The VM is arm64; GitHub's Ubuntu runner is x64.

## Causes and changes

### Readiness precedes the visible frame

The first exact Linux CI selection has 152 passes and 8 failures in
718.78 seconds. It reproduces W7 and faults in board and size waits.
The iframe trace shows that frame callbacks continue. It does not show
a permanent `requestAnimationFrame` stop. Artwork load finishes before
the callback that makes the canvas visible.

`PaintedView.ready()` now resolves in that callback. The unit regression
fails on the old product: readiness fires while the canvas is hidden
(`ready-red.log`). All eight render tests pass three times with the fix
(`ready-green-1.log` through `ready-green-3.log`).

### A computer reply resets the WebKit screen scroll

The second full Linux run reproduces the reported 200% zoom Undo fault
(`linux-webkit-full-2.log`). Three controlled traces show screen scroll
135 becoming 0 when the computer replies. Undo moves from y=286 to
y=421, and its centre no longer hits it. Text height stays fixed
(`zoom-reply-1.log` through `zoom-reply-3.log`).

The board re-inserts its table and canvas parent on each view update.
WebKit resets the ancestor scroll when those nodes move. Move each node
only when its parent must change. The strengthened 200% check holds and
releases the real computer reply, then checks that scroll stays fixed.
It fails on the old product with 0 instead of 135 (`zoom-scroll-red.log`).
No manual scroll reset or browser-specific product path is added.

### The held W7 request exceeds the real request limit

The trace shows a visible, idle board, `Sending…`, then a connection
error. The test holds the reply while it checks tap, keyboard, and drag
input. On Linux those checks can take more than the 10-second SDK limit.
Pause the test clock for the held request, then resume before release.
Keep the real request limit and every input assertion. Pause ahead of
current time; retry only if that time passes before the command arrives.

### The Chromium synthetic swipe sends no movement

The original `plugin-ui` failure after Ticket 13 is the `scrollEnded()`
wait in `zoomBoardFits()`, at the old line 2171. It waits for a real
`scrollend` event. The reduced Linux trace has 226 px of scroll range.
`Input.synthesizeScrollGesture` sends touch start and end, but no touch
move, scroll, or scroll-end event. The canvas does not prevent the touch.

Use the existing `touchStroke` helper to send native touch moves. The
same probe scrolls from 0 to 129 px, emits `scrollend`, and reaches
226 px on its next swipe. A fresh old/new probe retains both results
(`scroll-recapture-old-detail.log` and `scroll-recapture-new-detail.log`).
Keep the scroll progress, native hit, and
scroll-end assertions. Keep the WebKit wheel path.

### The poll-clock jump expires a pending games read

After the swipe fix, a full Linux Chromium trace finds a second fault.
The 30-second jump at the old line 2537 expires a `kingdown_games` read
(`linux-ui-trace-detail.log`). The move button can be idle while this
background read continues. Call the existing `settled()` helper before
the jump. Keep the request limit and all friend-poll assertions.
Three full Chromium checks pass after these two check fixes
(`linux-ui-1.log` through `linux-ui-3.log`, 397.6, 383.9, and 387.3 seconds).
Those runs precede the product scroll fix; final checks are recorded below.

### Size and hit checks read unfinished frames

Full runs expose size and hit checks that start before browser work ends:

- Ready commits a choice, then reads full rules before it opens the board.
  WebKit can also stall in the locator click after the button is stable.
  Use the existing checked mouse-input helper. Wait for both replies,
  then the board. Keep the 2-second action limits.
- A finished coin animation can still measure 43.9884 px against the
  44 px floor. Wait for current animations and the next frame. Find
  and measure current coins together on the stable table root.
- Board entry can measure 190.596 px against the 192 px floor, or 0
  before the visible canvas. Wait for canvas visibility, completed
  entry motion, and its next frame before the geometry checks.
- A short `expect.poll` can expire while an async browser read itself
  runs. After the real paint or animation event, read once and assert
  the same geometry. The fill check always returns a number.

All size floors and hit conditions stay fixed. No test declaration is
removed or disabled. No limit is raised. Focused runs use a temporary
name filter in the guest only; full checks use the original CI selection.

## Validation

The full Linux WebKit CI selection passes all 160 tests in 603.48 seconds,
plus type checks and all 51 art checks (`linux-webkit-full-5.log`).
All 13 changed browser cases pass at least three times. The named test
results in `paint-thirteen-1.log`, `browser-crash-trace.log`, and
`linux-webkit-full-5.log` give three passes for each case.
The final Linux Chromium checks pass three times in 367.4, 374.7, and
379.6 seconds (`final-ui-chromium-1.log` through
`final-ui-chromium-3.log`). The exact CI selection is:

```sh
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE='tools/plugin-{board,ios-size,preview-size}.test.ts' npm test
```

Two focused runs report a WebKit target crash. No kernel out-of-memory
kill is recorded for those focused runs. The subsequent 13-case trace passes
(`browser-crash-trace.log`). This is recorded separately from assertion
failures; no crash retry is added to the test suite.

The extra full WebKit `plugin-ui` check does not pass in this VM. The
Linux OOM killer stops `WPEWebProcess` at 6.1 to 6.3 GiB of resident memory
(`webkit-oom.log`); a process trace confirms `SIGKILL`
(`webkit-signals.log`). The 8 GiB VM has no swap by default. Adding 8 GiB
of swap delays the failure but does not prevent it. The native heap keeps
growing. A native stack sample is in Mesa's software graphics library
(`webkit-native-stacks.log`). This does not prove which native allocation
causes the growth.

Temporary probes test garbage collection, boot-port cleanup, console
references, harness message filtering, document unload, CPU rendering,
and a native allocator setting. They do not solve the resource failure.
All probe code is removed. No engine setting, forced collection, or
harness workaround enters the patch. This extra check is not reported
as a pass. The 160-test WebKit CI selection uses the default renderer.

The final Mac `npm test` passes 179 files and 2,988 tests in 264.45 seconds,
plus type checks and all 51 art checks (`mac-test-final.log`). The 12 files
and 163 tests that need other settings remain conditional skips, as before.
The final Mac `plugin-ui` check passes in 190.9 seconds
(`mac-ui-final.log` and `mac-ui-final-detail.log`).

Mac and VM checks run in sequence. An earlier simultaneous run exceeds
one unrelated Mac search test's five-second limit. The VM is stopped
before the final Mac runs. The temporary swap file is removed. Lima
reports `kd` as Stopped with four CPUs and 8 GiB of memory. Its disk stays.

## Answer and open limit

The reported cases pass with the fixes above. The extra full WebKit
browser check still fails on native memory use in this ARM VM. This
ticket stays claimed until that failure is explained or the full job
passes on its target runner. Do not report the whole CI job as green.

## The extra WebKit check: the harness cause (2026-10-18)

The cause is in the check harness, not in the product. One host page
keeps the whole `plugin-ui` run, about 120 widget remounts. With
Playwright attached, the page keeps each old widget document: Playwright
holds the console arguments that the ext-apps transport logs (each a
message event from the old widget window), and its scripts stay in each
document. So no old document is freed. On the Mac, the WebKit GPU process
grows from 0.9 to 15.4 GB. On the CI runner, the check stops at about
line 1604 (run 39155736132 stops at line 1556, at the 1260 s limit).
A real player has one widget at a time, so the product does not have
this fault.

The fix (`ffebd8ee`, `b3f0ab5d`): `freshHost()` in
`tools/plugin-ui-check.mjs` loads the host page again at seven block
boundaries, with the same chat state, and then remounts once, as a chat
reload does. It first waits until the page is settled, so no widget-state
write is lost. The widget-state UUID check at the end also covers the
states of each host page that the check left. No limit, STEP factor or
assertion changes. Three boundaries were not sufficient: the GPU peak
stayed at 7.0 to 7.3 GB, the old CI stall level.

Mac proof: WebKit `plugin-ui` passes in 235.5 s, with a GPU peak of
3.9 GB (before: 15.4 GB) and a page-process peak of 1.02 GB (before:
2.5 to 3.3 GB). Chromium `plugin-ui` passes in 201.8 s, and
`plugin-ui-http` passes in 214.1 s. The samples are in
`node_modules/.cache/webkit-stall/after.tsv` of the `rc-wk-host` worktree.
The full job on the target runner is the last proof. This ticket stays
claimed until it passes there.

## Review

The product changes stay in readiness and DOM placement. Tests check the
real paint, reply, motion, and scroll events. The scroll regression fails
on the old product. No dependency, workflow, timeout, or skip is changed.
