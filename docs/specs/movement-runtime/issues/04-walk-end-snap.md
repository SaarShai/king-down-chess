# Walk end snap

Type: task
Status: resolved

## Fault

At the end of a painted walk the figure stops short of its square. On the next frame the rest pose stands on the square, so the figure jumps. Example: Rook d4 to d2, 12 screen px; Ogre d4 to e5, 15 screen px.

## Cause

`paintedTravel` (src/render/painted/gait.mjs) mixes the linear path with a path held at the start of each pose. The held path got to the square only at the end of the walk clock. The last pose starts before that, so the held half stayed short by one pose step until the end frame.

## Fix

The held path reaches the square at the start of the last pose that stays on screen for two or more 60 fps frames (`LAST_POSE_MS`). The pose steps before it grow by the same ratio. The rule reads the frame list, so it works for any pose count (4-pose and 16-pose banks).

## Checks

- `src/render/painted/gait.test.mjs`: the last 60 fps frame of a walk is short by the linear half of one frame only, for 4, 6, 8 and 16 poses.
- Browser trace, Chromium 1280x900, 168 walks (every walk kind, all 8 facings, both armies, 6 king designs): end jump worst 19.7 to 1.8 screen px, mean 6.2 to 0.8. Pose steps inside the walk grow: mean 11.9 to 13.6 screen px. Table: `~/kd-runs/checks/walk-end-snap/end-jump-table.txt`.
