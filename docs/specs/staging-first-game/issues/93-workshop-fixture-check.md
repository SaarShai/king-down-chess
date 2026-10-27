# Workshop fixture browser check

Status: needs-triage

## Goal and checks

Find why the full `plugin-ui` check fails at Workshop controls. Compare release
`5067bcad` with main `38f8aefa` in an outside copy. Keep the fix small. A fix must
have a regression test that fails before the fix and passes after it.

Plan: read both failure logs; compare the same full check on main; reduce the
failure; test a confirmed cause; run the affected npm tests and doc checks.
Use the quiet lock and the shared browser locks. Use no deploy, sign-in or
remote database.

## Result

The failure does not occur in this investigation. Its cause stays unconfirmed.
There is no change to product code or test code. This ticket records evidence;
it does not claim a fix or close the original fault.

The supplied logs fail in `tools/lib/card-detail-check.mjs:34`. One run cannot
click the hidden `#workshop-btn`. The other cannot click `#pg-tab-cards`. The
short navigation probe alone does not reproduce either full-check failure.

The original session sets `PLAYABLE_BROWSER=chrome` for both failed full checks.
The named check uses Chromium if there is no browser override. The first three
comparison runs use that default. The next two use Chrome, as the failed runs do.
All checks keep their assertions and time limits.

| Source | Browser | Setup | Full fixture check |
| --- | --- | --- | --- |
| Main `38f8aefa`, outside copy | Chromium | Existing Vite cache | Pass, 294.1 s |
| Main `38f8aefa`, outside copy | Chromium | Empty Vite cache | Pass, 289.1 s |
| Release `5067bcad`, this worktree | Chromium | Existing Vite cache | Pass, 302.1 s |
| Main `38f8aefa`, outside copy | Chrome | Same browser as the failures | Pass, 302.9 s |
| Release `5067bcad`, original review copy | Chrome | Original directory and generated files | Pass, 298.8 s |

The full Chrome checks use `PLAYABLE_BROWSER=chrome` and
`npm run check:browser plugin-ui`. A `caffeinate -i` wrapper keeps the Mac awake.
The outside copies use the shared lock wrapper from the original review. The
worktree uses the browser runner's shared locks. A first worktree attempt stops
before a check starts because two nested lock takers conflict; the repeat uses
only the runner's browser locks. No lock of another session is removed.

A temporary navigation probe uses Chromium and a fresh Vite cache for each of
five rounds. Each round checks phone and desktop sizes, with light and dark
colours. All 20 cases pass. The probe records navigation and Vite reload events
on failure. It finds no failing case. The probe is removed from the source tree.

`KINGDOWN_TEST_FILE=tools/workshop-nav-probe.test.ts npm test` passes one selected
test and all 67 art checks. This is not a full unit-suite pass. No regression
test is added: there is no confirmed failing case or fix to test.

## Evidence files

All logs are under `/private/tmp/kd-release3-evidence/`:

- Original failures: `plugin-browsers.log`, `plugin-browsers-awake.log`.
- Main: `workshop-main-before.log`, `workshop-main-cold.log`,
  `workshop-main-chrome-before.log`.
- Release: `workshop-release-before.log`, `workshop-original-release-chrome.log`.
- Selected npm test: `workshop-release-probe.log`.
- Temporary probe source: `workshop-nav-probe.test.ts`.
- Doc checks: `workshop-docs.log`.

## Open limit

These passes do not prove that the earlier failure is a release fault or an
existing fault on main. The cold-cache and generated-file comparisons also do
not prove a cause. Do not change click timing, skip an assertion or change
product behaviour on this evidence. The next useful case must reproduce the
failure and capture navigation, menu state and frame progress at that step.
