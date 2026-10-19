# 30: plugin-ui passes on WebKit again

Status: built; final checks pending

The ChatGPT iPhone app shows the widget in WebKit. tools/lib/checks.mjs can launch WebKit (7f3de41f, b1d69f7d: PLAYABLE_BROWSER=webkit), but no lane ran plugin-ui on WebKit after those commits. On the release candidate (94dde1a2) the WebKit run fails at tools/lib/plugin-cards-check.mjs:82 (checkCardChoices, from od-end): it waits 30 s for `#menu-sheet input:focus`, and the focus never comes. Log: scratchpad/lanes/release-candidate/webkit-base-1.txt.

## Parts

1. Run plugin-ui on WebKit through the check runner: PLAYABLE_BROWSER=webkit <scratchpad>/check-runner.sh <worktree> <m1 folder> plugin-ui. Fix each failure at its cause, one at a time, until the WebKit run passes.
2. For each failure, decide: a product fault (the widget does the wrong thing on WebKit: fix the product, with a unit or browser test), or a check that assumes Chromium behaviour (for example, WebKit does not focus a button or a radio on a click; Safari's focus rules). A check fix must keep the check's intent on both engines; never delete an assert to get a pass, and never raise a time limit.
3. Chromium plugin-ui and plugin-ui-http still pass at the final commit.

## Out of scope

The S5 client-state merge (it joins the release candidate later; its WebKit run comes after that merge).

## Plan and checks

1. Run the unchanged release code on WebKit through the approved runner. Record each failure and its cause.
2. Fix each product fault or browser-specific check assumption at its source. Keep each assertion and each time limit. Add or extend a test for each behaviour.
3. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit the changes on `claude/webkit-rc`.
4. Run WebKit `plugin-ui` until it passes. Run Chromium `plugin-ui` and `plugin-ui-http` at the final commit. If the known 400 px end-card flake occurs in unchanged code, repeat once and record both runs.
5. Record each cause, fix, test, checked head and final runner exit line under `30 result`. Write the complete report to the lane report file.

Pass criteria: each required command exits 0; each browser log has the final runner exit line; the final code commit passes both browsers; no requested part is omitted without a reason.

## 30 result

### Parts 1 and 2: WebKit and the focus check

- The unchanged release code at `535949dc` fails on the M1 at `plugin-cards-check.mjs:82` after 53.4 s. The final runner line is `check-runner: M1 exit 1 at 535949dc`. This head adds only this ticket to `94dde1a2`.
- Cause: a Chromium-only check assumption. The checkbox pointer click gives no keyboard focus on WebKit. The host-refresh check tries to read an input with focus before it has set focus on one.
- Fix: set keyboard focus on Haste before the refresh. Add an assertion that Haste has focus. Keep the existing assertions for sheet identity, focus retention, the unsaved card draft and the saved pool. No product code or time limit changes.
- The first fixed M1 run passes Cards and reaches the later board checks. It hits the unchanged 420 s total limit. A timing run also hits the existing 5 s held-computer wait. Shorter diagnostic action limits expose delays in Playwright's stable-target wait. Three equal target bounds confirm that the sampled target does not move.
- The probes compare image capture, plain button clicks, page activation, frame layers and native frame callbacks. None provides a complete M1 fix. Remove all probes. Keep the timing failure as an M1 runner limit; do not infer a product fault or hide it with a larger time limit.
- Run the same code through the approved runner on this Mac with `KD_RUNNER=mac`. WebKit `plugin-ui` passes in 242.5 s at `43ce25e6`. Final line: `check-runner: mac exit 0 at 43ce25e6`. All setup, seat, lobby, board, focus, retry, remount, target, viewport and error assertions pass.
- Test: the new pre-refresh focus assertion and the existing post-refresh focus, draft and save assertions pass on WebKit. The full browser check remains the behaviour test for this repair.

### Part 3: final checks

- `npx tsc --noEmit` exits 0. Full `npm test` with the specified local database exits 0: 188 files, 3,039 passed tests, one expected failure and eight skips. All 51 drawing tests pass. Logs: `typecheck-1.txt` and `tests-1.txt` in the lane folder.
- The source at `43ce25e6` matches the tested fix at `dba683bb`. The focus repair has three check lines and this ticket. The end-layout repair below follows the next browser runs. It adds no dependency, helper or product path.
- Run the final type check, full tests, WebKit `plugin-ui`, Chromium `plugin-ui` and Chromium `plugin-ui-http` after this evidence commit. The exact final head, exit lines and logs go in the external ticket and `30-webkit-build.md` in the lane folder. No source change follows those checks.
- No requested product part is omitted. The M1 timing fault remains unresolved; WebKit passes on this Mac. No taste choice is needed. The client-state merge stays out of scope.

### Failure 2: end layout reads the win text during its scale

- Class: check timing assumption on both engines. `#over` opens while the short king-fall sequence still runs. The win text starts at scale 1.08 and ends at scale 1. The old check reads the table scroll width during this scale.
- Control at `a4fc24a2`: Chromium `plugin-ui` on the M1 fails at 360 px after 143.9 s. It reports `kd-words is-in`, table scroll 370/360, and text bounds about -10 to 370 px. The one repeat passes in 161.1 s. The width differs from the owner's reported 400 px flake. Keep both logs.
- WebKit on this Mac fails at the same 360 px read after 209.5 s. Its text bounds are about -9 to 369 px. This confirms that the check race affects WebKit too.
- Fix: after the end card opens, wait for the board to clear `data-toppling`. Assert that the win text is gone, then run every existing viewport and scroll assertion. Use the product's existing sequence state, with no fixed sleep and no time limit change.
- Test: extend the existing king-fall test with Skip and Finish cases at 360 px. Both must keep the fall running when the result opens, then clear the state and the win text and leave no sideways overflow. The failed browser runs above are the controls for the check repair.
- The queued final full test and HTTP check at `a4fc24a2` do not start. Stop only those two owned process groups before the source changes. They are cancelled queue entries, not failed checks. Repeat all required commands at the new final head.
- No product code changes. No taste choice is needed. Keep all temporary probes removed.
