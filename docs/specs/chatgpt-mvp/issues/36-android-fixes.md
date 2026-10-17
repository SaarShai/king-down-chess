# 36 Android bar targets and landscape end card

Status: claimed
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

T-B and final checks are in work.
