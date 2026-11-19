# Two web app repairs

Type: task
Status: resolved

- Keep the New game choices when the player closes invite sign-in. Return to the main New game panel.
- Put the save warning and its load button above the move history when another tab changes the save.

## Answer

On the base commit, Not now and browser Back close New game and discard its choices. The X keeps the choices. The save warning is cut off at both sizes and overlaps the history on desktop.

Chromium at 1280 × 800 and WebKit touch at 390 × 844 confirm the two repairs. The checks keep the draft after all three dismissals, confirm that direct sign-in returns to Home or You, and load the newer game from the warning. The checks use the light theme and a fake account service.

Type checking and 287 focused tests pass. The home, new-game, next-save, and daylight-tabs browser checks pass.
