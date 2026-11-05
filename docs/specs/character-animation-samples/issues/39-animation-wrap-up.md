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

- Catalog pin: `0b01f644adac19eb8e4dc4c13c04c3dff004c5e02255749c34f737e6448fb8a5`.
- Scratch catalog: `/Users/za/kd-runs/fin-ogre/catalog`.
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

The first check looks only for cloth colour on skin and misses blotchy skin. The repair check below replaces that finding. It compares the same skin shading across the two armies and a neighbour.

## Verification and limits

Focused tests run once with:

```sh
KINGDOWN_TEST_FILE='tools/{anim/{move-gates,promote-painted-moves,wrap-up},character-runtime-package}.test.ts' npm test
```

Result: 4 files and 21 cases pass. Both type checks pass. The same command runs the 70 board unit cases; all pass. Build log: `/Users/za/kd-runs/fin-walks/build.log`. Test log: `/Users/za/kd-runs/fin-walks/tests.log`. The PR holds the CI result.

The first CI verification step fails only in the new report test: its import of the image builder needs NumPy. The report reader now lives in `wrap_up_report.py`, with standard-library imports only. The test uses `python3 -S`, so image packages cannot hide this error. Only this failed test runs again locally; it passes, with both type checks and the 70 board unit cases. All 10 browser jobs pass in the first CI round. The catalog and art stay unchanged.

No local browser check or `test:docs` runs. No full local test suite, new play check, separate reviewer, judge round or image call runs. No merge, catalog promotion or deploy runs.

## Build findings kept for later work

- A tone map cannot split white ogre skin from white cloth. The ogre pipeline takes its cloth mask from the white pose. Rebuild the body mask when the cloth mask changes; holes from the old mask can make dark and light skin patches. SW takes skin shading from the white art. `OGRE_NOT_CLOTH` excludes belly skin, thighs, toes and hands. A remade pose can fail the area check. Compare smooth shading across armies and adjacent facings at game size and 2x, as well as cloth leaks.
- `recolor.fit_spatial` fits the standing pose in the same facing. It keeps the sample's place on the body, so cream hair, robe, cape and bone can take different colours.
- A move bank's frames must equal its source bank's frames. A pick must also write a new source bank. Unplayed settle frames are not pick gaps.
- PR 251 keeps maester SE poses 1 to 4, at stride 0.667, and queen black SE from white SE, at stride 1.28. The new build keeps these fixes.
- A 720 ms cycle against 640 ms does not change screen speed while `paintedPace` has a rate from 1 to 2. The existing ogre and flame banks at 720 ms stay.

## Black ogre SW repair: plan and checks

The owner requests a colour repair in PR 252. Keep the approved white art and all picks. Make no image call.

1. Compare white SW, tone-mapped SW, black SW and black W. Check the body and cloth masks.
2. Fix only black SW. Check all other bank and frame hashes against head `0726d60c`.
3. Rebuild the scratch catalog and both runtime formats. Keep 814 selected banks and 240 moves. Check alpha and records.
4. Look at 4 poses each of black SW, black W and white SW, at game size and 2x. Look at the other 3 new black walks at 2x.
5. Run focused tests once. Push to the same PR. Read one CI round. The owner keeps merge, catalog promotion and deploy.

Status of repair: local checks pass. The PR holds CI for the repair head.

## Black ogre SW repair: result

The white SW walk is smooth. The tone map loses some smooth shading. The old part mask then marks 57,600 to 74,117 pixels outside the white cloth mask as cloth in each pose. It removes these pixels from the body mask. The walk code replaces cloth, but keeps those body holes. The skin receives two different maps. This causes the blotches. Evidence: `/Users/za/kd-runs/fin-ogre/cause-stages.png` and `cause-stats.json`. Black W in the reference GIF has smooth skin.

Only SW now takes skin shading from the approved white art and the existing dark body map. Its body and cloth masks are rebuilt together. The belly in pose 1, a toe in pose 2 and a thigh edge in pose 3 join the existing skin exclusions. White art, all picks, alpha, motion, placement and stride stay.

The new scratch build is `/Users/za/kd-runs/fin-ogre/catalog`. PNG and WebP pass. WebP reuses 7,803 assets and converts only 4. Counts stay at 814 selected banks, with 240 moves and 7,807 assets. All picks are mapped; no frame is unmapped. The build uses the same base report and overlay order as `fin-walks/final.sh`. Run it with `zsh ~/kd-runs/fin-ogre/final.sh`.

I look at `black-ogre-compare.png`: black SW, black W and white SW, all 4 poses at game size and 2x. The SW skin is smooth. Cloth stays white, wrists stay red, hands and thighs stay dark. I also look at all 4 poses of black guard NE, flame NE and mud E at 2x on light and dark tiles. I see no blotches in those walks.

The new regression check samples near-equal white skin shading on either side of the old mask edges in all 4 poses. The old black outputs have light jumps of over 100 RGB levels in these pairs. The repaired pairs stay within 8 levels. The focused set runs once. Its 21 existing cases pass. The new case first fails on two test assumptions: exact alpha 255, then a white sample tolerance of 5 levels. The shipped pixels have alpha 253 and one white pair differs by 5.67 levels. I set the opaque limit above 250 and use the same 8-level shading limit for both armies. Only the new case runs again after each correction. It passes, with both type checks and all 70 board cases. Logs: `fin-ogre/tests.log`, `test-fix.log` and `test-fix-2.log`. No full local rerun follows. CI for this head is in PR 252.

Hash proof: `fin-ogre/hash-proof.json` checks all 813 other selected banks, including the other 239 move banks. It checks all 1,195 other catalog banks and 8,106 distinct frame files by SHA-256. Their hashes stay. Only the black SW source bank, move bank and 4 frames change. White SW alpha matches black SW exactly; each frame has a clear exterior. The selection, runtime indexes, result record and catalog pin use the new hashes. Pick records and stride records do not change.

No local browser check, `test:docs`, full suite or travel check in play runs. No independent reviewer, image call, merge, catalog promotion or deploy runs. CI covers the broader checks.
