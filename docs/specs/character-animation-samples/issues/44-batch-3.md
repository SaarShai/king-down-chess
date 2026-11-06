# Import the third batch of character banks

Status: local checks pass. CI, the catalog promotion and the merge are open in the pull request.

## Plan

1. Import the banks into a scratch catalog from the pinned MAIN catalog. Keep every MAIN file byte-equal. Pin the new catalog.
2. Replace 34 catalog entries: 16 Paladin attacks, 16 Ogre attacks and the two Rook slam idles.
3. Add `rook` to `LARGE_IDLE`, so that a Rook leaves its raised hold on the idle's own frames. This word needs the new banks.
4. Update the attack key, in-between and cue records that the package test reads.
5. Check the banks in the real game at game size. Run the focused checks once.

## Acceptance checks

- The package keeps 846 banks: 46 idle, 272 turn, 256 attack, 240 walk and 32 jump.
- All other banks keep their frames and timing. Only the registration pointer can change, and only in the Rook armies.
- `STRAIGHT_REACH` holds: the Paladin N and S contact frames stay the same files. The table has no Ogre row.
- The retained decoded pixels stay within 64 MiB in each game case.
- A Rook move from the raised hold goes back along the idle to the rest file and keeps its walk.

## Result

The import command is `bash ~/kd-runs/batch-3/import.sh`. It rebuilds all output from MAIN and from the base commit. Its comparison record is `~/kd-runs/batch-3/compare.json`.

The record shows 15,766 MAIN catalog files byte-equal and 34 of 1,229 catalog entries changed. In the package, 796 banks stay equal, 16 Rook banks change only `registrationSourceSha256` and 34 banks change. The bank count stays at 846. The package adds 545 images and removes 172.

The import starts from the form of `fix-flags/integrate/import.py`, because the three import patches anchor on that form. The patches apply in the order Paladin, Ogre, Rook, with no edit. `SWAPS` and `COPIES` of the earlier batches are empty, because MAIN holds those banks now. The source bank hash of each of the 34 candidates equals its MAIN entry.

## What comes in

- **Paladin attacks.** Both armies, all facings. Each bank keeps the old painted keys and adds in-betweens: up to 33 images, and largest step lower. Reach at contact stays.
- **Ogre attacks.** Both armies, all facings. New keys with a smoother rise and fall. Contact stays at 290 ms and recovery at 750 ms. The anchors and target points follow the new fist, so `painted-attack-cues.json` changes too. The two west banks have no old second key at 120 ms, so the package test counts 43 retimed banks, not 45.
- **Rook idle hold.** Both armies. Only slots 72 to 116 of 120 change, and they use files that the bank already has. The idle now has a path back to the rest file. The file count is 64 and 63, at 36.0 and 35.4 MiB decoded.

## Decoded memory

Paladin attack images are 896 by 640, which is 2.19 MiB each. Two banks are larger than the 64 MiB budget when all their images are in memory: black E (33 images, 72.2 MiB) and white E (30 images, 65.6 MiB). The other 14 are 45.9 to 59.1 MiB.

No change is necessary. A move holds the rest file, the turn endpoints and the first 4 attack frames. All other attack frames load at most 5 frames ahead of the clock, and the runtime drops the oldest images when it goes over the budget. So a bank need not fit in whole. In Chromium, black E draws 34 of 34 frame slots on a warm page, and 31 of 34 on the first page of a new browser. All 12 game cases keep the peak at or below 67,108,864 bytes.

The attack of black E now loads 33 images and 993 KiB; the old bank loads 7 images and 208 KiB. Slow-link play is not checked. A frame that is late keeps the frame before it on the screen.

## Sizes

- Page payload: 1,075,133 bytes, under the guard of 1,250,000.
- `manifest.json` 2,913,174 bytes and `assets.json` 2,650,931 bytes. The size allowlist holds both.
- The largest new image is 37,356 bytes, under the file limit of 2,000,000 bytes.

## Game check

`~/kd-runs/batch-3/game-check.mjs` runs in Chromium and records no faults and no console error. Each case uses real clicks:

- Paladin captures of a Pawn: black E, white N, white SW, black S. White N, white SW and black S draw all frame slots. The contact frame draws with the contact callback.
- Ogre captures of a Pawn: white N, black S, white NE, black W. All 18 frames draw. A second Pawn stands behind each victim, because a click on an adjacent enemy with an open push does not capture at once.
- Rook from the raised hold, about 1,300 ms after selection: white N and black S moves, white N on a crowded board, and white W capture. The exit has 13 or 14 draws of idle frames. The action starts on its first frame and the end frame is the rest file. Walks play in all three moves, and the attack plays in the capture.
- A further probe on three boards, two targets and two click delays: the walk plays in 12 of 12 cases.

The first page of a new browser stalls for 118 to 134 ms at the contact frame. This follows the first page and not a bank: white N had the stall when it ran first, and black E had it when it ran first. The base commit is not measured.

A click within about 500 ms of the selection can come before the idle images finish loading. That move has no exit and goes from the idle pose directly to rest, as it does before this change.

Game clips: `~/kd-runs/batch-3/game.gif`.

## Not checked

The full suite, WebKit, mobile layouts, sound, slow-link play and all other facings in the game.
