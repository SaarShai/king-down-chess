# Movement rest registration

Status: claimed

## Plan and checks

- Use the shipped facing rest for movement scale and pivot. Preserve its pixels and add transparent space for poses.
- Check pivot-aligned endpoints, the seven gates, and the runtime builder's scale and placement.
- Rebuild the Pawn turn proofs and three failed movement jobs. Run the focused tests and CI.
- Prepare a resumable local rerun of failed jobs. Do not start the batch or change the catalog.

## Evidence

- The Knight white SE, Pawn white NE and Pawn white SE jobs pass all seven gates on this Mac.
- All 264 jobs pass the facing-rest geometry preflight. This does not run their in-betweens.
- The rebuilt white and black Pawn SE to S turns keep their three key files byte-identical to the prior proofs.
- PR 217's builder places a padded Knight rest at the same pivot and scale as its turn. The runtime pixels match.
- The game-size sheet and local rerun script are in the movement geometry run folder. The full rerun is not started.
