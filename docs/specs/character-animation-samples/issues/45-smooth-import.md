# Import the accepted smoother animation banks

Status: local checks pass. CI, the catalog promotion and the merge are open in the pull request.

## Plan

1. Import the use-new banks of the six smoother lanes into a scratch catalog from the pinned MAIN catalog `d56d4676`. Keep every MAIN file byte-equal. Pin the new catalog.
2. Convert to WebP, rebuild `footprints.json`, update the tests that count banks or read fixed pixels.
3. Run the focused tests, `character-runtime` and `painted-leaps`, a slow-link probe of walks and jumps, and a game look in Chromium.

## Acceptance checks

- The package keeps 846 banks. Banks outside the import keep their frames; only the registration pointer can change.
- `footprints.json` covers every frame of the package.
- The decoded peak stays at or below 64 MiB.
- At 4 Mbps and 100 ms, a walk or a jump in any direction plays its painted frames. It does not fall back to code motion.

## Result

Import command: `bash ~/kd-runs/smooth/integrate-r14/import.sh`. Record: `~/kd-runs/smooth/integrate-r14/compare.json`. The tool is the batch-3 import with empty `SWAPS`, then the lane patches in this order: beast-archer-attacks, idles, rook-attacks, frost-spirit-attacks, walks. No patch needed an edit.

| Lane | Banks in | Kept old |
|---|---|---|
| Beast, Archer, Pawn, Queen attacks | 22 | 0 |
| Beast, Paladin, Stratus idles | 8 | 0 |
| Rook attacks | 14 | 2 (S, both armies) |
| Frost, Spirit, Mud, Shadow attacks | 35 | 3 |
| Walks, 8 poses | 199 | 41 |
| Knight and Paladin jumps | 0 | 32 (see below) |

- 16,381 MAIN catalog files stay byte-equal. 477 of 1,229 entries change (walks change the move bank and its source bank).
- Package: 846 banks; 314 equal, 55 with only a new registration pointer (Beast, Paladin, Stratus, from the new idles). Images 8,589 to 10,096 (2,449 in, 942 out). Assets 188.4 MB to 215.8 MB (+27.4 MB). `manifest.json` 2,913,174 to 3,227,184 bytes.
- `footprints.json` covers 10,096 of 10,096 frames. `node tools/build-character-footprints.mjs` gives the same bytes as the converter.
- `tools/painted-attack-package.test.ts` counts 27 retimed banks, not 43: the Spirit records now hold the times of their new painted run.
- `tools/anim/wrap-up.test.ts` reads Ogre SW walk pixels. Its points move onto the belly skin of the new poses.

## Walks at 8 poses, jumps left out

The first import had 16-pose walks and 27-file jumps. `character-runtime` passed, because its slow-link walk (Rook E) is the first direction that the selection loads. A probe of other directions at 4 Mbps and 100 ms (`~/kd-runs/smooth/integrate-r14/leap-slow.mjs`) fell back to code motion in 10 of 14 moves. MAIN played all 14. The 1000 ms wait cannot hold 16 or 27 files: each file adds latency, and a jump is 560 to 810 kB.

- Walks: `POSES = 8` in the walks lane, as its apply note says. At 4 Mbps, 8-pose walks play in 24 of 24 probe moves (Queen in six directions, white Rook in four, black Rook in two), and the MAIN jumps play in 8 of 8.
- Jumps: a jump with the old keys and one new frame for each gap (12 to 13 files) still fell back in 3 of 6 moves. The full jumps fell back in 5 of 6 moves at 8 Mbps. So the jumps stay at MAIN. To ship them, the runtime must start a jump before all its frames are in, as an attack does. That is a separate change.

## Checks

- Focused tests pass: `painted-attack-package`, `painted-leaps.docs`, `anim/wrap-up`, `fx-melee`, `character-runtime` (85), `character-runtime-package` (17), `scene-load` (84).
- `npm run check:browser character-runtime painted-leaps`: both pass. Capture at 4 Mbps 5/5 and at 1.6 Mbps 5/5; Pawn and Rook walks at 4 Mbps 5/5. Decoded peak 67,108,864 bytes, at the limit and not over it.
- Game look in Chromium, real clicks, no fault and no console error: Rook attack white N (14 of 14 poses), Frost king attack white N (24 of 24), Knight jump white NE (old bank, 7 of 7), Queen walk white N (8 of 8), black Rook walk S (8 of 8). Clips: `~/kd-runs/smooth/integrate-r14/ingame/game.gif` and `game-sheet.png`.

Not checked: WebKit, mobile layouts, the full suite (CI runs it), `movement-runtime` (it needs a pinned baseline folder), and every facing in the game.
