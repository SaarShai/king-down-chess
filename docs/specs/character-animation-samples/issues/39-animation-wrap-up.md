# Animation wrap-up: one catalog build

Status: resolved. The owner approves all sequences on 2026-11-05: "they're all fine." Merge, catalog promotion and deploy stay with the owner.

## Plan and checks

- Add ogre SW, guard NE, king-flame NE and king-mud E in both armies. Build in `anim/wrap-up-final`, from `5d2e6b9d`. Keep the base catalog `d9bdfe95`.
- Keep the general `topRangeAt160` limit at 9.9. Name only the 8 approved banks as exceptions. Keep all other move checks.
- Measure strides with the tool. Keep ogre fallback at 1.00 straight and 0.76 diagonal. A straight move under 520 ms needs agreement from both methods.
- Build PNG and WebP. Check 814 banks: idle 46, turn 272, attack 256, move 240. Check all picks and zero unmapped frames. Keep the base files and entries.
- Look at all 4 new black walks on light and dark tiles. Check ogre SW hands and thighs. Run focused tests once. Open one PR into staging and read one CI round. Do not merge, promote or deploy.

## Done check

The new selection has **240 walks, 256 attacks, all picks mapped and 0 unmapped frames**. It has 814 banks: idle 46, turn 272, attack 256, move 240. No walk stays out. Both armies use the 4 new walks.

- Catalog pin: `26df6c96f75bfe98e9c5d4f7965e11f55973a745c44b7763eac0defa23b0328d`.
- Scratch catalog: `/Users/za/kd-runs/fin-walks/catalog`.
- All 1,181 base catalog entries, 14,490 base files and 806 base selected banks stay. The new catalog adds 8 move banks, their source banks and 32 frames.
- The base build report proves its colour picks. Its SHA-256 is `158d3f5ee4049b0b4695f015d67eb7551cacc8295a4dc4bf2b649f2e4d65dde5`. `--base-report` checks the pin, counts, runtime pass, faults and gaps before it keeps those picks. The overlays load in the order of `final.sh`: all r6 maps, then mud r7, then stratus r7. The new walks use the pick pipelines or the standing colour map.
- PNG build and move gates pass. WebP has 7,807 assets: it keeps 7,775 and converts 32. All new frames have a clear exterior. White and black alpha match.
- `wrap-up-final-result.json` holds the done check. `wrap-up-final-walks.json` holds the 4 walks; none has `leftOut`.

## Strides and move times

Times use `paintedPace`, normal speed, for one move to an adjacent square. A diagonal uses a distance of sqrt(2). Each cycle has 4 poses at 160 ms.

| Walk | Stride, squares per cycle | Method | Move time |
|---|---:|---|---:|
| ogre SW | 0.582 | A high | 778 ms |
| guard NE | 0.920 | Character median; both methods low | 704 ms |
| king-flame NE | 0.826 | A low, within 30% of median | 704 ms |
| king-mud E | 0.986 | Both methods agree | 600 ms |

Guard NE and flame NE keep `needsLook` in the stride record. The pose sample does not prove their travel pace in play. Ogre E keeps 1.41 and 454 ms from PR 251: both methods agree. Ogre W keeps 1.00; 1.76 never sets an ogre fallback.

## Move gate and colour checks

`tools/anim/move-range-exceptions.json` names the 8 banks. Reason: owner approved by eye, 2026-11-05. Their top range ceilings are ogre SW 11.62, guard NE 10.91, flame NE 10.00 and mud E 9.94. All other banks keep 9.9. Every bank keeps the ground range limit of 20.6 and the source, timing and placement checks.

I look at `/Users/za/kd-runs/fin-walks/black-4.png`, with all 16 black poses at game size on both tile colours. The four per-walk samples show the same poses without reduction. Ogre SW hands and raised thighs stay dark. White cloth stays at the waist, including pose 4. Guard armour, flame cape and mud shoulders, mask and belt keep their dark colours. I see no colour-mask fault, so I change no art.

## Verification and limits

Focused tests run once with:

```sh
KINGDOWN_TEST_FILE='tools/{anim/{move-gates,promote-painted-moves,wrap-up},character-runtime-package}.test.ts' npm test
```

Result: 4 files and 21 cases pass. Both type checks pass. The same command runs the 70 board unit cases; all pass. Build log: `/Users/za/kd-runs/fin-walks/build.log`. Test log: `/Users/za/kd-runs/fin-walks/tests.log`. The PR holds the CI result.

No local browser check or `test:docs` runs. No full local test suite, new play check, separate reviewer, judge round or image call runs. No merge, catalog promotion or deploy runs.

## Build findings kept for later work

- A tone map cannot split white ogre skin from white cloth. The ogre pipeline takes its cloth mask from the white pose. `OGRE_NOT_CLOTH` excludes raised thighs and hands. A remade pose can fail the area check; look at each new ogre walk.
- `recolor.fit_spatial` fits the standing pose in the same facing. It keeps the sample's place on the body, so cream hair, robe, cape and bone can take different colours.
- A move bank's frames must equal its source bank's frames. A pick must also write a new source bank. Unplayed settle frames are not pick gaps.
- PR 251 keeps maester SE poses 1 to 4, at stride 0.667, and queen black SE from white SE, at stride 1.28. The new build keeps these fixes.
- A 720 ms cycle against 640 ms does not change screen speed while `paintedPace` has a rate from 1 to 2. The existing ogre and flame banks at 720 ms stay.
