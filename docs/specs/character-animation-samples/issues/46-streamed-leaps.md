# Stream the smoother Knight and Paladin leaps

Status: local checks pass. CI, the catalog promotion and the merge are open in the pull request.

## Fault

The smooth import (issue 45) left out the 32 smoother leap banks. A new leap has 27 (Knight) or 28 (Paladin) frame slots, 530 to 810 kB. The runtime waited for all leap frames for 1000 ms, then fell back to code motion. At 4 Mbps the new leaps fell back in 5 of 6 moves.

## Change

- `leapPlan(bank)` and `leapStream(bank)` in `src/render/painted/character-runtime.mjs`. A leap starts when its first frames (frames 0 to 3, up to the crouch key) and its landing frame are decoded.
- The needed frames are the first frames and every second frame. If they do not fit in half of the decoded budget, every fourth frame (the Paladin: one frame is 900 x 644 px, 2.3 MB decoded, 60 MB for a full bank). They load first. The start waits only while the decode rate seen so far shows that a needed frame will not be ready one frame before the clock reaches it (the `strikeWait` rule of the capture start, PR 300). The 1000 ms limit and the code-motion fallback stay.
- During the leap, `action()` moves the stream window. The frames up to a quarter of the decoded budget past the playhead load and stay pinned. The stream releases a frame when the playhead passes it, and stops its download if it is not complete. A late frame shows the last decoded pose before it; the runtime never shows a later frame early.
- The selection prefetch loads the first frames of the leap toward each legal target, then the needed frames, while they fit in half of the decoded budget.
- Import: `~/kd-runs/smooth/leap-streaming/import.py`, a copy of the r14 import tool on the MAIN catalog `3ea5a5f3` with only the leaps lane patch (`patch_import.py`). New catalog pin `22f06a1c`. All 32 banks use the new frames (16 facings, both armies). 624 images in, 0 out. `footprints.json` rebuilt.

## Checks

- Unit test: a leap starts on its first frames, loads every second frame first, holds the last decoded pose, and stops a passed download.
- `tools/painted-leaps.docs.test.ts` pins 27 Knight and 28 Paladin slots. Focused tests pass: `character-runtime` (87), `character-runtime-package` (17), `painted-attack-package`, `scene-load` (86).
- `npm run check:browser character-runtime painted-leaps`: both pass.
- Slow-link probe (`~/kd-runs/smooth/leap-streaming/leap-slow.mjs`): all 8 targets of the Knight and of the Paladin from d4, both armies, 2 runs each, cold browser. Painted leaps (no fallback):

| Link | Main | New |
|---|---|---|
| 4 Mbps, 100 ms | 64 of 64 | 64 of 64 |
| 1.6 Mbps, 150 ms | 18 of 64 | 38 of 64 |

  No facing is worse than main. At 1.6 Mbps: Knight NE, SE 8 of 8 on both; Knight NW, SW 0 of 8 on main, 8 of 8 new; Paladin E 0 of 4 on main, 4 of 4 new; Paladin N 2 of 4 on both; the other Paladin facings 0 of 4 on both. Full table: `~/kd-runs/smooth/leap-streaming/table.txt`.
- Late pose (a frame shown after its slot ended): Knight at most 47 ms at 4 Mbps and 79 ms at 1.6 Mbps. Paladin 0 ms at 4 Mbps except white SE (165 ms), and 162 to 576 ms at 1.6 Mbps (every fourth frame is needed).
- Start delay (click to first leap frame, turns included): 4 Mbps Knight 155 to 994 ms against 150 to 1108 ms on main; Paladin 520 to 1240 ms against 154 to 1341 ms. 1.6 Mbps Knight 1010 to 1401 ms, Paladin 1124 to 1391 ms (the start waits up to the 1000 ms limit). A cold Knight SE leap starts later than main (515 to 557 against 155 to 159 ms), and NE 155 to 342 against 150 to 166 ms, because main had all 8 old frames prefetched.
- Decoded peak: 67,093,632 bytes in the probe and the game look, within 64 MiB (67,108,864).
- Game look in Chromium, real clicks, game size: Knight white NE and SE, black SW and NW; Paladin white N and E, black S and W. Each shows all its poses (26 of 26, 27 of 27), no fault, no console error. Clips: `~/kd-runs/smooth/leaps/ingame/game.gif` and `game-sheet.png`.

Not checked: WebKit, mobile layouts, the full suite (CI runs it). The Knight N, E, S and W banks: a Knight move always faces a diagonal, so no game move plays them.
