# Three web app repairs

Type: task
Status: resolved

- Show help for the selected starting arrangement.
- Use “Turn” for the current number on Home; the result keeps “moves”.
- Move the keyboard focus when the player selects a different power with an arrow key.

## Answer

Type checking and 184 focused tests pass. The `home`, `new-game`, and `next-save` browser checks pass. The `next-menus` case `home_piece_close` passes at both sizes. The `panel` and `menu` cases give the same failures on the base commit.

WebKit at 390 × 844 and Chromium at 1280 × 800 confirm both help lines, the two count labels, and the keyboard focus. The light-theme pictures show each repair.
