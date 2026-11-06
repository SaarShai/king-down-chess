# Replace the flagged Flame attacks and the Mud idle

Status: local checks pass. The final Flame N and NE banks, the orchestrator's go and CI are still open.

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

## Known faults

- Deselect, or a selection of a different piece, during a deep squat jumps to rest in one frame. The scene has no exit for these two cases. This also applies to the Stratus idle.
- Straight-file captures: the scene puts White on the left of the target and Black on the right. Each new N and S bank reaches to one side in both armies. Black N and White S reach away from the target.
- The black N, NE and S frames have a mottled cape and rough cape edges beside the old banks. The fault is visible at game size in N.
- The first capture in a fresh browser has a stall of 215 to 534 ms after contact. An unchanged bank has the same stall, so the new banks do not cause it.
- The idle timer draws about 20 times each second, so 4 of the 34 squat drawings do not show. The old idle timer is unchanged.
