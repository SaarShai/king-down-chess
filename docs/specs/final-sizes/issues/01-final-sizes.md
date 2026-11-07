# Final character sizes

Status: ready-for-human

The owner set the last sizes: Pawn x.85, Maester x.75, Knight x1.15, Queen x1.1, Beast x.8, Bishop x1.1, Guard x.95, Ogre x.85.

## Plan and checks

- [x] `HEIGHT` and the scene scales carry the new sizes. No bank in the manifest has `boardScale`, so every body bank uses `HEIGHT`.
- [x] Walk strides and the Knight's contact correction, which were measured at the old sizes, follow the figure.
- [x] The bounds of a ranged victim use the victim's own scale, not the King's.
- [x] Focused tests pass. One real game page plays a walk and a capture for each character. A Guard cannot capture: it walks, and a King takes it.

## Results

- `src/render/**` tests pass (focused, not the full suite).
- The page draws each character at one height in all its idle, turn, walk and attack frames.
- Every melee weapon lands on the victim for all sizes of victim. The Ogre S worst case goes from 15 to 17 board px from a Pawn's outline.
- The sample is `moves.gif`, outside the repository (`~/kd-runs/final-sizes/`).
