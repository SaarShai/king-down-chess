# Linux WebKit: page crash at 460 seconds

Status: claimed
Type: task

## Scope

Find the cause of the plugin-ui page crash in run 39281771336.
Compare the crash with run 39230893586 and ticket 53. Keep the limits,
assertions and STEP factor. Add no retry. Use only this branch for CI.

## Plan and checks

1. Read ticket 53, both crash logs, the host harness and the widget lifetime code.
2. Locate each crash and each host reload. Test document retention at the host seam.
3. Apply the smallest fix. Keep browser output and measure Linux WebKit memory
   and block times. Run the browser-webkit job twice.
4. Record results and limits. Commit the fix. Do not merge or deploy.

## Evidence

Ticket 53 finds held console handles. Its fix frees documents on the Mac,
but Linux memory still grows without host reloads. Both old crash logs lack
the browser output that can show the kill reason.

The new test uses the real host and its boot shim, with `trapErrors` as in
the check. On the Mac, the old boot event stays alive after a remount and
`page.requestGC()`. Command:
`PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-ui-harness.test.ts npm test`.
The baseline fails after 6.77 seconds. The failure is `expected false to be true`
at the WeakRef check. The log is `retention-red.log` in the task scratch folder.

Candidate: clear the browser console after the old bridge closes. WebKit's
`InspectorConsoleAgent::clearMessages` clears the stored messages and releases
the `console` object group. Source:
<https://github.com/WebKit/WebKit/blob/main/Source/JavaScriptCore/inspector/agents/InspectorConsoleAgent.cpp#L114>.
The test also checks that `trapErrors` keeps an error across that clear.

The crash at main line 1852 is in the touch/mouse swap loop, after the reload
at line 1618. The previous reload is at line 842. The old crash at line 3134
is in the lost-reply game-switch loop, after the reload at line 2754. The
reload in the route-width loop at line 2654 comes before that one. Both crash
sites have a prior reload inside the same large check. The logs contain no
reload timestamps or crash memory. Elapsed total time is not elapsed time
since the last reload.

## Measurements

Mac WebKit, same test command, with the candidate: 3 tests pass in 1.48 s.
The push check runs `npm test` with
`KINGDOWN_TEST_FILE='tools/{plugin-ui-harness,workflow.lint}.test.ts'` and
`PLAYABLE_BROWSER=webkit`: 12 tests pass in 4.34 s, plus 51 document tests.
The type check and the commit and push gates pass.

The first Linux check is run 39297694246, commit `00da0473`. Command:
`gh workflow run plugin-checks.yml --ref claude/webkit-crash-460`.

For a comparison, download artifact 12185141040 of run 39245399741:
`gh api repos/SaarShai/king-down-chess/actions/artifacts/12185141040/zip`.
Extract only `plugin-ui.log`, `probe.tsv` and `run.json`.
This is the first baseline with host reloads in ticket 53. It shows:

- At 480 to 485 s, the board host reload cuts RSS from 4,041 to 1,323 MiB.
- The two swap-scroll messages just before the new crash site follow the
  samples at 500 and 505 s: 1,733 and 1,743 MiB.
- At 900 to 905 s, the last board host reload cuts RSS from 3,487 to 1,229 MiB.
- At the last look-comparison message, just before the old crash site,
  RSS is 1,281 MiB at 1,060 s.

These are comparison measurements, not measurements of either failed run.
They do not prove a memory kill in run 39281771336 or 39230893586.

The full Mac check passes in 260.8 s. Command:
`PLAYABLE_BROWSER=webkit tools/test-lock.sh npm run check:browser plugin-ui`.
Output: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/webkit-crash-460-d9qc5U/plugin-ui.log`.
The command waits for the shared test lock before it starts.

Run 39297694246 passes its Linux WebKit board and harness tests. Its
plugin-ui step starts at 18:05:39 UTC.

Attempt 1 fails at 524.9 s on `clickButton` at the rejection loop (main line
1736), before the reported crash site. It has no crash or memory kill.
The browser exits with code 0 and no signal. RSS stays at 1,733 MiB during
the last 90 seconds. The sampled peak is 4,495 MiB. The console clear does
not reduce Linux memory. Do not treat it as a crash fix.

The host reloads start at 56.0, 129.3, 222.9 and 381.0 s. Thus the completed
blocks take 56.0, 73.3, 93.6 and 158.1 s. The first board block stops at
the rejection loop. The two swap-scroll messages come at 407.0 and 408.5 s.
Sources: `ci-01-plugin-ui.log`, `ci-01-summary.json` in the task scratch
folder; artifact 12212111600, run 39297694246, attempt 1.

Attempt 2 starts with
`gh run rerun 39297694246 --job 118214397360`.

## Second retention candidate

The installed Playwright 1.63.0 `_checkFrameIsHitTarget` obtains a parent
iframe handle for each click and does not dispose it. This is a separate
root from the console handles. Upstream PR 42655 adds disposal in `finally`:
<https://github.com/microsoft/playwright/pull/42655>.
The released 1.64.1 package contains that fix. The installed 1.63.0 package
does not. Check the `async _checkFrameIsHitTarget` body in each
`playwright-core/lib/coreBundle.js`.

An isolated 1.64.1 package is in the task scratch folder. The worktree's
`node_modules` link stays unchanged. A temporary import hook selects that
client and the same old WebKit executable for the focused test. This
separates the client fix from a browser-engine update.

The isolated package install command is
`npm install --prefix <scratch>/playwright-164 --ignore-scripts --no-audit --no-fund playwright@1.64.1`.
No command installs through the worktree's linked packages.
The import-hook check prints
`options => launch({ ...options, executablePath })`, so the focused comparison
selects the new client and keeps the old executable.

The new iframe test fails on 1.63.0: the WeakRef still has the removed
iframe after collection. Duration: 6.78 s. With 1.64.1 and the same old
WebKit executable, all four harness tests pass in 2.72 s. Commands:

- `PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-ui-harness.test.ts npm test`
- `NODE_OPTIONS='--import <scratch>/use-playwright164.mjs' PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-ui-harness.test.ts npm test`

Logs: `iframe-retention-red.log` and `iframe-retention-green.log` in the
task scratch folder. This proves the driver retention fault and its fix.
It does not prove the reason for the old page crash.

The candidate updates `playwright` to `^1.64.1` and locks both packages to
1.64.1. The two lock entries come from the isolated installation. No
package operation writes through the linked `node_modules`.

The full Mac check with the new client and the old engine passes in
311.8 s. Command:
`NODE_OPTIONS='--import <scratch>/use-playwright164.mjs' PLAYABLE_BROWSER=webkit tools/test-lock.sh npm run check:browser plugin-ui`.
Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/webkit-crash-460-CXs644/plugin-ui.log`.
The driver fix is commit `b7fcce25`. Commit `8277d12e` adds two independent
Linux job copies for the measurement. It changes no assertion or limit.

Run 39297694246, attempt 2, passes. All 164 tests pass. The plugin-ui check
passes in 1,140.4 s and web-online passes in 4.9 s. This still uses 1.63.0
and only the console clear. Its artifact is 12212749761.

Its sampled peak is 4,243 MiB. Its host reloads start at 69.8, 158.9,
284.9, 490.8, 848.5, 876.7, 905.4 and 946.2 s. The final mode message
comes at 1,137.8 s. The measured block times are 69.8, 89.1, 126.0,
205.9, 357.7, 28.2, 28.7, 40.8 and 191.6 s.

At the two swap-scroll messages, just before the first crash region,
RSS is 1,588 MiB. The first message is 37.4 s after the board reload.
At the last look message, just before the old crash region, RSS is
1,598 MiB. That message is 162.0 s after the last board reload.
There is no common long growth stretch before both points. These are
measurements of the passing comparison run, not the failed runs.
Source: `ci-02-plugin-ui.log` lines 151, 158 to 161, 273, 329 to 331;
`ci-02-summary.json` in the task scratch folder.

Run 39306798243 checks the driver fix, commit `8277d12e`, on two independent
Linux runners. Command:
`gh workflow run plugin-checks.yml --ref claude/webkit-crash-460`.

Both jobs pass all 165 tests. Their plugin-ui times are 1,160.9 and
1,160.2 s. Their sampled peaks are 4,377 and 4,219 MiB. The driver fix
does not reduce Linux RSS in this check. Do not call it a Linux memory
fix or a proven fix for the old crash. It fixes the reference test.

A final small probe compares minimal and built widgets, with and without
the clock, and with the boot ports closed. Each widget has a 96 MiB
marker. Six remounts, collection, old-iframe WeakRefs and a WebKit heap
snapshot separate retained references from cached native memory.

Probe run 39319558684 fails before checkout. It runs no browser or probe.
The job-level `NODE_OPTIONS` names a file that does not exist before
checkout. Put such a preload on the shell test step, as the full check's
sampler does. The correction moves that setting to `npm test`.

## Verification criteria

- A focused retention probe separates the cause from the other candidates.
- Two Linux browser-webkit jobs check the change. Report each result as it is.
- The report states peak memory, block times and all gaps in the evidence.

## Linux heap evidence

Probe run 39320188018 passes all eight cases. Command:
`gh run view 39320188018 --log`. Artifact 12219189984 holds the heaps.
Download command:
`gh api repos/SaarShai/king-down-chess/actions/artifacts/12219189984/zip`.
The task scratch folder holds `retention-probe-02.log`, the zip, the
extracted heaps and `analyze-retention-heaps.py`.

The minimal widget uses the real host and boot shim. It has no widget app,
art, poll or image cache. After six remounts and two collections, its RSS
is 1,724 MiB. The built widget reaches 2,075 MiB with the clock. Closing
the boot ports gives 2,341 MiB. Teardown gives 2,058 MiB. Console-handle
disposal gives 2,067 MiB. A console clear before removal gives 2,058 MiB.
None of these controls frees the marked windows.

Each heap has 14 distinct windows with 14 distinct `widgetBallast` arrays.
This count includes the current page and initial blank documents. It is
not a count of 14 old widget documents. The heap follows a full collection.
The removed iframe WeakRefs are false, except for the first template.
No `_checkFrameIsHitTarget` handle remains. Element release does not prove
document release.

The minimal heap has these paths to native roots:
`Window <- Structure <- InjectedScriptHost <- root` and
`Window <- Structure <- CommandLineAPIHost <- root`.
The browser inspector thus keeps old windows after element release.
The minimal case rules out widget app code as a necessary cause.

The native source explains these paths. Playwright 1.64.1 selects WebKit
base revision `56453fdfe0b0ca6258c23e6453b34f70b885d13f` in
`browser_patches/webkit/UPSTREAM_CONFIG.sh`. At that revision:

- `Source/JavaScriptCore/inspector/PerGlobalObjectWrapperWorld.h:41`
  stores `Strong<JSObject>` wrappers by global object.
- `InjectedScriptHost.cpp` and `CommandLineAPIHost.cpp` put each wrapper
  in that cache. Its structure refers to the old global object.
- `Source/WebCore/inspector/WebInjectedScriptManager.cpp:104`
  removes the script maps for one old window. It does not clear either
  wrapper cache. The full discard at line 91 clears them.

Read commands use the GitHub contents API, for example:
`gh api 'repos/WebKit/WebKit/contents/Source/JavaScriptCore/inspector/PerGlobalObjectWrapperWorld.h?ref=56453fdfe0b0ca6258c23e6453b34f70b885d13f' --jq '.content' | base64 --decode`.
This supports the inspector-cache cause of retention. It does not show
the native failure that ends either old CI page.

Probe run 39322637641 adds the host-reload control. All eight cases pass.
Command: `gh run view 39322637641 --log`. Source commit: `c7b9ac8a`.
Artifact 12221526185 holds both minimal heaps. After a host reload, the
marked-window count falls from 14 to 2. This proves release of the old
marked documents in this Linux probe. RSS remains at 1,927 MiB after
the first snapshot and reload. RSS alone is not a document count. Use a
heap or a direct liveness test to check document release.

The scratch folder holds `retention-probe-03.log`, the artifact zip as
`retention-probe-03-tail.zip`, the extracted heaps and
`retention-probe-03-tail-heap-summary.json`. The download request asks
for a byte range, but the server returns the full 72,546,575-byte zip.
The probe tools and workflow leave the final branch tree after this check.
Their source stays in commit `c7b9ac8a` for reproduction.

## Block times

Times are seconds between host reload starts. The last row ends at the
pass message. The sampler uses `ps -eo rss=,comm=` each five seconds.
It sums RSS by WebKit process name. Peaks are sampled RSS, not exact
allocation maxima. Source: `8277d12e:tools/probe-webkit-mem.mjs` and the
`plugin-ui.log` artifacts of the measured runs.

| Block (main source lines) | 1.63 pass | 1.64 copy 1 | 1.64 copy 2 |
|---|---:|---:|---:|
| Start to 468 | 69.8 | 70.0 | 70.5 |
| 468 to 719 | 89.1 | 90.9 | 91.6 |
| 719 to 842 | 126.0 | 121.6 | 122.3 |
| 842 to 1618 | 205.9 | 215.1 | 219.8 |
| 1618 to 2654 (390) | 357.7 | 362.8 | 356.6 |
| 2654 (390 to 400) | 28.2 | 29.6 | 28.9 |
| 2654 (400 to 1440) | 28.7 | 28.9 | 29.9 |
| 2654 (1440) to 2754 | 40.8 | 44.4 | 42.7 |
| 2754 to pass message | 191.6 | 195.1 | 194.7 |

## Answer and limits

The cause of the page crash in run 39281771336 remains unknown. The log
proves a page crash. It contains no native reason or memory sample.
Neither full Linux job with the driver fix reproduces that crash.
Both pass, but their memory matches the old range.

The branch fixes two proven reference faults. It clears stored boot
events at remount and updates the driver to dispose iframe click handles.
It also keeps native browser output in CI. These changes are not a
proven fix for the original crash. No limit, STEP factor, retry or
existing assertion changes.

The Linux window retention has a further native inspector root. A root
fix must release those wrappers when a document ends. This repo does not
build WebKit. Host reloads serve as a measured containment for that
fault. The current reloads keep the measured peak below 4.5 GiB. More
reloads near the two crash sites have no support from the samples.

The host replaces the iframe at `tools/plugin-ui-host.ts:87` and closes
the old bridge at line 89. Its message handler selects the current frame
at line 69. It keeps the first iframe as a template at line 4. That one
element does not explain the other retained windows. The widget stops
polls and handle timers at `src/plugin/app.ts:448`. Poll stop clears its
timer and document listeners at `src/plugin/poll.ts:55`. Board teardown
clears its timers at `src/plugin/screens/board.ts:152`. The image cache
at `src/plugin/board-view.ts:12` belongs to one widget document. The
minimal-widget probe needs none of these app objects to retain windows.

Run 39289289584 has a click timeout, not a logged page crash. Its last
click log line does not identify the cause. The new full suites pass
the board tests, including D13. This does not prove that the D13 timeout
and the page crash have one cause.
