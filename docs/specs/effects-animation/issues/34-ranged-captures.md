# Ranged captures: the Maester's ray and the Archer's arrow

Status: ready-for-review
Type: task

The owner asks for stronger effects and fitting deaths. Before this change, the published beam showed for 100 ms at about 8 px wide, the arrow was a few specks at game size, and each victim faded in 180 ms.

## Change

- New module: `docs/2d-first-pieces/board/fx-ranged.mjs`. All values are functions of the attack clock, so Fast, a flipped board and a rewind need nothing more. Reduced motion keeps the slide and the fade.
- Maester: the body holds the painted release frame for 240 ms more. The ray starts at the `ocular` anchor, reaches the victim 30 ms after release (the contact stays there), scans it down and up, then the victim comes apart into motes of light from the top down. He steps in after the last mote. The action is 1510 ms, was 1270 ms.
- Archer: the published arrow draws larger, with a trail. It lands at the chest, stays in the body, and the victim flashes, staggers, falls away from the shot, raises dust and fades. The action ends 620 ms after contact, about 1260 ms; it was 850 ms.
- The published effect modules and their art do not change. The ray and the lodged arrow draw through them.
- The fallback without painted attacks uses the same ray, dissolve and fall.

## Limits

- The painted nocked arrow stays in the Archer's frames while the separate arrow travels. A repaint of the attack frames is the only fix.
- The victim falls as one rigid figure. No victim has painted death frames.

## Evidence

`~/kd-runs/fx/ranged/before-after.gif` and `before-after.png`.
