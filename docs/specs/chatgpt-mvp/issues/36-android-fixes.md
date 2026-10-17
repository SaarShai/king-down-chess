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

Checks are in work.
