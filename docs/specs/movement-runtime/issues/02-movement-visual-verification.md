# Movement visual verification

Status: ready-for-human

Plan: link the pinned runtime package read-only. Record quiet movement on the game board for both armies and all 17 designs. Inspect forward, diagonal and backward movement at game size and normal speed. Record each result with media and time.

Checks: each case shows the turn out, facing during travel, turn back and rest. Note any pop, flash, missing frame, matte or wrong facing. Keep the package unchanged. Explain animation probes that are not legal moves.

## Result

All 17 designs pass for both armies. Each clip turns to the move, travels with its gait, turns
back to rest and has no pop, flash, wrong facing, missing frame or visible jump.
The clips are in the run output (`media/<character>-<army>.webm`), one contact sheet each.

| Character | White | Black |
| --- | --- | --- |
| Pawn | PASS, 0.51–4.27 s | PASS, 0.31–3.81 s |
| Knight | PASS, 0.44–6.98 s | PASS, 0.33–6.63 s |
| Bishop | PASS, 0.36–3.98 s | PASS, 0.33–3.94 s |
| Rook | PASS, 0.35–3.96 s | PASS, 0.34–3.71 s |
| Queen | PASS, 0.36–3.98 s | PASS, 0.37–3.51 s |
| Archer | PASS, 0.37–4.18 s | PASS, 0.35–4.16 s |
| Guard | PASS, 0.47–4.28 s | PASS, 0.36–3.92 s |
| Maester | PASS, 0.35–4.64 s | PASS, 0.36–4.17 s |
| Ogre | PASS, 0.36–4.18 s | PASS, 0.37–3.71 s |
| Paladin | PASS, 0.37–7.20 s | PASS, 0.36–6.71 s |
| Beast | PASS, 0.36–5.61 s | PASS, 0.34–4.17 s |
| Frost King | PASS, 0.47–4.28 s | PASS, 0.28–3.60 s |
| Flame King | PASS, 0.32–4.13 s | PASS, 0.32–3.64 s |
| Shadow King | PASS, 0.32–4.17 s | PASS, 0.33–3.66 s |
| Mud King | PASS, 0.37–4.19 s | PASS, 0.28–3.62 s |
| Spirit King | PASS, 0.34–4.14 s | PASS, 0.31–3.63 s |
| Stratus King | PASS, 0.34–4.15 s | PASS, 0.32–3.65 s |

## Scope and limits

- The probes call `view.scene.play` on the real board. Some probes are not legal moves: a quiet
  one-square step for every design, in the forward, diagonal and backward direction of its army.
- The scene puts the piece back on d4 between probes. That snap is a reset, not a game move. It
  is in the clip, outside the judged move window.
- The pinned package has no movement banks. The scene draws the end frame of the turn route and
  moves the figure with its gait, lift and lean. This is the current design, not a defect.
- The package, the product code and the art are unchanged. The runtime link is not committed.

## Verification

- `bash record.sh` records three batches. Each batch exits 0 and writes 34 clips.
- `node audit.mjs`: 102 probes; 0 without travel samples; 0 with unexpected travel pixels.
- `node motion.mjs`: 102 cases; 0 position faults; net travel matches the target square; the
  largest step between samples is 20.4 px (a square is 112 px).
- `python3 flash.py`: 34 clips; 0 brightness spikes after the page settles (largest deviation
  0.6 levels); 0 playing samples without a character frame.
- `node alpha.mjs`: 980 drawn assets; 13 have 1–12 border pixels at alpha 1–4; 0 have an opaque
  border or no alpha channel.
- The King fixture is fixed: two kings and two pawns, so no draw dialog covers the board. The
  recording mode asserts on that dialog and all six king designs pass.
- The manifest stays `05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e`.

## Recording mode

`MOVEMENT_RECORD=<design,…> MOVEMENT_RECORD_OUT=<dir> npm run check:browser movement-runtime` records
each design for both armies, with a trace and a video. The design list accepts `pawn`, `knight`,
`bishop`, `rook`, `queen`, `archer`, `guard`, `maester`, `ogre`, `paladin`, `beast` and
`king-frost`, `king-flame`, `king-shadow`, `king-mud`, `king-spirit`, `king-stratus`.
Without `MOVEMENT_RECORD` the check runs its linked-package check as before.
