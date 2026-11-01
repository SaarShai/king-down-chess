# Painted walks

Status: in progress

## Plan and checks

- Round 9: replace the measured strides with the checked values in the stride study, and record the study file hash in the selection. Play Archer NW in the order p0, p3, p2, p1 and keep its stride at 0.50. Add the stepped body-travel mix (s = 0.5). Rebuild the package without new WebP conversions, rehearse the promotion with a conversion cache, refresh the preview, run the focused tests, browser checks and Vercel checks, then update PR 236 and read CI.

- Round 8: measure all 164 selected banks and record each stride or fallback. Apply the pace and prefetch rules. Check the slow links, rebuild and compare the catalog, rehearse promotion, refresh the preview, run the listed checks, and update PR 236.

- Round 7: measure planted feet and use the old gait when contact is not reliable. Apply the pace and selection prefetch rules. Repair the build gates and promotion rollback. Rebuild and compare the package, refresh the preview, run the requested checks, and update PR 236.

- Round 6: rebase on PR 234. Keep priority loading and fallback guards. Rebuild and compare the package. Check throttled captures and quiet moves in both browsers. Run focused tests, docs and Vercel checks, then update PR 236 and check CI.

- Round 5: measure stride and fit each walk bank to its facing. Add build gates and a reproducible catalog promotion. Remove unused banks. Fix the missing-turn fallback and turn handoff. Refresh the game preview, run the requested checks, and update PR 236.
- Round 4: use a flat gait for selected painted walks, with one cycle per square and a 1,600 ms cap. Test special moves and the old gaits. Record game-size and enlarged views. Run the requested checks and update the pull request.
- List every army, character and direction. Count distinct painted frames.
- Keep the catalog placement and timing. Match each figure to its shipped rest with one transform.
- Add move-only gates and runtime playback. Keep the other bank rules and assets intact.
- Render the complete review page and game captures. Compare the eight reference rows.
- Run focused tests, both browser checks and the Vercel checks. Record the results before a pull request.

## Findings

- Guard S uses the old gait for both armies. Its planted support points move south in both paired holds, in the same direction as travel. New Guard S poses are a follow-up.
- Round 8 scan: all 164 banks have candidate alpha contact points. Guard E measures 0.782976 squares per cycle for white and 0.773904 for black; these values are not yet in the catalog. For white Pawn N, the planted-foot y values change from 699 to 700, then 674 to 672. The second pair moves north, with the board travel, so it does not give a reliable positive stride. The slow-link gate still asks Pawn N to walk. The other bank contacts need review. The scripts and records are `r8-contact-scan.json` and `r8-guard-e-contact.json` in the run folder.
- Round 7: the white Guard S support points move down in both paired holds. At alpha above 128, the lowest left-foot pixel moves from y 716 to 718 between 0 and 160 ms. The lowest right-foot pixel moves from y 715 to 717 between 320 and 480 ms. Southward board travel also moves down. The source poses do not give a reliable positive planted-foot stride. The owner set the Guard S gate to the old gait. The contact script and measurements are in the run folder as `r7-guard-contact.py` and `r7-guard-contact.json`.
- The promotion script now checks its sibling folders and removes files added by a failed rebuild. The build reads alpha bounds and catalog source frames for the walk gates. A full PNG build passes for 738 banks and 5,259 assets. The package comparison and promotion rehearsal remain.

- Round 6: rebased on PR 234 at `d0509968`. Walk preparation uses the same priority loader as captures. The idle bound, clip fallback, pump guard and PNG guard stay in place.
- The focused run passes 160 tests and 69 board checks. The docs run passes 187 tests. The runtime, online and king capture browser checks pass in Chromium and WebKit. At 4 Mbps and 100 ms, the capture, pawn move and rook move each pass five of five in each browser. The extra 1.6 Mbps capture probe passes five of five in Chromium and four of five in WebKit. The Vercel build and output check pass.
- The catalog content and pin do not change. The cloud image has the same decoded pixels. Normal playback stays the same, so the existing game captures remain.

- Two independent reviews of `b16c9844` requested fixes before merge. This round applies the pace, placement, source, gate and handoff rulings. The final head needs review.
- Round 5 work in progress: travel uses catalog stride and caps cadence at 2×. The catalog marks some stride values as draft. The Knight and Paladin keep their leap and charge; their 32 unused walk banks leave the package. A missing turn route uses the old motion. The walk starts after the outward turn endpoint.
- A selected painted walk uses flat, linear travel. Its time follows the catalog stride, up to 1,600 ms. The pose rate rises to at most 2× when the cap applies. Stratus hover stops during travel.
- Captures keep their attack. A two-square pawn move uses its stride and the time cap. Promotion follows the pawn's arrival. Castling moves the king; the rook changes square with the position update. Knight and Paladin keep their own moves.
- Each of the 164 shipped walk banks has one direction transform. The median silhouette height, ground and centre match its facing endpoint in the offline measurement. The before and after table is `r5-fit-report.json` in the run folder.
- After the attack merge, the branch uses the new frozen catalog as its base. The package has 738 banks and 5,259 assets. All 574 prior banks and effects match the merged base.
- From the catalog stride values, the white pawn N, queen SE, rook E six-square and queen NE five-diagonal skate ratios change from 1.25, 3.14, 3.75 and 6.29 to 1.00, 1.00, 1.88 and 3.14. The last two reach the rate cap. These are estimates, not contact measurements.
- After the rebase, 144 focused tests pass. The promotion and package tests pass again after the preflight change. The runtime browser check passes three times in each browser. Both online checks, the king capture check, the Vercel build and the Vercel check pass. The preview has 34 game moves and 17 figure crops.
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
- Before round 5, the WebP package had 674 banks and 6,221 assets. It added 196 move banks and 800 frames. The package grew from 124,537,245 to 145,737,672 bytes. All 478 earlier banks and the effects stayed exact.
- A package check passes for the source hashes, frame times and transparent borders of all 800 move frames. The aligned gallery has 196 rows, lists 76 cells without a walk, and has 34 game moves in 17 recordings.
- `npm run build:vercel` and `npm run check:vercel` pass with a local test database. Chromium `character-runtime` and Chromium and WebKit `web-online` pass. The character check waits for the rest frame and checks the turn handoff to the walk.
- [Pull request 236](https://github.com/SaarShai/king-down-chess/pull/236) carries the change. Its checks record CI status.
