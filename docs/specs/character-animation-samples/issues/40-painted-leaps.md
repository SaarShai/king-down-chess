# Painted Knight and Paladin moves

Status: local checks pass. PR and catalog promotion remain with the owner.

## Plan and checks

1. Extend the frozen catalog in `/Users/za/kd-runs/leap-integrate/catalog`. Keep every base entry and file. Add 16 Knight banks and 16 Paladin banks. Use candidate banks only.
2. Use the existing movement preparation, image limits, paths and contact times. Keep code motion when a bank is absent or cannot load. Keep turns, standing joins and exact landing squares.
3. Check bank choice and fallback with a small test. Update package counts. Build PNG and WebP with the existing tools. Compare all base banks and assets.
4. Run the focused lane checks once. Record real Chromium game moves in both armies. Inspect the GIF at normal speed. Open one PR and inspect CI. Do not merge, promote or deploy.

Owner request: “put the painted Knight and Paladin jumps in the game”.

## Result

The scratch catalog is `/Users/za/kd-runs/leap-integrate-last-four/catalog`.
Its SHA-256 is `fd84e01b2e401e6eafa9a282e4d8a41b0d7170a36b41a439f14ee2b1412813b2`.
It keeps every base entry and file. The selection keeps all 814 base banks unchanged.
The package keeps all 7,807 base WebP files unchanged and adds 224 files.

The package has 846 banks: 46 idle, 272 turn, 256 attack, 240 walk and 32 jump.
The jump count is 16 Knight and 16 Paladin. Both pieces have all eight facings in both armies.
The runtime uses the existing movement kind. It holds each pose at its recorded time.
Quiet Knight and Paladin moves use the new banks. Both capture actions keep their existing attack banks and timing.
The paths, contact times, ground shadow and target squares stay in the scene.

The importer adds a four-pixel transparent margin and shifts each pivot by four pixels.
It preserves all source pixels, including faint alpha at the old edge. Source hashes stay in the catalog.
A large, partly cached charge can lose its cached poses while missing poses load.
Jump preparation now reserves the whole bank and releases it through the existing action cleanup.
Walk preparation stays unchanged. The cache limit stays at 64 MiB and six active loads.

## Evidence

- Focused check: 171 cases in the runtime, scene and package files pass. The 70 board cases pass.
- After the cache fix, the runtime file passes 80 cases. The 70 board cases pass again.
- Doc checks: 187 pass, one existing skip. The count check covers all 32 jumps.
- `npm run check:browser painted-leaps` passes in Chromium. It records quiet SE moves in both armies for both pieces.
  It checks all eight pose times, constant scale, exact target at contact and at the end, six active loads and 64 MiB.
- `/Users/za/kd-runs/leap-integrate/game.gif` has four normal-speed clips. It is 720 by 648 pixels and 8.32 seconds.
  Native browser playback and a frame sheet show discrete pose steps. No clear scale pop or shifted landing appears.
- Browser checks first expose the partial-cache fault. They pass after the reservation fix. Temporary probes are removed.

The old Knight/Paladin skip has no named test in the base branch. The new selection check replaces that assumption.
The base has no fixed total-bank doc test. The doc check records the current totals. See ticket 41 for the last four banks and their checks.
No full local suite, other facing playback, capture callback browser run, board-edge sweep or mobile check runs.
No independent reviewer, judge, image call, merge, catalog promotion or deploy runs.

## Last four Paladin banks

[Ticket 41](41-paladin-last-facings.md) records the replacement of the four rejected drafts.
The importer runs with this exact command from the prior selection pin. The output folder does not exist before the run.

```sh
python3 tools/anim/import-painted-leaps.py --base "$HOME/kd-runs/leap-integrate/catalog" --out "$HOME/kd-runs/leap-integrate-last-four" --png-cache "$HOME/kd-runs/leap-integrate/runtime-png" --runtime --apply
```

The owner promotes the new pinned catalog at merge.
