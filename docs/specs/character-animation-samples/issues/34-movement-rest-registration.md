# Movement rest registration

Status: claimed

## Plan and checks

- Use the shipped facing rest for movement scale and pivot. Preserve its pixels and add transparent space for poses.
- Check pivot-aligned endpoints, the seven gates, and the runtime builder's scale and placement.
- Rebuild the Pawn turn proofs and three failed movement jobs. Run the focused tests and CI.
- Prepare a resumable local rerun of failed jobs. Do not start the batch or change the catalog.

## Review fix plan

- Align each authored key to the facing rest foot and gate its position.
- Keep each movement bank’s own facing-rest scale in the runtime builder.
- Recheck the movement authority at promotion. Run focused tests, five local builds and CI.

## Evidence

- The Knight white SE, Pawn white NE and Pawn white SE jobs pass all seven gates on this Mac.
- All 264 jobs pass the facing-rest geometry preflight. This does not run their in-betweens.
- The rebuilt white and black Pawn SE to S turns keep their three key files byte-identical to the prior proofs.
- The first builder proof used an older builder. The merged builder needs the review fix above.
- The game-size sheet and local rerun script are in the movement geometry run folder. The full rerun is not started.
- `KINGDOWN_TEST_FILE=tools/animation-bank.test.ts npm test` passes 7 selected tests. Its bundled checks pass 67 tests.
- All 264 padded rests match the shipped runtime pixels after the half-size conversion. Their pivots and scales match.
- `promote.mjs --dry-run` gives a `movement-study` entry with the facing direction. It writes no catalog.

## Review fix evidence

- The rest foot sets each key's horizontal target. The gate checks authored feet and identical rest pixels.
- The runtime builder keeps the movement bank's own facing-rest height. The 264-job check has no height mismatch and no throw.
- Five local banks pass all seven gates. Their authored feet are within 1.5 source px of the rest foot.
- The frame foot screen records maximum steps of 18.77, 45.85, 38.44, 19.81 and 77.88 source px for Pawn, Knight, Rook, Stratus and Shadow. It does not pass a small-step limit. The lowest visible shape changes in the interpolated frames. Do not use this screen alone to claim a smooth join.
- The game-size light and dark join sheet is in the review run folder. No catalog or selection changes.
