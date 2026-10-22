# Preserve screen state and stop late work on teardown

Type: bug
Status: resolved

## Plan

1. Add SDK teardown regressions for open setup/seat sheets and held Profile/Unblock/Join replies.
2. Reproduce the failures before changing product code.
3. Keep user-close actions separate from disposal; guard late replies with the existing stopped/closed contract.
4. Run the focused lifecycle suite, then retain the main task's compiled browser result as acceptance evidence.

## Checks

Open pieces, cards and king sheets plus seat king, menu and Abort survive SDK teardown in saved state and restore on remount. Normal Close still clears them. A held Profile success or failure changes no DOM/state after teardown. A held Unblock starts no new reads. A changed-code Join preview does not recurse or render after teardown. No new lifecycle framework or CSP change is part of this fix.

## Cause and change

The host now uses the SDK teardown before removing an iframe. The raw screen stop callback runs before the runtime saves the client. Setup and Seat close handlers removed their DOM, then cleared the saved sheet and saved again. They now remove DOM and listeners on disposal, but leave user state and focus alone. The guarded completion callbacks either return or settle the waiting king picker without saving a close. Normal Close keeps its previous behavior.

Profile now stops and invalidates its request number. Its held reads, error/finally handlers, badge controls and Unblock continuation check the existing closed state. Join has the same stopped/closed guard for preview, its changed-code continuation and its send reply. No late screen can start another call after stop.

## Evidence

- Source base: `994ad725` in the isolated `staging/u06-content-catalog` worktree.
- Before the product change, all 11 focused SDK regressions fail: six sheet states disappear, Profile success writes after close, Profile failure changes the screen, Unblock starts two extra reads, and both changed-code Join cases start another call. Log: `/tmp/kingdown-screen-lifecycle-red.log`.
- After the change, `KINGDOWN_TEST_FILE=tools/plugin-screen-lifecycle.test.ts KINGDOWN_TEST_LOCK_WAIT=180 npm test` passes: full typecheck, 11 tests and 54 artwork checks. Log: `/tmp/kingdown-screen-lifecycle-green.log`.
- The six sheet cases also remount through the SDK and check restoration, then press normal Close and check that the saved sheet clears.
- The focused suite reuses the existing source harness and its real SDK bridge. No compiled build or deploy runs here. Main-task compiled HTTP acceptance and independent review remain open.

## Review corrections

The independent reader found that the king picker must settle its promise on stop. The existing screen lifecycle unit test catches this. The completion callback now runs during disposal; the Cards callback returns before its focus work. The main task also identified that badge Close must clear its saved sheet after ordinary navigation away from Profile. That close handler now checks only stopped/closed lifetime, while Profile reads retain their active-screen checks.

The combined regression run fails before these corrections: 18 pass, the existing picker-settlement test times out, and badge Close on Play keeps the old sheet. After the corrections, `KINGDOWN_TEST_FILE='{src/plugin/screens/lifecycle,tools/plugin-screen-lifecycle}.test.ts' KINGDOWN_TEST_LOCK_WAIT=180 npm test` passes all 20 cases in two files, full typecheck and 54 artwork checks. Logs: `/tmp/kingdown-screen-settlement-red.log` and `/tmp/kingdown-screen-settlement-green.log`. The unit also checks that disposal retains the king sheet and saves nothing extra.

## Integrated acceptance

Compiled `plugin-ui-http` passes on source `9f719633`, run `app-dpkaQp`, in 235.8 seconds. It passes the complete journey and final browser error assertion. The run log and phone/desktop failed-rematch images are retained in the parent project `evidence/staging-shared-mechanics/`. This resolves the focused fault; the U05 parent still owns final staging acceptance.
