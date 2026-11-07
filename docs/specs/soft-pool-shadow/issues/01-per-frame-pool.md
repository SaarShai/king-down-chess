# Soft pool for each character, facing and frame

Status: ready-for-review
Type: task

The owner saw four shadow options on a mock board and chose the soft pool: "soft pool, but it needs to be adapted
properly for each character and its angle, and also for their walking and turning."

## What changes

- One soft oval replaces the contact shadow on the painted board: no dark band, no leg smear. The floor-darkness mix,
  the multiply draw and the shared light direction stay. A figure in the air keeps an oval that lightens as it rises.
  A figure that tips over or lies on the floor keeps its pool under the body.
- `tools/build-character-footprints.mjs` reads the alpha of each runtime frame once and writes
  `public/character-runtime/footprints.json`: width, centre, depth, tilt and baked height per frame, in bank pixels. The
  game looks up the frame on screen and reads no pixels while it plays.
- The manifest and the catalog do not change. The table loads beside the manifest as a startup file and not in the first
  page payload.
- A frame not in the table has its character's standing pool. Without the table, a figure has its still sprite's pool.

## How the pool follows the figure

- `footprint` keeps the touch and firmness logic of the old `shadowField`, and adds three rules. A level that only a
  thin part reaches does not set the sole. A run of columns thinner than a limb has no weight. The lower body limits the
  width and the centre.
- A walk has only four poses, and they differ much. The tool gives each walk one stable pool (the width of its
  planted poses) with a gentle breath.
- A turn goes straight from one facing's footprint to the next.
- Other banks follow the feet over a 90 ms window. In a leap's air frames the pool waits between take-off and landing.
- `glidePool` moves the drawn pool to its target over about 70 ms, per square. Bank joins, a missing frame and the table's
  late arrival do not pop.
- All lengths are fractions of the figure's height or of the square. The figure's size reaches the pool through
  `bankScale` and the spec scale.

## Check

- Focused: `src/render/painted/contact-shadow.test.mjs`, `src/render/character-runtime.test.ts`,
  `tools/offline-build.test.ts`, `tools/character-runtime-package.test.ts`.
- Eye: real game pages on light stone and dark wood, in `~/kd-runs/soft-pool/` (`board.png`, `moves.gif`).
- As the owner directs, no independent review ran.
