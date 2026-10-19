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

## Verification criteria

- A focused retention probe separates the cause from the other candidates.
- Two Linux browser-webkit jobs check the change. Report each result as it is.
- The report states peak memory, block times and all gaps in the evidence.
