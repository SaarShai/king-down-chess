# Daylight sign-in and tabs

Status: resolved

- Put Sign in first in You and add a quiet Sign in control to Home.
- Open the account choices directly. Return from a provider to You.
- Keep the Play, Guide and You tabs active in the New game panel and its Opponent sheet.
- Check the account paths with a fake service and test tab taps in WebKit and Chromium.

## Results

- Account stays first in You. The Home control is at the upper right. Both controls open the same sheet.
- A provider return opens You. The Account section shows the name and Sign out, or a retry line after a failure.
- The tab bar moves inside the New game dialog. A tab closes the dialog and removes its history layer. The full phone tab cell includes the bottom safe area.
- The type check and 867 selected tests pass. The Daylight check passes in WebKit at 390 × 844 and Chromium at 1280 × 800. The sign-in speed, web game, staging web game, and web online checks pass.
- The lane report and 14 phone pictures are in `runs/launch/fb-signin/` beside the game repository.
