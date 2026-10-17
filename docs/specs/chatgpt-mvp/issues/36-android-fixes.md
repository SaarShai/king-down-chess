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

- The first fix check passes F9. Phone board widths become 348, 341 and 109 px.
  Desktop stays 536 px. Moves stays 49 px where it shows. Each bar box stays 44 px.
- The proposed T-B block alone fails. At scroll top 0, Play again ends at 211 px
  in a win and 185 px in a loss, inside a 160 px card. This is a content-size fault.
- T-B also reduces card padding to 12 px and removes the margins between the first
  words, title, result and actions. Status messages follow the actions. Text and
  action sizes stay. The narrow portrait block stays unchanged. No focus code changes.
- Taste choice: use less space between items in short landscape. Keep all words
  and type sizes instead of removing the win words.

Final checks are in work.
