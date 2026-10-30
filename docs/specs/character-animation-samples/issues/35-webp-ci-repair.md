# Repair the WebP package checks

Status: ready-for-review

## Plan and checks

- Reproduce the offline browser failure. Keep the runtime package out of the offline install and test the list.
- Keep promotion tied to its locked geometry. Give the promotion test a matching, explicit authority and test rejection of a changed lock.
- Run the focused tests and `npm run check:browser web-online`. Push the fixes and check PR 223 CI.

## Evidence

The offline build omitted the character runtime directory. The promotion test used its small fixture against the shipped manifest after the package arrived. It now supplies a matching runtime manifest and checks that a changed pivot fails. A later review found that the worker list was too large. The repair leaves optional runtime files out of both worker lists. The browser audit checks the small list.

The two focused test files pass 19 cases and the 68 board checks. The first clean `web-online` check passes in 268.4 seconds. The final focused run passes 59 cases and 68 board checks. The final browser check passes in 262.9 seconds. CI on PR 223 is the full-suite gate.

CI run 41127386175 passes the web job and the full test suite. The later output check rejects the new public paths. The build and output check now share the runtime file rule. Run the focused tests and the local output check, then repeat CI.

CI run 41130026962 passes nine jobs. The WebKit web step hits its four-minute limit after the cache grows. The local WebKit web check passes in 277.6 seconds. The CI step now has 15 minutes. The check keeps its assertions.

The workflow also needs room after a hung step to save diagnostics. The WebKit UI job limit is 60 minutes. Its focused workflow lint passes 23 cases and keeps the diagnostics time check.

## Review correction

The runtime precache stopped the worker install on the phone network profile. The browser gate also hid the first 750 ms after the offline switch. PR 223 removes that precache, checks the queue before each frame request, and restores the gate. The source records stay out of the published tree. The WebKit limits return to their prior values.
