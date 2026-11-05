# Animation wrap-up: one catalog build

Status: in progress. The tool works on the walks that exist. The final walk list, the in-between colours and the owner look stay open.

## Plan and checks

- Build one tool (`tools/anim/wrap_up_build.py`) that makes a scratch catalog as a superset of the pin: white walks, black walks, picks by frame hash, strides, 160 ms per pose. Check: 240 move banks at the final run.
- Test it now on the finished walks, in a scratch output. Check: the runtime PNG build and its gates, then the focused tests on the result.
- At the final run, change the fixed values: `promote-painted-moves.py` (`BASE`, 196, the non-move compare), its test, and two lines of `tools/gate/size-allowlist.txt`.

## Findings

- Pick pipelines run on catalog black frames. A tone-mapped walk has other colours. Ogre finds no cloth in it, so it takes its mask from the white pose (`wrap_up_picks.py`).
- The first tone map fits one master and has one result per colour. Cream hair and cream robe become one grey, and Mud cream cape and bone become one pale blue. Black walks now use `recolor.fit_spatial`: it fits the standing pose in the same facing, with the pick colours as target, and each sample keeps its place on the body. Mud and black Stratus need no part masks with this map.
- This map cannot help Ogre: white skin has the cloth colour. Ogre stays on its pipeline. Hand marks in `OGRE_NOT_CLOTH` remove a raised thigh and hands from the cloth (SW pose 4, W poses 1 to 3). A remade pose fails their area test. Then the fault can come back, so look at each new ogre walk.
- Maps in r6 form load through `--overlay`, in order. A later map replaces an earlier one, frame by frame. Final order: all r6 maps, then `army-r7/king-mud-black`, then `army-r7/king-stratus-black`.
- The move gate limits `topRangeAt160` to 9.9. The walk rules keep the drawn bob. Four finished walks are over the limit: guard NE 10.91, flame NE 10.00, mud E 9.94, ogre SW 11.62. The tool fails these walks and changes nothing in them.
- Method A and B run high against the study on shipped banks: guard E 1.02 against 0.92, guard SE 0.85 against 0.70. Each stride still needs a look at game size, as in issue 36.
- A move bank's frames must equal its source bank's frames, so a pick must also write a new source bank. Settle frames of rook SE and ogre SE are not played and are not gaps.
