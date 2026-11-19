# New game panel feedback

Status: resolved

Use the You page switch in the Powers and Cards boxes. Open the king and card panels from their pictures and titles.

Use a checkbox for each piece. Draw the check when the player adds a piece. Use the card as the selection control. Show a brass frame and a soft glow on a selected card. Keep the minimum pool sizes.

Keep the opponent as a shadow until the player selects a king. Let the player select the opponent's king and power or use a random deal. Keep the invitation controls and the New game history entry.

Check the Daylight page on a 390 × 844 phone and a 1280 × 800 desktop. Save the WebKit pictures and the results in `runs/launch/fb-newgame/` next to the game repository.

## Results

WebKit starts a game with the selected opponent and a game with a random opponent. The saved games contain the correct king choices. The phone check covers both pool limits, both animations, reduced motion, touch, the keyboard and browser Back.

The report is `runs/launch/fb-newgame/newgame.md`. The final pictures are in its `after/` folder.
