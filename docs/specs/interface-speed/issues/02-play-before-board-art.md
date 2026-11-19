# Draw the board before it takes input

Type: task

Status: ready-for-human

## Fault

Launch playtest finding 1. A new game shows coordinates and accepts moves while the board canvas is hidden. A five-second delay to the figure stills reproduces the fault on phone WebKit.

The game can show as soon as Versus ends. The scene waits for the stone image and all figure stills before it draws. These two paths do not use the same ready state.

## Repair

In a local web game, the scene draws plain squares and lettered pieces while the art loads. Each image replaces its fallback when it is ready. A failed image leaves a playable board. The first board frame comes before the grid takes input. The clock and the computer's first move still wait for that frame and the end of Versus.

Use the scene's plain squares and lettered pieces. Keep the existing art wait for the old page, the app and online games.

## Checks

Run the art check with delayed and failed art in fresh phone and desktop sessions. Check Cards Off and On, with Figures and Symbols. Take and inspect pictures. Check game start, save, settings and rematch.

## PR 393 review repair

Keep the letters until the correct still or runtime frame can draw. Wait for a full image and its decode before a sheet can enter the sprite cache. Hide failed portraits, emblems and card art in the game.

In Chromium, send the Rook sheet in two parts. Check that the four letters stay when the sheet gives its width, when the sheet is complete and while the stills decode. Check that the four stills then draw. In the failed-art cases, check that the game hides the failed pictures.

The stream check and the 16 delayed or failed art cases pass. The type check, 534 play tests, 282 render tests and the save browser check also pass.
