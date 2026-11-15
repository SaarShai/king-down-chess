# Build the launch shell

Status: ready-for-human

## Source

The owner requests the build. The design project supplies the approved design and scope.
See the design project's `runs/launch/shell/scope.md` and `runs/launch/decisions.md`, decisions 1 to 7.

## Plan

- Reuse the kit bar. Add Guide as a named label option. Use history state for places and game entry.
- Add the online link under setup. It opens `/play`.
- Build one settings group for You and Menu. Keep the existing stored keys and save writer.
- Build four Guide sections. Read pieceGuide, powerText and cardText with the launch rules.
- Use the copy table for each short line. Do not claim inactive chess rules.
- Add the result title, cause and Back to home. Keep Rematch as the main action.
- Complete Lift tabs, moving choice markers and dialog departure. Apply Fast and Off to interface motion.
- Add tests for content, results, history and motion. Check the built flows at all three required sizes.

## Checks

The full suite passes: 6376 tests, 384 existing skips, 114 Node checks.
The skipped-case list equals the prior stage's list. The stage adds 13 tests.
The build and the registered next-save browser check pass.
Chromium and WebKit pass 42 shell browser cases at 360 by 640, 390 by 844 and 1440 by 900.
The browser records zero console errors and zero unexpected failed requests.
The design-project report is `runs/launch/shell/report.md`.
Final logs are `runs/launch/shell/tests.log`, `tests.json`, `build.log`, `next-save.log` and `browser.json`.
The documentation check log is `runs/launch/shell/docs.log`.

## Built details and limits

- One settings builder serves You and Menu. Existing keys and the save writer stay in use.
- The short result uses the opponent strip. All three actions fit above the board.
- Piece rules read pieceGuide. Power and card rules read the current content modules.
- Guide and You can scroll. The game page does not scroll in the checked flows.
- Reload starts at Play. The browser history keeps Guide entries during the same page visit.
- The later learning stage supplies the full diagram panel. This stage shows the full rule in Guide.
- Physical devices, screen readers, Firefox, signed-in play and the full old-page browser suite do not run here.
- The first browser pass finds target width and short-result faults. The final run fixes them.
- A custom temporary path with spaces breaks 49 existing tooling tests. The normal temporary directory restores the pass without a code change.
- The final full suite runs after the last runtime CSS change. No game file changes during it.

## Repair

Both checker reports identify real faults. Their Beast fault is the same fault.
Browser Back releases the pending Versus key handler before board art loads.
Back followed by Forward opens the live game. An old entry cannot clear a new entry's start flag.
The Beast rule says Select End turn to end the chain in Guide and Full rule.
The old shared rule text stays unchanged. End turn keeps its legal-move guard.

Twelve new tests compare piece facts directly with pieceGuide.
One new test pins the Beast control instruction. The existing copy test pins all approved short lines.
The focused deliberate-fault run has four failures: the Beast source check, the Ogre source check, the copy check and the Beast instruction check.
The restored focused run passes all 26 shell tests.
Three deliberate motion faults also fail their intended browser checks: no tab marker, a static choice marker and a static dialog.

The stronger browser checks find a removed marker in the saved reference.
Cleanup now clears that reference. Repeated tab and choice travel start at the previous control.
Both marker-origin checks fail before this fix.
The final repair matrix passes 48 cases in Chromium and WebKit at 360 by 640, 390 by 844 and 1440 by 900.
It records zero console errors, page errors and unexpected failed requests.
The full suite passes 6389 tests, with the same 384 skipped cases. All 114 Node checks pass.
No test is removed, skipped or weakened. No game file changes during the full suite.
The registered next-save check passes.

Evidence is in the design project's runs/launch/shell/repair-checks folder.
The report's Repair section gives each fault, its red check, its fix and its final check.
No new minor fault remains. The earlier accepted long-rule scroll stays in the carry list.
Physical devices, screen readers, Firefox, online play, cutover and the full old-page browser suite do not run in this repair.
No commit, push, pull request or deploy occurs.
