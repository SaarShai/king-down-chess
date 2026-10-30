# Animation bank pipeline

Status: claimed

## Plan and checks

- Build the bank command on the retained alpha interpolation and registration methods. Check alpha, joins, geometry, timing and playback.
- Add a locked queue, dispatcher and promotion path. Check parallel claims and failed jobs.
- Rebuild a shipped turn and dispatch a queued job. Run the focused tests and record the results before the pull request.
- Keep army color work and source records in the other branch.

## Progress

The pipeline is in `tools/anim/`. `bank.mjs make` registers keys to the locked geometry, makes alpha RIFE in-betweens,
runs seven gates, writes a candidate bank in the catalog schema, records provenance for each frame and renders light,
dark, checkerboard and board previews at 160 px. `queue.mjs` and `dispatch.mjs` run jobs, `promote.mjs` publishes a
green candidate under the catalog lock, and `compare.mjs` measures a rebuild against the shipped bank.

### Locked geometry

`geometry.mjs` reads pivot, canvas, body height and board scale from the runtime manifest and records the manifest
SHA-256 as the authority. It prefers `tools/anim/sources/<character>.json` when that file holds geometry; this branch
does not create or change those records. The other branch's records hold master hashes but no geometry, so the shipped
runtime bank is the authority, as the orchestrator decided. For the white Pawn this gives canvas 768x768, pivot
384,700, body height 480, authority manifest `05ff4c21...07f9e`.

### End-to-end proof

- Rebuilt the white Pawn SE to S turn from its three shipped keys. The keys keep every pixel. All seven gates pass.
  The three keys and the final frame are byte-identical to the shipped bank. The six recursive RIFE in-betweens differ
  from the shipped direct-timestep frames: mean absolute RGBA error 0.011 to 1.08 of 255, changed channels 0.07 to
  5.9 percent. The full report is `comparison.json` in the run output.
- Rebuilt the black Pawn SE to S turn the same way: keys identical, mean absolute RGBA error 0.015 to 1.16 of 255.
- Ran the black rebuild as a queue job. `dispatch.mjs --slots 1` claimed it once, ran the real bank command, and left
  status `candidate`. An earlier attempt failed at the matte-halo and endpoint gates; the queue recorded status
  `rejected` with the reason. That attempt led to the calibrated halo limit and the facing rule.
- Promoted the white candidate into a copy of the frozen catalog. The catalog entry became `ready`, the bank is
  content-hashed, the frame assets are copied, and a second promotion wrote the same bank hash.

### Checks

`KINGDOWN_TEST_FILE=tools/animation-bank.test.ts npm test` passes 6 tests. `KINGDOWN_TEST_FILE=tools/animation-queue.test.ts`
passes 2 tests. `npm run test:docs` passes 187 tests. The tests use a stub in-betweener, a fixture geometry record and
a fixture catalog. No browser check runs locally: the change adds tools only and publishes no runtime bank.

Pull request 215 into `staging/first-game` holds the work. Its ten CI checks pass, including the full `verify` suite
and the browser checks. The pull request is not merged.

### Limits

- The matte-halo gate is a numeric screen. It cannot prove visibility. The previews still need a look at game size.
- Promotion does not re-pin `runtime-selection.json`. The owner re-pins the selection after review; until then the
  shipped build does not change.
- The RIFE run used the M1. This Mac has no torch environment and the runtime is on the M1.
