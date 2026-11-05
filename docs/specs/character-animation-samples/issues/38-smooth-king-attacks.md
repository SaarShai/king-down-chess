# Smooth king attacks

Status: ready-for-review
Type: task

Issue 37 gave 191 attack banks painted keys plus Codex in-betweens. It kept 64 attack banks of Flame, Frost, Mud and
Shadow keys only, because their first machine in-betweens failed the visual check. The owner then saw new previews:
the owner accepted Flame, Mud and Shadow, and asked for a fix of the frost ice blade. The fixed frost strips show the
sword in every frame (`~/kd-runs/frost-blade/frost-blade.md`). This ticket gives the 64 banks smooth in-betweens, so
all 256 attack banks are smooth, except the paladin black N bank that issue 37 keeps keys only.

## Scope: 64 banks

| Character | Banks | In-betweens | Method | Frames per bank | Duration |
|---|---:|---:|---|---|---|
| king-flame | 16 | 145 | `rife-4.25-new` | 17, 18, 21, 27 | 840 or 1080 ms |
| king-frost | 16 | 48 | 39 `frost-sword-fix`, 9 `rife-4.25-new` | 9, 10, 11 | 520 ms |
| king-mud | 16 | 248 | `rife-4.25-new` | 20, 23, 26 | 1080 ms |
| king-shadow | 16 | 196 | `rife-4.25-new` | 13, 16, 17, 18, 19, 20, 23 | 880 ms |

- The Flame, Mud and Shadow banks come from the entries of catalog `ccd62fb3` (the previews the owner accepted), byte
  for byte.
- The Frost banks are new builds from `~/kd-runs/frost-blade/banks/`. Each bank keeps the key kinds, key offsets,
  `durationMs`, `beatTimes` and pivot of its keys-only bank. 39 frames use the method `frost-sword-fix` and 9 RIFE
  frames stay from the first build.
- All other banks of the catalog stay byte equal.

## Rules

- A smooth bank plays the accepted keys at their shipped times. The new frames sit between them.
- The bank metadata (canvas, pivot, body height, target point, effect anchors, beat times, contact time) stays byte
  equal to the shipped bank.
- The key frames keep their pixels, offsets and times. The in-betweens are content-hashed and additive.

## Records

- `smooth-attack-frames.json` lists 255 smooth banks and 3,039 in-betweens. Issue 37 listed 191 banks; this ticket
  adds the 64 king banks with 637 in-betweens.
- `painted-attack-keys.json` does not change. The 64 banks already had accepted keys and contact times; the smooth
  banks keep them.
- `tools/painted-attack-package.test.ts` now expects 255 smooth records, not 191. The keys-only set of the four kings
  is gone: every accepted record must have a listed smooth record.

## Build

- Scratch catalog `/Users/za/kd-runs/attacks2/catalog`, built from the MAIN catalog `f6d3992...` (the catalog that
  PR 241 promoted). The catalog keeps a frozen copy at `catalogs/0467714b....json`.
- `runtime-selection.json` is re-pinned to catalog
  `0467714b9af161c65062ee86fa9f5069eabc6292756bb2f293d841dca3fe2c52`: 738 entries, 64 attack rows changed from the
  base.
- The package comes from `tools/build-character-runtime.mjs` and `tools/convert-character-runtime-webp.mjs`. 6,885
  WebP files are reused and 637 are new.
- At merge, the orchestrator promotes the scratch catalog into the frozen catalog of the main checkout. The commands
  are in the PR body.

## Verification (2026-11-05, base staging/first-game 3f193a93f)

- Catalog: 1,040 entries. 64 banks differ from the base (16 per king). Assets go from 8,133 to 8,172: 39 added, none
  removed. All other entries and all other assets are byte equal.
- Frame check per bank: every new bank keeps `durationMs`, `canvasSize`, `pivot`, `beatTimes`, `contactMs` and the
  start and end frames of the base bank. Every base key time is a frame time of the new bank. The new banks hold
  1,166 frames: 341 Flame, 160 Frost, 368 Mud, 297 Shadow.
- Runtime manifest: 738 banks, 64 differ, all of kind attack. All 6,885 base assets are byte equal. 637 WebP files
  are new. Package: 160,279,371 to 177,514,403 bytes (+17.2 MB, +10.7%), 6,919 to 7,556 files.
- `assets.json` is 2,321,425 bytes. It stays on `tools/gate/size-allowlist.txt`; the reason now names 7,522 frame
  records.
- Smoothness scan (`jumpscan2.py`; alpha-centroid step in px and IoU for each frame pair): no new bank has a larger
  centroid step than its base bank. The worst rise is 0.0 px for each of the four kings; 64 of 64 banks are at or
  below the base bank.
- `npm test` with KINGDOWN_TEST_FILE on tools/anim/*, animation-bank, animation-queue,
  character-runtime-package, painted-attack-package, gate and src/render/character-runtime: 9 files, 156 tests
  (151 pass, 5 skip); the node tests pass, 70 of 70.
- `npm run test:docs`: 17 files, 186 tests pass, 1 skip.
- `npm run check:browser character-runtime` (Chromium): pass, 160.0 s. With `PLAYABLE_BROWSER=webkit`: pass, 168.5 s.
