# Painted-key attacks

Status: claimed
Type: task

## Plan and checks

- Freeze the accepted piece and king keys in a separate catalog. Repair only the seven border defects.
- Pin the attack banks. Keep key times, contact cues, and standing poses.
- Play king captures toward the target. Hold each painted key without a blend.
- Build the WebP package. Check every attack frame, endpoint, cue and border.
- Run focused tests, both browser checks and the Vercel checks.
- Make the before-and-after game preview. Open the staging pull request and check CI.

## Exception

Keep the shipped Paladin black north attack. The accepted clip uses a different north rest. Replace the other 255 banks.

## Implementation

The catalog copy holds 159 replacement piece banks and 96 new king banks. It holds 2,725 painted key references. The Paladin black north bank stays at its shipped hash. The accepted clip starts on a different north rest. It needs a later art decision.

The seven source border repairs and their hashes are in `painted-attack-border-fixes.json`. The accepted key hashes and times are in `painted-attack-keys.json`. The 41 piece clips and 13 king clips flagged for fast pops keep their accepted keys.

Some king frames have a smaller canvas inside the clip canvas. The builder checks their centered offsets. Playback uses the image size to keep the foot pivot in place. The public manifest field allow-list stays the same.

The prior package has 478 banks, 9,047 frame references, 5,455 files and 124,537,245 bytes. The new PNG build has 574 banks, 7,862 frame references and 4,587 distinct frame assets. It holds 2,741 attack frame references, including the 16 frames in the retained Paladin bank.

The Maester, Queen and Archer release times match the candidate contacts for all 48 banks. Each separate effect keeps its existing contact delay. The legacy contact effects use the body contact time through the scene time map.

The source rest audit checks both ends and the world transform of every attack. The 255 promoted banks pass. The retained Paladin black north bank has the same rest mismatch at both ends; this is the stated exception.

The WebP converter removes alpha 1 only on attack-frame borders after resizing. It rejects a stronger border pixel. This clears ten derived pixels in six frames; it does not change the source art. The package has 4,621 files and 109,877,503 bytes.

## Checks

- The focused runtime and package tests pass 71 cases and 68 board checks. The package test checks key hashes, times, cues, king counts and every attack border.
- `npm run test:docs` passes 187 cases.
- `npm run check:browser character-runtime king-capture-facing` passes. The checks take 82.8 and 62.3 seconds.
- `npm run check:browser web-online` passes in Chromium and WebKit. The checks take 112.8 and 104.3 seconds.
- `npm run build:vercel` and `npm run check:vercel` pass with a disposable local database. The published manifest, private-data and image guards pass.
- The owner preview has 32 before and 32 after game recordings. Each after capture shows at least two keys from the attack bank that faces its target.
