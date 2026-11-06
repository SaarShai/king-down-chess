# Import the second batch of character banks

Status: finished. PR 274 merged and its catalog is promoted into MAIN.

## Plan

1. Import the banks into a scratch catalog from the pinned MAIN catalog. Keep every MAIN file byte-equal. Pin the new catalog.
2. Replace 25 catalog entries: six leap landings, 12 idle rest fixes with the repainted Bishop book, three rest fixes for white Paladin, Queen and Ogre, and four west attacks.
3. Update the attack key and in-between records that the package test reads, and the two browser checks that look for a white Pawn idle that faces SE.
4. Check the banks in the real game at game size. Run the focused checks once.

## Acceptance checks

- The package keeps 846 banks: 46 idle, 272 turn, 256 attack, 240 walk and 32 jump.
- All other banks keep their frames and timing. Only the registration pointer can change, and only in the armies that get a new rest.
- `STRAIGHT_REACH` holds: no N or S attack changes.
- A move of a white Pawn, Knight, Bishop and Maester starts and ends on the exact rest file, at the same scale and pivot.

## Result

The import command is `bash ~/kd-runs/batch-2/import.sh`. It rebuilds all output from MAIN and from the base commit. Its comparison record is `~/kd-runs/batch-2/compare.json`.

The record shows 15,337 MAIN catalog files byte-equal and 25 of 1,229 catalog entries changed. In the package, 740 banks stay equal, 81 banks change only `registrationSourceSha256` and 25 banks change. The bank count stays at 846. The 81 banks are in the Bishop of both armies and in the white Archer, Guard, Knight, Maester, Ogre, Paladin, Pawn and Queen. The record lists each one. The record also lists no changed N or S attack, so `STRAIGHT_REACH` keeps its values.

## What comes in

- **Leap landings.** Paladin charge S and SW, Knight leap SW, both armies. Each landing frame is its source frame moved by whole pixels, and the import proves this frame by frame. No pixel leaves the canvas. A shifted frame has no earlier production file, so its `productionSha256` is its own hash.
- **Idle rest fix.** Pawn, Archer, Knight, Maester and Guard white, and the Bishop in both armies. The rest file is now the figure at the facing that its turn banks use: Pawn and Knight E, Archer and Maester SW, Bishop and Guard S. The Bishop book in both armies comes from the repainted bank, so it has no pop at the join with rest.
- **Rest fix.** White Paladin, Queen and Ogre idles. The facing stays SE.
- **West attacks.** Pawn W and King Shadow W, both armies, from new painted frames with at most one in-between per pair. Contact stays at 340 ms and 360 ms.

The Paladin attacks stay as they are, because the new ones lose the lunge and reach. The Ogre attacks, the Queen spin and the Shadow and Paladin turns stay as they are too.

## Changes during the import

- The blade tip of King Shadow W reaches the canvas edge in 8 frames of each army, and the package refuses an attack frame with an opaque border. `~/kd-runs/batch-2/trim_shadow.py` clears the left 6 source columns of these frames. That is about 1 game px of a thin tip. All other pixels stay.
- The second key of Pawn W now has its own painted time in the record, so the package test counts 45 retimed banks, not 47.
- `verify-character-prepare` and `verify-movement-runtime` now find the white Pawn idle by kind, because its facing is E.

## Game check

`~/kd-runs/batch-2/game-check.mjs` runs in Chromium and records no faults:

- Moves from rest: white Pawn, Knight, Bishop and Maester, black Knight, and Paladin S and SW in both armies. The first and last frames match in file, scale and pivot.
- Captures to the west in both armies, Pawn and King Shadow: all frames show, and the contact frame draws with the contact callback. A Pawn faces west only in an en passant capture of classic chess, so these two cases send that move to the real scene and do not use a click.
- Bishop book idle: the foot, scale and pivot stay the same over the clip. White draws 30 of 30 drawings. Black draws 26 of 31 in its two plays, because the idle timer draws about 20 times each second.

A look at decoded frames of the Bishop book in play, and of the Pawn W and Shadow W captures, shows no pop, no clipped figure and a reach on the target side. Game clips: `~/kd-runs/batch-2/game.gif`.

## Not checked

The full suite, WebKit, mobile layouts and sound. A look at the idle of each rest-fix character in play, except the Bishop book.
