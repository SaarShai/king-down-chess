# Redesign polish 2

Status: resolved

Decision: decided by delegation (2026-10-09).

## Plan and checks

1. Check focused Motion and row cuts in the Menu browser check before each fix.
2. Record badge arcs in a unit test. Keep badges inside tiles and digits readable. Check web frame order and plugin defaults.
3. Test the Rescue detail with a named pawn. Remove the old exception note in ticket 30.
4. Run npm test, the full browser suite, and both plugin checks. Record page bytes.
5. Render W2 and W4. Require zero faults. Compare each still with polish and inspect each changed still.
6. Check the diff, commit, and push with the test hook.

Pass criteria: all listed fixes have checks; all checks pass; every changed still has an item; the push succeeds. Workshop and main.ts stay fixed.

## Evidence

- The focus check rejects the old CSS. The scrolled resize check rejects the old row math. All three clean menu-extra runs pass.
- Unit checks reject the old badge radius, web frame order, and named Rescue detail. The new checks pass. The arc bounds reject a positive corner offset. The plugin size, place, and order stay fixed.
- npm test: Test Files 96 passed, 1 skipped (97). Tests 1738 passed, 13 skipped (1751). Scene tests: 50 pass, 0 fail. Typecheck passes.
- npm run check:browser: all 25 passed. Both plugin checks pass: plugin-ui 14.6 s; plugin-ui-http 15.3 s. The first HTTP check lacks its database setting; the rerun uses the documented disposable database after schema init.
- Plugin page: 4,296,101 bytes before; 4,296,133 bytes after (+32).
- W2: 68 renders, 0 faults. W4: 48 renders, 0 faults. Repeat captures of the same build also have zero faults. Preview PID 56812 is stopped.
- All 116 stills have peers in polish. Six product stills change: W4 bites-1-and-2 and four-bites at phone and smallPhone (item 3), and desktop (item 4). All changed stills and badge crops are inspected.
- The other 22 raw pixel differences are raster or figure-edge capture variation (item 8). A repeat of the same build also shows these differences. Words, controls, tile geometry, and board states match. No other product change is found.
- Every changed still has its item in the comparison report. Reports: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/f713c296-a557-4c06-99e1-90ecc1f52371/scratchpad/polish2-render-comparison.md` and `polish2-pixel-diff.json`. Renders: the same scratchpad's `build/samples/polish2/`.
- Logs: `/private/tmp/polish2-tests.log`, `polish2-browser.log`, `polish2-plugin-final.log`, and `polish2-menu-repeat.log`. The normal push runs the test hook.
- The fix uses the existing Menu layout and opt-in web drawing path. No dependency, rule, main.ts, Workshop source, or W12 sample source changes. The diff check passes against deb61ce.

Review fix (decided by delegation, 2026-10-09): the independent check found that the web pointer frame now drew before the gold "Show me" hint, so on a phone the hint hid the keyboard cursor frame (WCAG 2.4.7). The web board now draws the hint, then the pointer frame, then the bite badges; the plugin keeps its order. `src/render/marks.test.ts` checks both orders.
