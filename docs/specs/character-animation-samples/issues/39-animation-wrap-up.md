# Animation wrap-up: one catalog build

Status: PR open. The owner look and the promotion at merge stay open.

## Plan and checks

- Build one tool (`tools/anim/wrap_up_build.py`) that makes a scratch catalog as a superset of the pin: white walks, black walks, picks by frame hash, strides, 160 ms per pose. Check: 240 move banks at the final run, less 2 for each walk the pass list leaves out. Result: 232.
- Test it now on the finished walks, in a scratch output. Check: the runtime PNG build and its gates, then the focused tests on the result.
- At the final run, change the fixed values: `promote-painted-moves.py` (`BASE`, 196, the non-move compare), its test, and two lines of `tools/gate/size-allowlist.txt`.

## Findings

- Pick pipelines run on catalog black frames. A tone-mapped walk has other colours. Ogre finds no cloth in it, so it takes its mask from the white pose (`wrap_up_picks.py`).
- The first tone map fits one master and has one result per colour. Cream hair and cream robe become one grey, and Mud cream cape and bone become one pale blue. Black walks now use `recolor.fit_spatial`: it fits the standing pose in the same facing, with the pick colours as target, and each sample keeps its place on the body. Mud and black Stratus need no part masks with this map.
- This map cannot help Ogre: white skin has the cloth colour. Ogre stays on its pipeline. Hand marks in `OGRE_NOT_CLOTH` remove a raised thigh and hands from the cloth (SW pose 4, W poses 1 to 3). A remade pose fails their area test. Then the fault can come back, so look at each new ogre walk.
- Maps in r6 form load through `--overlay`, in order. A later map replaces an earlier one, frame by frame. Final order: all r6 maps, then `army-r7/king-mud-black`, then `army-r7/king-stratus-black`.
- The move gate limits `topRangeAt160` to 9.9. The walk rules keep the drawn bob. Four finished walks are over the limit: guard NE 10.91, flame NE 10.00, mud E 9.94, ogre SW 11.62. All 164 shipped walks measure at or under 9.90: rook white SW 9.90, rook black SW 9.82, archer black SE 9.73. So the accepted walks do not reach this range, and the limit stays. These 4 walks stay out, in both armies, and each facing plays the old code gait.
- Shipped fixes: maester SE keeps poses 1 to 4 (640 ms, stride 0.667), both armies. Queen black SE comes from white SE by the colour map (stride 1.28), with white's placement, because the drawings are white's. Flame SE is the new one-sheet walk.
- `paintedPace` makes a straight move shorter than 600 ms when the stride is over 1.067. Ogre W measured 1.698 by method A and 0.719 by method B, and 1.698 gives a 377 ms move. The shortest shipped move is 520 ms. So ogre W takes the straight fallback, 1.00. Ogre E stays at 1.41, where both methods agree, and moves in 454 ms. This needs a look in play.
- Final result: 806 banks and 232 move banks, not 240. All 164 shipped walks and 34 new white walks with their black walks are in. The 4 walks over the limit stay out, with their black walks. No shipped walk is over 9.90 (rook SW white is the maximum), so the evidence does not allow a higher limit. These 4 facings play the old code gait.
- A cycle time of 720 ms against 640 ms does not change the speed on screen while `paintedPace` has a rate between 1 and 2. So the ogre and flame banks at 720 ms stay as they are.
- Method A and B run high against the study on shipped banks: guard E 1.02 against 0.92, guard SE 0.85 against 0.70. Each stride still needs a look at game size, as in issue 36.
- A move bank's frames must equal its source bank's frames, so a pick must also write a new source bank. Settle frames of rook SE and ogre SE are not played and are not gaps.
