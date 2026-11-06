# King demise

Status: ready-for-human

A beaten king tipped as one flat sprite, with an ease that slowed him to a stop at the floor, and his effects only faded. It did not read as the end of a game.

## Plan and checks
- [x] The body bends as it falls, from the feet up, then a slam and a small rebound. Check: fx-fallen.test.mjs, fake-clock sheets.
- [x] Each king theme has its own aftermath; dust takes a colour by the floor under it. Check: sheets on light and dark tiles, both armies.
- [x] End state and game timing do not change: from 650 ms he is the plain rotated figure. Check: `check:browser end`, fx-fallen.test.mjs. (`w6-parts` times out before its first step, at the base commit too: it never steps its fake clock while it waits for `view.ready()`.)
- [x] Fast halves it; no animation shows the end at once. Check: scene-load test.
- [x] A Paladin that dies with his target falls and fades, not only fades. Check: fake-clock sheet.

## Comments
The frost, shatter and apart paths in `drawPiece` stay as they are. They run only with no themed capture or no painted Maester attack, so a game with motion on does not reach them when the art has loaded.
