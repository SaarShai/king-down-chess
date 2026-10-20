# WebKit CI failures

Status: open
Type: task

## Build plan

1. Add a five-second process and memory sampler.
2. Start it in the WebKit job. Save kernel output on failure or cancellation.
   Upload the sampler log on every result.
3. Add workflow lint tests. Show that they fail without the CI steps.
4. Add the unit-test lock rule to `docs/COMPUTE.md`.
5. Record each failure, the proved retention fault, and the unknown causes.

## Acceptance checks

- Run `bash -n` and a 12-second local sampler check. Require two blocks.
- Run the workflow lint without the CI steps, then with them.
- Run `npx tsc --noEmit` and `npm test` with the shared test lock.
- Commit the change. Run `plugin-ui` through the supplied check runner.
- The main session pushes the commit and reads the first CI sampler artifact.
  This lane does not push.

## D13 Menu click stall

Run 39289289584, attempt 1, stops at the second Menu click in
`tools/plugin-board.test.ts:1625`. The last click message is `done scrolling`.
Input has not started. The board file takes 852.426 s in Linux CI.

On this Mac, 20 focused runs and two full-file runs show no D13 stall.
The full-file runs take 143.72 and 147.92 s. Each has the same separate
Tab-focus failure, which ticket 49 records. The click can stop in geometry,
frame hit checks, or a utility call after scroll. The API log does not
show which request stops. It does not prove a sheet or input fault.

## Empty seat line

Run 39289289584, attempt 2, job 118206798016, fails
`uses the correct seat line for computer=true at 393 × 852`.
The seat line is empty. The test expects text that starts with
`Their side stays hidden until you are`.
PR 70 changes only a judge test and lesson documents. The cause is unknown.
This failure and the D13 stall have no proved common cause.

## Page crashes

Six Linux WebKit runs show a page crash in `plugin-ui`:

| Run | Time | Last fault or location |
|---|---:|---|
| 39230893586 | 757 s | `Target crashed`, main line 3134 |
| 39281771336 | 460.6 s | `Target crashed`, line 1852, `idleBoard` |
| 39294419190 | 642 s | `Page crashed` in `clickButton`, call at line 2085; then `Target crashed` |
| 39298834061 | 624.6 s | Wait at line 2023 exceeds 90 s; then `Target crashed` |
| 39301683983 | 430 s | `clickButton` from `sendTurn`, call at line 1687; then `Target crashed` |
| 39309776264 | 490 s | Closed target at `#last-move`, line 1747; then `Target crashed` |

These line numbers belong to the recorded revisions. They can change.
The first two crashes follow host reloads within the check. Total elapsed
time does not give time since the last reload.

Run 39309776264 has `DEBUG: pw:browser`. It uses Playwright 1.63 and
WebKit build 2359. Browser output has no native crash reason. The browser
ends with `exitCode=0, signal=null`. The evidence points to the page's
WebContent process, rather than the browser process, as the failed process.
No failed run has memory, runner load, or kernel data at the fault.
WebKit's page memory limit is 8192 MB. The logs do not prove that it is hit.

## Proved document retention

Linux probe run 39320188018 retains old widget windows after remount and
collection. The minimal widget has no app, art, poll, or image cache.
Its heap has 14 marked windows. This count includes current and initial
blank documents; it is not a count of 14 old widget documents.
The roots pass through `InjectedScriptHost` and `CommandLineAPIHost`.
WebKit's per-global-object inspector wrapper caches keep those windows.

In run 39322637641, a host reload reduces the marked-window count from
14 to 2. RSS stays at 1,927 MiB after the first snapshot and reload.
RSS alone does not measure document release.

A passing full check with the old driver has a sampled peak of 4,243 MiB.
Two passing checks with the fixed driver reach 4,377 and 4,219 MiB. A separate
click-stall run reaches 4,495 MiB; it has no page crash. Host reloads release
old documents. The driver change does not reduce Linux RSS in these checks.
These comparison samples do not prove the cause of any page crash. More
reloads have no support from these samples.

The Playwright 1.64.1 driver fix from upstream PR 42655 disposes iframe
click handles. A liveness test fails with 1.63 and passes with 1.64.1 and
the same old browser engine. That fix and its liveness test go in the web
session's Playwright upgrade PR. They are outside this change.

## What this change records

The WebKit job starts `tools/ci/webkit-sampler.sh` after the browser install
and before `npm test`. Every five seconds, it appends epoch time, load
average, available memory, free swap, and WebKit process data. Each process
line has PID, RSS, CPU use, elapsed time, and at most 120 command characters.
The job prints `nproc` and `free -m` once.

On failure or cancellation, the job saves the last 400 kernel log lines.
The capture cannot fail the job. The existing `webkit-check-logs` upload
keeps these lines. The separate `webkit-sampler` artifact uploads on all
results and stays for seven days. A passing CI run supplies a baseline.

This change does not collect native stacks, protocol request timings,
heartbeats, frame state, or sheet state. Those facts can still be needed
to separate a busy process from a lost frame or an unanswered hit check.
No product code, test limit, check limit, STEP factor, retry, or existing
`DEBUG: pw:browser` setting changes.

## Sources

- The supplied `flakes/NEW-EVIDENCE.md`, through run 39309776264.
- The `webkit-d13-stall` worktree's `55-webkit-d13-stall.md`.
- The `webkit-crash-460` worktree's HEAD record, `55-webkit-crash-460.md`.
  This record uses number 57 because number 55 is taken on main.

## Build checks

- `bash -n tools/ci/webkit-sampler.sh` passes.
- A 12-second local run writes three blocks. This Mac has no `/proc`.
  The script skips those lines. This run uses the real process list.
- The sampler unit test passes. It checks append, epoch time, process
  fields, the four original executable names, the command cut, and the interval.
  It also checks the presence or absence of the `/proc` fields.
- Without the new CI steps, the three new workflow lint tests fail and
  nine tests pass. With the steps, all 12 tests pass.
- `npx tsc --noEmit` passes.
- `npm test` exits 1 after 335.75 s: 193 files pass and one fails;
  3,225 tests pass, eight skip, and one fails. The failure is a 5,000 ms
  screenshot timeout in `tools/plugin-profile.test.ts:457`. The call log
  ends after `fonts loaded`. The contrast assertion does not run.
  That file matches the branch base, `aaa7bf2b`. No retry or limit change
  follows. The final document-test command does not run after this failure.
- The supplied check runner runs `plugin-ui` with `PLAYABLE_BROWSER=webkit`
  on this Mac at build commit `662bee28`. It exits 1 after 420.4 s at the
  unchanged 420 s limit. The runner reports:
  `check-runner: mac exit 1 at 662bee28`. No retry follows. The closed-page
  error at shutdown does not prove a native page crash.
- The lane logs are `lint-red.txt`, `lint-green.txt`, `sampler-test.txt`,
  `typecheck.txt`, `npm-test.txt`, and `checks-webkit-1-1.txt` in the supplied
  `scratchpad/lanes/webkit-ci-diag` folder. The real sampler output is
  `sampler-local.log` in that folder.
- All five build parts are present. The unit-suite and browser proofs fail.
  The main session must still push and read the first Linux CI
  `webkit-sampler` artifact. No Linux artifact proof exists for this change.
  This failure record stays open.

## Build choices

Skip missing `/proc` files on this Mac. Filter the WebKit and WPE
executable names by the first command word. Use WebKit for the required
`plugin-ui` run. No product or visual choice is part of this build.

## Review fix plan

Review A reports that the sampler drops the three WPE process names.
The current filter confirms this fault. Review B supplies no finding.

The [Playwright launcher](https://github.com/microsoft/playwright/blob/v1.63.0/browser_patches/webkit/pw_run.sh#L29-L32)
selects WPE for headless Linux. The [WebKit build file](https://github.com/WebKit/WebKit/blob/56453fdfe0b0ca6258c23e6453b34f70b885d13f/Source/WebKit/PlatformWPE.cmake#L15-L17)
sets the three names: `WPEWebProcess`, `WPENetworkProcess`, and `WPEGPUProcess`.

1. Extend the sampler test to require all three WPE names.
2. Add those names to the process filter. Keep the existing names.
3. Require the sampler test and shell syntax check to pass. Run `npm test`.
4. Commit the fix. Run WebKit `plugin-ui` with the supplied check runner.
   Record each result here. Keep all time limits as they are.

The shared test queue delays the focused test. Apply the confirmed fix
before that test starts. No test result from before the fix is claimed.

## Review fix results

Review fix status: done.

- Review A, P1: confirmed and fixed in `121d3e1f`. The filter accepts
  `WPEWebProcess`, `WPENetworkProcess`, and `WPEGPUProcess`. It keeps the
  original process names. The test requires all seven names and compares
  every process row, so it detects missing or extra rows.
- Review B: the supplied text is `undefined`. It has no finding to check.
- `bash -n tools/ci/webkit-sampler.sh` passes.
- The focused sampler test passes: one file, one test. It uses the shared
  test lock. Its log is `fix-sampler-unit.txt` in the supplied lane folder.
- WebKit `plugin-ui` passes on this Mac in 355.9 s at `121d3e1f`.
  The supplied runner reports `check-runner: mac exit 0 at 121d3e1f`.
  Its log is `checks-fix-1-1.txt` in the supplied lane folder.
- `npm test` uses the supplied local test database URL and shared lock.
  It exits 1 after 315.82 s: 193 files pass and one fails; 3,225 tests pass,
  eight skip, and one fails. The failure is the 30,000 ms limit in
  `src/workshop/judge.test.ts:193`. The test reports 34,575 ms. The judge
  source and test match the branch base, `aaa7bf2b`. This fix changes only
  the sampler, its test, and this record. No retry or limit change follows.
  The final document-test command does not run after this failure.
  The log is `fix-npm-test.txt` in the supplied lane folder.

No server code changes, so `plugin-ui-http` is not required. The first
Linux CI sampler artifact still needs a check by the main session.
