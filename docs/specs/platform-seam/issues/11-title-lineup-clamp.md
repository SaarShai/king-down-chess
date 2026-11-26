# The title lineup draws the Ogre shorter than the Rook

Status: wontfix. The lead decided on 2026-11-26: the lineup is on the title of the old board, which few players see since the launch page; no assertion is red.

Class: A (CSS of one screen). Size: S.

Source: ticket [10](10-red-by-name-checks.md), `layout-title`.

## Problem

- Commit c28aea3a7 replaced the piece pictures with pictures that are cut to their painted pixels. Some are now wider than before.
- The lineup image has `height: calc(var(--fig) * var(--h)); width: auto; max-width: 118%; object-fit: contain` (`src/style.css:600-601`). The `--h` values in `index.html:109-120` are from the old pictures, which were all 320 px tall.
- A wide picture meets `max-width: 118%`, and `object-fit: contain` then draws it shorter than its box. At 1280 × 800 the Ogre box (`--h:1`) is 96.95 × 112. The picture is 294 × 304, so it draws about 100.3 px tall. The Rook box (`--h:0.96`) is 96.95 × 107.52. Its picture is 260 × 285, so it draws about 106.3 px tall.
- So the Ogre, which `index.html:106` says the lineup sizes "as they stand on the board", draws shorter than the Rook.

## Evidence

- The box sizes are from the `layout-title` log of the run seam-ci-JEzQZz and from the green run in ticket 10. The picture sizes are from `sips` on `public/ui/pieces/ogre-w.webp` and `rook-w.webp`.
- No assertion is red: `layout-title` measures the boxes, not the drawn pictures.

## Open question

Is this a fault, or is the new look correct? If it is a fault, the repair changes the `--h` values or `max-width`, and the `layout-title` baselines change again.
