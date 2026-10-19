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

## Verification criteria

- A focused retention probe separates the cause from the other candidates.
- Two Linux browser-webkit jobs check the change. Report each result as it is.
- The report states peak memory, block times and all gaps in the evidence.
