# Smooth attacks

Status: ready-for-review
Type: task

Owner ruling 2026-11-01: "attacks - A is much better." A is the painted keys plus the Codex in-between frames.
This ticket puts A back on 191 of the 256 attack banks. Walks stay painted poses only.

## Scope: 191 banks

| Character | Banks | Source of the in-betweens |
|---|---:|---|
| pawn, knight, bishop, archer, maester, queen, beast, rook, ogre | 9 x 16 = 144 | old Codex timelines of catalog 6279af2e |
| paladin | 15 | old Codex timelines; black N keeps its shipped bank |
| king-spirit | 16 | Codex in-betweens of the selected draft |
| king-stratus | 16 | Codex in-betweens of the selected draft |

- Pieces: 159 banks. Kings: 32 banks. In-between slots: 2,402 (1,618 piece, 784 king).
- The two border-fixed keys of PR 235 stay in place (beast black N 330 ms, ogre white W 373 ms).
- The army colour picks are not part of this change. Every bank keeps its current colours.

## Why Flame, Frost, Mud and Shadow stay keys only

Codex drew these four kings as keys only, so they have no Codex A. A first build made new machine in-betweens for
their 64 banks with `tools/anim/rife.py`. The frames passed the numeric gates, but a visual check found them bad:

- Mud (16 of 16): the claw arm smears into a double image.
- Frost (16 of 16): the ice blade disappears.
- Shadow: NE and SE lose the blade or crossfade the cape.
- Flame: a faint smear on the fist.

The owner did not see these four kings smooth. So the 64 banks keep their shipped keys-only banks: their rows in
`runtime-selection.json`, their runtime manifest entries and their assets equal the base (staging tree a860d9e0).

## Rules for the timelines

- A machine frame that equals a key, or that sits between two equal keys, leaves the timeline.
- Repeated adjacent frames merge into one held frame.
- Smooth banks play their keys at the old smooth times. Bank metadata (pivot, bodyHeightPx, targetPoint,
  effectAnchors, beatTimes) stays byte-equal to the shipped banks.

## Records

- `smooth-attack-frames.json` lists, for each of the 191 smooth banks, the key times and every in-between with
  its two source keys and method. For these banks the key times come from this file.
- `painted-attack-keys.json` stays the record of the accepted keys (hashes, order, contactMs). Its times are the
  keys-only times. They are current for the four keys-only kings. For the 191 smooth banks they are stale:
  they agree within 1 ms (1/3 ms rounding), except that 47 banks had their second key moved to 120 ms by the
  keys-only build (pawn 14, maester 14, ogre 2, Spirit 16, Stratus 1). The smooth banks put that key back.
- `tools/painted-attack-package.test.ts` checks:
  - every attack frame is an accepted key or a listed in-between, keys in order, and each in-between between
    its two source keys;
  - the frame at `contactMs` is the record's contact key;
  - the four keys-only kings equal their accepted record exactly (hashes and times);
  - smooth key times agree with the accepted record by the rule above, with exactly 47 moved second keys.

## Build

- Scratch catalog `/Users/za/kd-runs/attack-restore/catalog`. The 64 keys-only king entries are the base entries
  again; the catalog keeps the unused machine banks (content-hashed, not selected).
- Package from `tools/build-character-runtime.mjs` and `tools/convert-character-runtime-webp.mjs`.
- At merge the orchestrator promotes the scratch catalog into the frozen catalog of the main checkout.

## Verification (2026-11-01, base staging/first-game 134e2b2f)

- Catalog `f6d39928535eb0653c8b5a1ba1907b1a6a2e02ba658168fb87bef6c3e754befd` (frozen in `catalogs/`). The 64
  keys-only king entries equal the base catalog `e5d2421b...` entries; the bank hashes were read from the bytes.
- `runtime-selection.json`: 191 attack rows and `catalogSha256` differ from the base; all other rows are equal.
- Runtime manifest: 191 banks differ from the base, all attack banks of the 12 smooth characters. The 64 attack
  banks of Flame, Frost, Mud and Shadow are equal to the base. All 5,259 base assets are equal; 1,626 WebP added.
- Package: 127,925,603 to 160,279,371 bytes (+32.4 MB, +25.3%); 5,293 to 6,919 files.
  `assets.json` is 2,125,144 bytes (over the 2 MB gate) and is in `tools/gate/size-allowlist.txt`.
- `npm test` with KINGDOWN_TEST_FILE on tools/anim/*, animation-bank, animation-queue, character-runtime-package,
  painted-attack-package, gate and src/render/character-runtime: 9 files, 156 tests pass; node tests 70 pass.
- `npm run test:docs`: pass. `npm run check:browser character-runtime` (Chromium): pass, 190.3 s.
- Final-package preview, 6 banks at game size, final beside base: pawn white E (7 to 25 frames), bishop black SE
  (21 to 49), Spirit white N (7 to 21), Stratus black SW (5 to 45) play smooth with no double image. Mud black E
  and Frost white NE have the same frames, times and WebP bytes as the base.
