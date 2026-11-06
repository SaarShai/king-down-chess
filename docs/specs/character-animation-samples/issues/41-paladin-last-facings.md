# Complete the Paladin jump facings

Status: local checks pass. The pushed head still needs CI.

## Plan

1. Make fresh NW and NE sheets. Use at most three new sheets per facing. Stop image calls at 50 percent weekly use.
2. Register the six painted poses at the existing times. Fit black from white. Check all four banks at game size on both tile colours. Replace the rejected banks and update the contact image.
3. Merge origin/main into this branch. Import the four banks into a new scratch catalog. Update the count check.
4. Run the focused local checks once. Check NW and NE moves in Chromium for both armies. Save game.gif.
5. Push PR 267. Read one CI run and fix its faults. Record the catalog path, hash and head commit.

## Acceptance checks

- The hammer stays in the source hand. The exterior has clean alpha. Both armies have equal motion, alpha and pose times. Frame hashes match.
- The package has 846 banks, 32 jump banks and all eight Paladin facings in both armies.
- Focused checks and CI pass. Chromium shows correct target squares and landing times for the four new banks.
- MAIN and its frozen catalog stay unchanged. The owner merges and deploys.

## Result

NW uses sheet-v3.png. This run makes two fresh NW sheets; the first has a halo and is rejected. NE uses sheet-v2.png from one fresh sheet. No finished sheet is edited. No mirror, machine in-between, blend or video model is used. The hammer stays in the source hand. Both black banks use recolor.fit_spatial from the standing pair in the same facing. All four banks have candidate status and correct frame hashes.

Game-size checks cover all six poses beside the standing figures on both tile colours. The production contact image is updated. The delivery check confirms equal alpha, motion, pivot and times in each army pair. All 128 production frames open.

The branch is already up to date with origin/main at 160404f08b06b5b7366307157a871399d265f5d9. The merge command makes no change. The exact import command in ticket 40 builds /Users/za/kd-runs/leap-integrate-last-four/catalog. Its SHA-256 is `fd84e01b2e401e6eafa9a282e4d8a41b0d7170a36b41a439f14ee2b1412813b2`. The importer preserves every base file. The package has 846 banks and 8,031 images. It has 32 jump banks and all eight Paladin facings in both armies. It reuses all 8,003 prior images and adds 28 images.

Focused local checks pass once: 172 runtime, scene and package cases; 70 board cases; 187 doc cases with one existing skip. Chromium passes eight moves. These include NE and NW Paladin moves in both armies. Each checks all eight pose times, constant scale, the exact target at contact and at the end, and the cache limits. The normal-speed game clips are in /Users/za/kd-runs/leap-paladin-last/game.gif.

The runtime needs no code change. The count check and the existing browser check cover the four new banks. MAIN and its frozen catalog stay unchanged. No PR merge or deploy runs.

Not checked locally: the full suite, capture callbacks in a browser, every board edge, mobile layouts or sound. CI covers the full suite.
