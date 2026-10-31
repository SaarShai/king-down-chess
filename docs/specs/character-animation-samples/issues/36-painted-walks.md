# Painted walks

Status: ready-for-agent

## Plan and checks

- Round 5: measure stride and fit each walk bank to its facing. Add build gates and a reproducible catalog promotion. Remove unused banks. Fix the missing-turn fallback and turn handoff. Refresh the game preview, run the requested checks, and update PR 236.
- Round 4: use a flat gait for selected painted walks, with one cycle per square and a 1,600 ms cap. Test special moves and the old gaits. Record game-size and enlarged views. Run the requested checks and update the pull request.
- List every army, character and direction. Count distinct painted frames.
- Keep the catalog placement and timing. Match each figure to its shipped rest with one transform.
- Add move-only gates and runtime playback. Keep the other bank rules and assets intact.
- Render the complete review page and game captures. Compare the eight reference rows.
- Run focused tests, both browser checks and the Vercel checks. Record the results before a pull request.

## Findings

- Round 5 work in progress: travel uses catalog stride and caps cadence at 2×. The catalog marks some stride values as draft. The Knight and Paladin keep their leap and charge; their 32 unused walk banks leave the package. A missing turn route uses the old motion. The walk starts after the outward turn endpoint.
- A selected painted walk uses flat, linear travel. Its time follows the catalog stride, up to 1,600 ms. The pose rate rises to at most 2× when the cap applies. Stratus hover stops during travel.
- Captures keep their attack. A two-square pawn move uses its stride and the time cap. Promotion follows the pawn's arrival. Castling moves the king; the rook changes square with the position update. Knight and Paladin keep their own moves.
- Each of the 164 shipped walk banks has one direction transform. The median silhouette height, ground and centre match its facing endpoint in the offline measurement. The before and after table is `r5-fit-report.json` in the run folder.
- From the catalog stride values, the white pawn N, queen SE, rook E six-square and queen NE five-diagonal skate ratios change from 1.25, 3.14, 3.75 and 6.29 to 1.00, 1.00, 1.88 and 3.14. The last two reach the rate cap. These are estimates, not contact measurements.
- Ten Ogre cells have four frame slots but only three distinct frame hashes. The four-pose rule excludes them.
- The catalog includes timings other than 160 and 80 ms. Preserve the recorded timing for each frame.
- The source inventory has 196 ready, 66 thin, six empty and four missing cells.
- The owner ruling keeps source order and removes the seam gate. Record the seam and inner steps in the preview and PR.
- The source comparison has 196 rows. It includes the earlier rebuild and the available Knight and Bishop J studies. The page is not a game capture and does not use the final shared rest transform.
- The source frame hashes and times match all eight reference rows. This does not check final game placement.
- The 800 ready frames use 80, 120, 140, 160, 180, 200 and 240 ms holds. None has the hash of a shipped idle or turn endpoint.
- The catalog supplies numeric placement for 712 frames. The Paladin provenance file supplies it for 64 more. The 24 Ogre transforms are recovered from the retained source crops. Each recovered transform reproduces its registered frame pixel for pixel.
- The runtime holds each move frame for its recorded time and repeats the loop during travel. The Knight keeps its existing jump.
- Measured stand frames and shipped rests for all 30 character and army pairs with ready walks. The shared transforms match the rest height and ground in the measurements.
- A candidate catalog holds 196 move banks and 800 frames. The move checks pass for source hashes, order, times, stand exclusion, placement and source motion ranges. The catalog is in the run folder.
- The eight reference banks retain their hashes and times. A direct comparison with the reference renders, after one scale and offset, has at most 0.801 px head or ground error. An independent comparison to source bounds reaches 1.008 px on one Pawn frame because the two raster edge measurements differ.
- The package builder accepts move banks and checks their timing, direction, pivot and alpha. Painted walks take priority over older movement banks. Focused package, playback and move-gate tests pass.
- The WebP package has 674 banks and 6,221 assets. It adds 196 move banks and 800 frames. The package grows from 124,537,245 to 145,737,672 bytes. All 478 earlier banks and the effects stay exact.
- A package check passes for the source hashes, frame times and transparent borders of all 800 move frames. The aligned gallery has 196 rows, lists 76 cells without a walk, and has 34 game moves in 17 recordings.
- `npm run build:vercel` and `npm run check:vercel` pass with a local test database. Chromium `character-runtime` and Chromium and WebKit `web-online` pass. The character check waits for the rest frame and checks the turn handoff to the walk.
- [Pull request 236](https://github.com/SaarShai/king-down-chess/pull/236) carries the change. Its checks record CI status.
