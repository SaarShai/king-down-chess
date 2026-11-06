# Replace the flagged Flame attacks and the Mud idle

Status: local checks pass. CI, the catalog promotion and the merge are open in the pull request.

## Plan

1. Import the new banks into a scratch catalog from the pinned MAIN catalog. Keep every MAIN file byte-equal. Pin the new catalog.
2. Replace `{white,black}-idle-claw-curl-SE` with `{white,black}-idle-squat-SE` in King Mud. Replace `{white,black}-attack-{N,NE,S}` in King Flame.
3. Update the attack key and in-between records that the package test reads.
4. Check all eight banks in the real game at game size. Run the focused checks once.

## Acceptance checks

- The package keeps 846 banks: 46 idle, 272 turn, 256 attack, 240 walk and 32 jump.
- All other banks keep their frames and timing. The first and last frame of each new bank are the exact rest PNG.
- The frame at 360 ms draws with the contact callback. The squat loop seam is rest to rest.
- A quiet move from a deep squat follows the painted frames back to rest.

## Result

The import command is `bash ~/kd-runs/fix-flags/integrate/import.sh`. It rebuilds all output from MAIN and from the base commit. Its comparison record is `~/kd-runs/fix-flags/integrate/compare.json`.

The bank count stays at 846. The new squat id replaces the old id in place, so no count changes. The 32 other Mud banks change one field: `registrationSourceSha256` names the new idle bank. Their registration height, frames and timing stay the same.

The source squat beat names `deepSquatMs` and `riseMs` become `peakMs` and `relaxMs` in the catalog bank, because the runtime manifest guard allows a fixed list of names.

The scene now reserves the Mud idle as it does the Stratus idle. Before this change, a quiet move from a deep squat jumped to rest in one frame. The Mud idle still starts when the king is selected.

## Corrected copies from the jump scan

The import also brings in 18 corrected banks from `~/kd-runs/jump-scan/banks/`: Rook black attack in all eight facings, Knight black SW and S, Bishop black SW, Queen S in both armies, Paladin black N, SE and NW, Paladin white NW, and the Ogre white clap idle. The scan found each fault in a game-size frame sequence.

- Each frame is its source frame moved by whole pixels. The import proves this frame by frame. No repaint or resampling occurs.
- Frame lists and times stay the same. The first and last frame stay the exact rest PNG, except for the Ogre idle. All Ogre idle frames move 26 source px, so the idle rest now lines up with the turn and attack rest. The move clips 269 alpha pixels in all at the canvas edge, about 1 game px.
- Paladin black N changes only its foot pivot, which now matches its white twin. Its frames stay the same.
- Queen S palm points move with their frames, in the bank and in `painted-attack-cues.json`. The thorns start from the painted palms.
- `targetPoint` stays as it was. The scene does not read it.

The scan's Paladin white SE, Paladin SW, Pawn W and Shadow white W copies stay out.

The comparison record shows 14,832 MAIN catalog files byte-equal and 26 of 1,229 catalog entries changed. In the package, 788 banks stay equal, 32 Mud banks change only the registration pointer and 26 banks change. The bank count stays at 846.

## Fixed faults

1. Deselect, or a selection of a different piece, during a deep squat now follows the painted frames back to rest. This also applies to the Stratus idle.
2. A straight-file capture now stands so that the painted reach faces the target. The side comes from table `STRAIGHT_REACH` in `blows.mjs`. A check of the final Flame banks in both armies gives N right and S left, so the table does not change.
3. The final black N, NE and S banks use per-material colour maps. The mottled cape and rough cape edges no longer show at game size.

## Known faults

- The first capture in a fresh browser has a stall of 215 to 534 ms after contact. An unchanged bank has the same stall, so the new banks do not cause it. The stall skips frames after contact: in the final run black N shows 17 of 32 frames, black NE and white N show 27 of 32, and the three other attacks show all 32. The frame at 360 ms draws with the contact callback in all six.
- The idle timer draws about 20 times each second, so 4 of the 34 squat drawings do not show. The old idle timer is unchanged.
- The rest PNG is sharper than the softer frames beside it in the new banks.
- The scan lists more faults that this ticket does not fix: the Knight white salute and lance tap idles, the Maester ocular idle, walks over their step pattern and Knight or Paladin leap landings.
