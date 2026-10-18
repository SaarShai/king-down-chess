# 43 PR 61: motion checks under load

Status: resolved

Scope: the motion group in the PR 61 CI ticket. Base: `5957300f`.

## Plan

1. Run the two test files with the supplied CPU slow-down at 4.
2. Find the event that each failed check must observe. Fix product faults in the product.
3. Keep the check intent, time limits, and browser coverage.
4. Run each fixed check three times at CPU 4 and once at full speed. Run type and doc checks. Commit the fix.

## Checks

- Use `npm test` and its shared test lock.
- Capture short motion states in the page before the action starts.
- Use state or message completion for navigation and reply waits.
- Record the failure and pass counts here before completion.

## Cause and change

- The deal and king-turn checks read short motion states across browser calls. A slow call can return after the motion ends. `watchMotion` records each state in the page. It starts the watch before the action. It also runs before a fresh widget starts. The checks still require all eight deal classes, one king turn, motion completion, and no replay on remount.
- The live-win check reads the ceremony and Skip in separate calls. The ceremony can end between them. The check now records the open card, visible Play again and New game buttons, visible Skip, and ceremony in one page event. It records the words when they show. The 1,500 ms opening check uses the page clock.
- The end-action checks stop the clock after the result opens. Under load, the one-second tap guard can end first. The checks now stop the clock before Send and step it until the end card opens. They still press at the guarded time and after the guard. A square selection is synchronous, so its fixed sleep is removed.
- The source-page checks start a five-second control wait while the source module can still load. They now await the module before the control wait. This covers the home and Resume checks.

## Failure evidence

The saved base tests run at CPU slow-down 4 through the project test lock: 5 fail and 22 pass. The failures are the chat deal on the current widget, live end actions, New game, the live deal, and the deal after the empty hall remount. The supplied sweep logs also show Play again, the king turn, and the source-page mount failures.

Local logs: `dist/motion-ci/before.log` and `dist/motion-ci/`. The slow-down preload uses this worktree's Playwright copy. Both test files print the CPU 4 confirmation. The preload and base test copies are local check files only.

## Verification

Each run uses `npm test` through the project test lock. Both browser files run in full. Each run also passes the type check and all 51 drawing tests.

| Mode | Browser checks | Drawing checks | Browser test time |
| --- | --- | --- | --- |
| CPU 4, run 1 | 27/27 pass | 51/51 pass | 113.23 s |
| CPU 4, run 2 | 27/27 pass | 51/51 pass | 114.31 s |
| CPU 4, run 3 | 27/27 pass | 51/51 pass | 110.91 s |
| Full speed | 27/27 pass | 51/51 pass | 48.82 s |

`npm run test:docs` with the file filter clear passes all 160 checks in 13 files. `git diff --check` passes.

The 19 motion checks and 8 join/review checks keep their time budgets and browser coverage. The manual clock wait uses the page's existing 15,000 ms budget. The diff changes test code only. It adds no dependency.

The commit hook uses missing local scan inputs to obey the no-read rule for secret files. Secret-value matching does not run. The type, path, size, and message checks run. Full CI is outside this group.
