# 36 Android bar targets and landscape end card

Status: resolved
Branch: claude/android-fixes
Base: 4692477c

The owner asks to build F9 and T-B from ticket 36 in the task scratch folder.
The owner asks to skip the Android emulator check. The main session runs it after merge 5.

## Plan and checks

1. Add built-page checks to plugin-ui. Use the same hitSizes function as the iOS size tests.
   Commit the checks with no product change. Show F9 and T-B failures against base product code.
2. Add the 4 px bar padding on both touch paths. Keep each button box at 44 px.
   Check all three bar targets, Moves, frame limits and board sizes.
3. Add a separate compact end-card block for short landscape. Keep the narrow-screen rules.
   Check the first view and all three actions for wins and losses at the ticket sizes.
4. Run npx tsc --noEmit, npm test and plugin-ui through the lane check runner.
   Record the results here. Commit each product part. Do not push, merge or deploy.

## Results

- Red check: 6bb694ae. Product CSS matches 4692477c. The lane runner exits 1 on this Mac.
- F9: bar targets measure 44 px at 412 x 790 and 393 x 852 in both card states.
  Moves measures 49 px. The 320 x 568 layout hides Moves before this change.
- T-B: at 870 x 280, win/loss cards open at scroll positions 225/218 px.
  The title and result are out of view in both cases. Other short landscape sizes also fail.
- Baseline board widths: 352, 345, 113 and 536 px at widths 412, 393, 320 and 1280.
  The new check permits a loss of at most 4 px.
- F9 adds 4 px above the bar buttons on both touch paths. The 44 px boxes stay.
- Test fixture repairs precede the red check. The fixture uses the current create tool,
  fullscreen before routing, a real Ready action and the returned board ID.
- The red log is checks-red-6.txt in the lane scratch folder. The detailed log is
  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/android-fixes-KoL8OO/plugin-ui.log.

- The first fix check passes F9. Phone board widths become 348, 341 and 109 px.
  Desktop stays 536 px. Moves stays 49 px where it shows. Each bar box stays 44 px.
- The proposed T-B block alone fails. At scroll top 0, Play again ends at 211 px
  in a win and 185 px in a loss, inside a 160 px card. This is a content-size fault.
- T-B also reduces card padding to 12 px and removes the margins between the first
  words, title, result and actions. Status messages follow the actions. Text and
  action sizes stay. The narrow portrait block stays unchanged. No focus code changes.
- Taste choice: use less space between items in short landscape. Keep all words
  and type sizes instead of removing the win words.

- npx tsc --noEmit passes after the final code change.
- plugin-ui passes on this Mac at 4c4e594d in 137.6 s. The lane runner exits 0.
  All F9 cases pass. Win and loss open at scroll top 0 at 870 x 280, 740 x 360
  and 844 x 390. The title, result and Play again fit on every edge. All actions
  fit inside the card and frame and receive a centre hit after a scroll.
- The 197 x 426, 320 x 568, 393 x 852 and 1280 x 800 end-action checks pass.
  The existing narrow-screen block stays unchanged. Moves remains hidden at 320 x 568.
- The old tall-phone bar-box check now expects [0,708,393,48], as F9 requires.
  Every other measured box in that check stays unchanged.
- Visual check: both 870 x 280 images show the title, result and all three actions.
  The images are ticket36-end-win-870x280.png and ticket36-end-loss-870x280.png
  in /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/android-fixes-7Ch5Fr/plugin-ui/.
- The browser log is checks-final-1.txt in the lane scratch folder.
- Full npm test uses the lane's local test database. It ends with 186 passed files and
  2 failed files: 3046 passed tests, 5 failed tests, 1 expected failure and 8 skipped tests.
  Four size checks use the old seat widths or floors. The fifth failure is the unchanged
  workshop judge test's 30000 ms time limit. No time limit changes.
- The size checks now permit the same 4 px portrait change as F9. Exact seat widths
  change from 218 to 214 px and from 384 to 382 px. Exact board widths are 109 and 341 px.
- The focused npm test run passes: 30 size tests, 12 workshop judge tests and 51 motion tests.
  Its log is tests-focus-1.txt. Both files pass within the original time limits.
- The final full npm test run passes at 1d029396 in 273.02 s: all 188 files pass.
  It records 3051 passed tests, 1 expected failure and 8 skipped tests. All 51 motion
  tests also pass. The run exits 0. Its log is tests-final-1.txt.
- No time limit changes. The workshop judge passes in the focused run and the final full run.
- Only test expectations and this ticket change after the passing browser commit.
  The application CSS and browser check code stay the same.
- The red and green browser detail logs and both end-card images are also copied to the lane folder.
- No server code changes. plugin-ui-http is not required.
- The Android emulator check is not run, as the owner asks. The main session owns it after merge 5.

All ticket parts are built and checked. Both fixes use CSS only. The Android emulator
check stays with the main session after merge 5, as the owner asks.
