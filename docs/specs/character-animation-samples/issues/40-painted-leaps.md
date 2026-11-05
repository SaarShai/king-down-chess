# Painted Knight and Paladin moves

Status: local checks pass. PR and catalog promotion remain with the owner.

## Plan and checks

1. Extend the frozen catalog in `/Users/za/kd-runs/leap-integrate/catalog`. Keep every base entry and file. Add 16 Knight banks and 12 Paladin banks. Exclude rejected drafts.
2. Use the existing movement preparation, image limits, paths and contact times. Keep code motion when a bank is absent or cannot load. Keep turns, standing joins and exact landing squares.
3. Check bank choice and fallback with a small test. Update package counts. Build PNG and WebP with the existing tools. Compare all base banks and assets.
4. Run the focused lane checks once. Record real Chromium game moves in both armies. Inspect the GIF at normal speed. Open one PR and inspect CI. Do not merge, promote or deploy.

Owner request: “put the painted Knight and Paladin jumps in the game”.

## Result

The scratch catalog is `/Users/za/kd-runs/leap-integrate/catalog`.
Its SHA-256 is `687477e752d7aac7f96daef14c0d38ab1cd44e68f31fc7ef50854eee4a9c8034`.
It keeps every base entry and file. The selection keeps all 814 base banks unchanged.
The package keeps all 7,807 base WebP files unchanged and adds 196 files.

The package has 842 banks: 46 idle, 272 turn, 256 attack, 240 walk and 28 jump.
The jump count is 16 Knight and 12 Paladin. Paladin NW and NE in both armies remain absent.
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
- Doc checks: 187 pass, one existing skip. The new count check covers the 28 jumps and the four absent drafts.
- `npm run check:browser painted-leaps` passes in Chromium. It records quiet SE moves in both armies for both pieces.
  It checks all eight pose times, constant scale, exact target at contact and at the end, six active loads and 64 MiB.
- `/Users/za/kd-runs/leap-integrate/game.gif` has four normal-speed clips. It is 720 by 648 pixels and 8.32 seconds.
  Native browser playback and a frame sheet show discrete pose steps. No clear scale pop or shifted landing appears.
- Browser checks first expose the partial-cache fault. They pass after the reservation fix. Temporary probes are removed.

The old Knight/Paladin skip has no named test in the base branch. The new selection check replaces that assumption.
The base has no fixed total-bank doc test. The new doc check records the current totals.
No full local suite, other facing playback, capture callback browser run, board-edge sweep or mobile check runs.
No independent reviewer, judge, image call, merge, catalog promotion or deploy runs.

## Last four Paladin banks

Replace the rejected NW and NE production folders in both armies with accepted candidate files and matching metadata.
From a worktree with this selection, run this command. The new output folder must not exist.
The source catalog must match the selection pin. The owner can use the scratch catalog before promotion.

```sh
python3 tools/anim/import-painted-leaps.py --base "$HOME/kd-runs/leap-integrate/catalog" --out "$HOME/kd-runs/leap-integrate-last-four" --png-cache "$HOME/kd-runs/leap-integrate/runtime-png" --runtime --apply
```

This command adds the four banks and rebuilds PNG, WebP and the selection. No runtime code change is needed.
Update the count doc test to 846 total banks, 32 jump banks and all eight Paladin facings.
Run the focused checks and inspect the new facings. The owner promotes the exact new catalog at merge.
