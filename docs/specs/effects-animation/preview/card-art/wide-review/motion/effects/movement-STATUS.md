# Wide movement motion

Status: ready for host integration and owner motion review. No commit or production change.

Plan: fit cached cloth, leaf, wind, mist and dust layers to the seven approved wide paintings. Keep the rook, bishop, pawns, stags, soldiers and weapons fixed. March uses the prepared top crop. Hop keeps the renderer id `vault`. Add Rally with its approved banner painting, preserve the existing six effects, and check its separate base wakes and fixed pieces/pole.

Checks: exact original at both awaken endpoints and in reduced motion; deterministic seek; seamless eight-second idle loop; caller context restore; no pixel reads or new surfaces during draw. Inspect useful sampled frames at 512 × 288. Parent owns host and browser checks.

## Result

- Haste: source gold grains travel along its painted ground sweep. The torn red banner flutters from its fixed pole. Rook stone stays fixed.
- Flight: the two loose red tips flutter. Painted cream wind and four painted leaves drift. Bishop, its wrapped center ribbon, and pawns stay fixed.
- Leap: pale valley mist drifts under the fixed tan stag. Small source plant-leaf cutouts move through the open valley. Pawns stay fixed. This is the quietest effect.
- Hop (`vault`): six source leaves, four small loose stone cutouts, cream wind and warm source grains move around the fixed brown stag. No anatomy motion.
- March: four painted flags breathe. Cream cloud/dust layers and small source grains move in the prepared top crop. Bronze army paint, drum and mallets stay fixed. No drum action.
- Strike: only the red plume and two loose cape edges flutter. Warm source dust drifts and tiny source-metal highlights brighten at fixed coordinates. Warrior, hands and weapon stay fixed. No attack motion.
- Rally: the central red cloth, its crown/fringe and its two loose red streamers move from their upper attachments. Two separate painted cream-dust wakes and restrained source-gold grains move at the rook and bishop bases. Rook, bishop, pole, pedestal and architecture stay fixed.

All layers, masks and source samples are cached at creation. Draw uses the original base each frame, finite time handling, saved context state and no pixel reads or new surfaces. Atmospheric source masks exclude fixed figure paint before it can drift. Each fixed contour gets its own exclusion clip, so overlapping body and weapon shapes remain protected.

Rally uses one extra cached composite surface. Its full painted motion fades once during awakening, so separate cloth/plate fades cannot reveal the large banner's fill. The six earlier effect branches and draw behavior stay unchanged.

## Evidence

`node --check` passes. The native Canvas assert check at `/tmp/wide-movement-check.mjs` passes for all six ids: byte-equal reduced frames and awaken endpoints; idle 0 equals 8 seconds; repeat seek after another time; caller transform, alpha and composite restore. Selected interior paint boxes for every figure/army also remain byte-equal at idle 1.1 seconds. The check uses the bundled Canvas library; it adds no dependency.

Fixed sample boxes use `[x,y,width,height]` in the 512 × 288 frame:

- Haste rook: `[264,105,35,35]`.
- Flight bishop and pawn: `[247,108,17,25]`, `[142,243,8,8]`.
- Leap stag torso and face: `[224,108,38,20]`, `[164,95,9,7]`.
- Hop stag torso and face: `[261,111,30,18]`, `[310,89,13,9]`.
- March army: `[110,133,13,19]`, `[300,160,5,12]`.
- Strike armour, arm and boot: `[232,105,20,14]`, `[275,126,9,9]`, `[258,242,7,9]`.
- Rally rook, bishop, pole and architecture: `[151,151,25,30]`, `[153,115,19,14]`, `[394,185,14,20]`, `[394,145,12,16]`, `[282,49,2,85]`, `[27,90,15,30]`, `[274,184,25,15]`.

The Rally check at `/tmp/rally-movement-check.mjs` passes exact reduced frames, both awaken endpoints including clamped time, idle 0/8 equality, deterministic seek, caller context restore and all seven fixed sample boxes across eight sampled frames. Thirty Rally draws create no surfaces and read no pixels. The original six effects remain byte-equal to the saved pre-Rally renderer at eight frames each (48 comparisons). The added source is the approved 1672 × 941 Rally banner painting, prepared with contain scaling at 512 × 288. Inspected `/tmp/rally-movement-contact.png`: idle 0.8/2.1 seconds and awaken 1.1/2.1 seconds. Both base wakes remain separate and restrained.

Inspected the sampled 512 × 288 contact sheet at `/tmp/wide-movement-frames/contact.png`. It places idle 1.1 and 2.1 seconds in adjacent rows for each card. Use idle 0.8, 1.1, 2.1 and 5.2 seconds, or awaken 0.55, 1.1 and 2.1 seconds, for motion review. The endpoints show the exact original. Leaf and cloth excursions use nearby source paint under their exposed edges; this method is for the current short travel.

No server, browser check, full test suite, dependency change, image generation or artwork change ran in this lane. Host rendering and continuous playback review remain with the parent.

## Current preview revision

The noticeability pass supersedes the initial amplitudes and the unchanged-renderer claims above. See `docs/specs/effects-animation/issues/32-motion-noticeability.md` for the final changes, independent findings, evidence paths and observation limits. Original artwork remains unchanged.
