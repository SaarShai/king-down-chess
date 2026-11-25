# Test workers: the two plugin-app reds

Status: done for the two `plugin-app` reds: for each, a forced order gives the same red and the test repair makes it green; the natural trigger is an inference. The line 1379 order is also a product fault: ticket [08](08-two-taps-before-preview.md). Open: the pass bar with 8 workers failed in run 4 on two other files with no proven cause, so `maxWorkers` stays 4.

Source: [retro](../retro.md), item 11; ticket [06](06-test-workers.md)

## Problem

Ticket 06 kept `maxWorkers: 4`, because two tests of `tools/plugin-app.test.ts` failed with 8 workers and had no cause:

- "keeps two failed polls silent, resets the count on a good read, and locks after three failures": line 2018, `expected true to be false`. Try again shows after the second failed poll of the second offline window.
- "recovers a held move at 10 seconds and ignores its late reply": line 1379, `locator.click: Timeout 5000ms exceeded`, while it waits for `#end-turn[aria-disabled="false"]`.

## Cause

### Premise: do they fail with 4 workers?

- Line 2018: yes. The session logs of the owner hold three natural reds of this test: one on 2026-10-24 and two on 2026-10-29. `vite.config.ts` had `maxWorkers: 4` at those commits. Each was the only red of its full run. The 10-24 extract shows `expected true to be false`; the two 10-29 extracts show only the FAIL line, and one of them shows 5 `connection failed` lines. The 10-24 run had a load average of 13.8. Thus this test is a flake with 4 workers too.
- Line 1379: not shown. The session logs hold four earlier reds of this test (two on 10-15, one on 10-26, one on 11-13). Each run has at least 4 other failures, and the logs do not keep the error line of this test. The 10-15 runs come before the `maxWorkers` setting.
- CI: neither test is in the logs of the last 40 failed CI runs. These logs hold only the failed jobs: 17 hold no vitest output, and 13 name `tools/plugin-app.test.ts`. So this covers 13 runs. In those 13 the held move test passes, in 7.6 s to 13.6 s.

### Line 1379: the taps come before the board preview reply

- The test reads the game after the friend joins. That read draws the board, and the board asks the server for its draft preview (`requestPreview` in `src/plugin/screens/board.ts`). The test then taps e2 and e4 at once. It does not wait for the preview, as the poll test does with `settled(page)`.
- While the preview waits, `previewWaits()` is true and `canPlay()` is false (`board.ts:176`, `:177`, `:184`). The tap on e2 only reads its square and keeps it as `earlyTap` (`:448`, ticket 87). The tap on e4 clears `earlyTap` (`:431`); e4 is empty, so `:442` clears `selected` and `inspected`. The reply (`:370`) then has no kept tap to apply. No move stages, so `#end-turn` stays off, and the click waits until its 5 s limit.
- Thus the cause is the order, not the 5 s limit: after two early taps, End turn never comes on.
- The kept probe output (`diag-held.txt`) comes only from forced runs: with the repair, `harnessApp.client.inflight` is 0 at each tap and End turn comes on 437, 416, 453 and 923 ms after the second tap; without it, `inflight` is 1 at each tap. The output of the unforced probe runs is not kept.
- Rejected: a canvas box read before the board has its size (the seat tap fault of ticket 06). The canvas is 487 px wide at each read in `diag-held.txt`. A run with each ResizeObserver callback of the frame held 400 ms was green with the same width; its output is not kept. The board keeps its size from the waiting screen.
- Forced order: a Playwright route holds the first `kingdown_preview` request after the join read. Without the repair (hold 1500 ms), the test is red 4 of 4 times with the exact line: `locator.click: Timeout 5000ms exceeded`, waiting for `#end-turn[aria-disabled="false"]`. With the repair and a hold (1500 ms once, 3000 ms three times), it is green 4 of 4 times.
- Not measured: that a full suite delays the preview reply past the two taps. This is an inference.
- The test repair is correct for a test about the held move: that test must stage its move, not test early taps. But the order is also a product fault. On a slow network, on a game that needs the server preview (in a build, a game with another engine than the page), a player who taps a piece and then its target before the preview reply gets no move and no message. No wrong move goes to the server. Ticket [08](08-two-taps-before-preview.md) holds that fault; this work does not build it.

### Line 2018: the good read meets the old offline state

- The test counts failed polls. Two failed polls are silent, a good read sets the count to 0, and the third failed poll in a row shows Try again. The good read comes at once after `setOffline(false)`.
- Each failed transport call writes `King Down connection failed` to the browser console, and the vitest log keeps these lines. The red full run of ticket 06 (`passfull-1.log`) has 5 of them from this test at 11:32:33: 3 under the test, and 2 under the next test. The next test writes none when it runs alone. The 10-29 red also has 5.
- Up to line 2018 the test makes only 4 offline polls. A green run of the complete test has 5 lines (2 + 3 polls). Thus in each red, one more transport call failed with `Failed to fetch`. A good read that comes back but does not set the count to 0 gives 4 lines, so that is not the cause.
- In a green run, the test makes no other call in this part: the tool calls are the 5 polls and nothing more. Line 2005 passes, so the draft preview is present, and an unchanged poll starts no new preview. The timed poll is 15 s or more away.
- So the most likely failed call is the good read itself: Chromium applies the online state after `setOffline(false)` returns, and the read meets the old offline state. That failure is the third in a row, and nothing checks `#retry` until line 2018.
- Ticket 06 rejected a late network change: 300 changes, each followed at once by a fetch from the host page, gave 0 late changes. That probe ran without the load of a full suite.
- Forced order: a Playwright route aborts each host request with `internetdisconnected` for 300 ms or 1000 ms after the first `setOffline(false)`, as if the browser applied the online state late. Without the repair, the test is red 7 of 7 times at the same assertion (`expected true to be false`). The four runs with 300 ms show 5 `connection failed` lines, as in the natural red; the three runs with 1000 ms show 3. In each of the 7, the capture shows `#error` "Cannot connect. Check your connection, then try again." and 5 `kingdown_get` calls with no other call. With the repair and the same force, it is green 7 of 7 times.
- Not measured: a natural late online state under the load of a full suite. The natural reds do not keep the tool calls, so the count of 5 shows one more failed fetch but does not name the call.

### Two new reds in pass-bar run 4 (cause not found)

Run 4 failed two tests in other files, both at the first wait after a page boot:

- `tools/plugin-real-host.test.ts`, "keeps two live widgets on one game current, and the older widget writes only its own state": `frame.waitForFunction: Timeout 5000ms exceeded` in `showGame` (line 60), for the second widget. The test took 8008 ms (3971 and 4433 ms in runs 2 and 3).
- `tools/plugin-setup-owner.test.ts`, "uses the seven selected copies for random": `locator.click: Timeout 5000ms exceeded`, waiting for `#home-games:not(:disabled)` (line 249), the first action after the page opens. The test took 5245 ms (1086 and 783 ms in runs 2 and 3). The solo and quick variants just before it passed in 1.7 s and 1.6 s.

What the JSON reports show:

- Both reds come in the same 5 s, at about +239 s to +244 s of the run. The file spans in that window hold seven browser files (`plugin-app`, `plugin-profile`, `plugin-join-review`, `plugin-setup-owner`, `plugin-motion-concepts`, `plugin-real-host`, and from +242 s `plugin-screen-lifecycle`), with `deploy.test.ts`, `commit-msg.test.ts` and, from +241 s, `machine-lease.test.ts`. Runs 2 and 3 did not run the two red files at the same time.
- The tests of the other files in that window took about 1.4 to 2.3 times their time in runs 2 and 3. Over each file, the median is 1.0 to 1.4 times. A load of that size does not explain a boot step of less than 1 s that takes more than 5 s.
- A held app module (6 s) gives each exact line (`plugin-real-host` 4 of 4, `plugin-setup-owner` 3 of 3), and a 10 s or 15 s boot limit makes it green (3 of 3 each). But a hold of 6 s must fail a 5 s wait, so this force cannot tell a slow boot from a stuck boot. It is not a proof of the cause, and the limits are not in the tree.

By the stop rule, `maxWorkers` stays 4.

## Change

- `tools/plugin-app.test.ts`, "recovers a held move at 10 seconds and ignores its late reply": `await settled(page)` after the join read and before the taps (commit `aecd22ff6`).
- `tools/plugin-app.test.ts`, "keeps two failed polls silent…": the helper `network(page, online)` sets the offline state, then waits until a fetch from the host page gets that state. The test uses it for each of its four changes. After the good read, the test checks that `#error` is empty. The two checks name the message line and the last 8 tool calls when they fail, so a natural red carries its own log (commit `537229593`).
- `vite.config.ts`: no change. The pass bar ran with `process.env.CI ? 4 : 8`; after the red in run 4 the value went back to 4.

## Checks

Times are the vitest `Duration`. The runs of one test select it with `KINGDOWN_TEST_NAME`; the forced runs also skip the type check (`KINGDOWN_TEST_NO_TYPECHECK=1`).

| Run | Workers | Repair | Time | Result |
| --- | --- | --- | --- | --- |
| Line 1379, ResizeObserver callbacks of the frame held 400 ms | 1 test | no | 4.2 s | green (rejects the box cause; its width output is not kept) |
| Line 1379, hold of the preview 1500 ms | 1 test | no | 7.7 to 7.8 s | red (4 of 4), the natural line |
| Line 1379, hold of the preview 1500 or 3000 ms | 1 test | yes | 5.1 to 7.1 s | green (4 of 4) |
| Line 1379, no force, with the type check | 1 test | yes | 4.0 s | green |
| Line 2018, late online state 300 or 1000 ms | 1 test | no | 2.9 to 3.1 s | red (7 of 7), the natural line; 5 `connection failed` lines in the 300 ms runs, 3 in the 1000 ms runs |
| Line 2018, late online state 300 ms, force started after the wait | 1 test | yes | 2.8 s | void: a fault of the probe (the late state began after the repair's wait); red at the line 2018 assertion |
| Line 2018, late online state 300 or 1000 ms | 1 test | yes | 3.4 to 4.3 s | green (7 of 7) |
| Line 2018, no force, with the type check | 1 test | yes | 2.9 s | green |
| Pass bar, full run 1 | 8 | yes | 478 s | green (the other runs took 326 to 343 s; the cause of the long run is not measured) |
| Pass bar, full run 2 | 8 | yes | 326 s | green |
| Pass bar, full run 3 | 8 | yes | 342 s | green |
| Pass bar, full run 4 | 8 | yes | 343 s | red: `plugin-real-host.test.ts:60` (via line 190) and `plugin-setup-owner.test.ts:249`; `plugin-app.test.ts` green |
| Run 4 reds, app module of the frame held 6 s, 5 s limit | 1 test | no | — | red, the natural lines (`plugin-real-host` 4 of 4, `plugin-setup-owner` 3 of 3) |
| Run 4 reds, app module held 6 s, 10 s (`plugin-setup-owner`) or 15 s (`plugin-real-host`) limit | 1 test | limit | — | `plugin-setup-owner` green (3 of 3); `plugin-real-host` void once (the probe kept the hold on for the remount, red at line 239), then green (3 of 3) |
| `tools/plugin-app.test.ts`, committed state | 4 | yes | 190 s | green (138 passed, 1 skipped: "reads a friend code again after the join preview remounts", an `it.skip` outside this work) |

The pass bar fails: 3 green and 1 red. Runs 5 to 10 did not run. `tools/plugin-app.test.ts` was green in each of the 4 full runs with 8 workers.

## Known limits

- For each test, a forced order gives the same red and the repair makes it green. This does not prove that a full suite gives that order. Both natural triggers are inferences.
- The forces are not in the tree. The patches with them are in the log folder of this work, `$TMPDIR/workers-8-logs/` (`held-force.patch`, `poll-force.patch`, `boot-force.patch`), not in the repository. The ResizeObserver probe is in no patch.
- The committed poll test has one more check than the forced runs: `#error` is empty after the good read.
- Other tests in the file use `setOffline` with no wait for the state. Five natural reds of "gives one offline sentence on Start and Join" (4 workers) show a server reply ("Invitation unavailable") on the join screen while the page is offline. Four of the five are on one day (11-14), so they can come from a change of that day, not from load. This work did not prove or repair that test.
- Lines 924 and 953 of `tools/plugin-app.test.ts` also tap through `screenOf` after a read. The first waits with `settled(page)`; the second taps before the preview on purpose (ticket 87). No change.
- The run 4 reds have no capture at failure time, so a next red of the same tests also does not show if the page was slow or stuck.
- Other sessions of the owner share the Mac. The times change with their load.

## Review

- Review: an agent that did not build the change read head `571cbdfde`. It found one blocking finding and five notes, all in the docs. The blocking finding: the line 1379 order is also a product fault that a player reaches on a slow network; ticket [08](08-two-taps-before-preview.md) now holds it. The notes: the cause sentence of the early taps, the count of `connection failed` lines in the forced reds, the CI coverage (13 runs, not 38), the times and counts in the checks, and the word "proven". One batch repairs them.
- Open findings: none that block.
