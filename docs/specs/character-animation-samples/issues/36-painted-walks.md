# Painted walks

Status: ready-for-agent

## Plan and checks

- List every army, character and direction. Count distinct painted frames.
- Keep the catalog placement and timing. Match each figure to its shipped rest with one transform.
- Add move-only gates and runtime playback. Keep the other bank rules and assets intact.
- Render the complete review page and game captures. Compare the eight reference rows.
- Run focused tests, both browser checks and the Vercel checks. Record the results before a pull request.

## Findings

- Ten Ogre cells have four frame slots but only three distinct frame hashes. The four-pose rule excludes them.
- The catalog includes timings other than 160 and 80 ms. Preserve the recorded timing for each frame.
- The source inventory has 196 ready, 66 thin, six empty and four missing cells.
- The owner ruling keeps source order and removes the seam gate. Record the seam and inner steps in the preview and PR.
- The source comparison has 196 rows. It includes the earlier rebuild and the available Knight and Bishop J studies. The page is not a game capture and does not use the final shared rest transform.
- The source frame hashes and times match all eight reference rows. This does not check final game placement.
- The 800 ready frames use 80, 120, 140, 160, 180, 200 and 240 ms holds. None has the hash of a shipped idle or turn endpoint.
- The catalog supplies numeric placement for 712 frames. The Paladin provenance file supplies it for 64 more. The 24 Ogre transforms are recovered from the retained source crops. Each recovered transform reproduces its registered frame pixel for pixel.
- The runtime has a move-loop sampling path. It holds each frame to its recorded time and repeats during travel. The Knight keeps its existing jump. The builder does not yet publish move banks, so this path is not active in the game.
- Measured stand frames and shipped rests for all 30 character and army pairs with ready walks. The shared transforms match the rest height and ground in the measurements.
- A candidate catalog holds 196 move banks and 800 frames. The move checks pass for source hashes, order, times, stand exclusion, placement and source motion ranges. The catalog is in the run folder.
- The eight reference banks retain their hashes and times. A direct comparison with the reference renders, after one scale and offset, has at most 0.801 px head or ground error. An independent comparison to source bounds reaches 1.008 px on one Pawn frame because the two raster edge measurements differ.
- The package builder accepts move banks and checks their timing, direction, pivot and alpha. Painted walks take priority over older movement banks. Focused package, playback and move-gate tests pass.
- The public package, game captures, final preview and required browser and Vercel checks remain open.
