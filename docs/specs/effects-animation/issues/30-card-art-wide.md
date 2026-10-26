# Artwork for the wide cards

Status: complete; full proposal set shown for feedback

The owner asks to redo all card artwork for the card aspect ratio except Freeze and March. The owner also asks for proposals where paintings are missing and an update of the original game artwork. Called Home rising from the dead world is already approved and designed for 16:9.

## Plan and checks

1. Keep Freeze and March. Carry the approved Salvation composition forward. Redesign the other nine current paintings for 16:9. Make nine first paintings for the released cards that currently use rule pictures. Refresh Rescue and the card back as legacy extras.
2. Use the built-in image generator, one image per card. Keep the painted fantasy family, each card's own story, and all key content inside the wide frame with edge clearance. Preserve identifiable current subjects where possible; update older flat illustrations in the same painted family. Parent owns images and prompts; isolated helper owns the review gallery. A read-only helper checks the exact card rules for the missing-art concepts.
3. Show current and proposed artwork in a gallery as batches arrive. Inspect all resulting images, real16:9 card frames, completeness, loads and phone/desktop layout. Save prompts and generated originals. The owner reviews visual proposals before game integration.

## Scope

23 review rows:21 released cards and 2 extras.20 newly generated images, plus the approved Salvation painting and 2 retained paintings. Original-game artwork means the legacy card illustrations and back in this card-art review. Character artwork is outside this card task. The public source images and catalog remain intact for comparison.

## Verification criteria

Every requested row has either its preserved source or a finished proposal. New images use a wide composition; all key subjects, bases, shadows and magical action remain visible. The proposal frame preserves the whole image without stretching. The game crop comparison uses current renderer behavior. Browser check covers23 rows, ready asset loads, comparison geometry, navigation, desktop/phone overflow and errors. Record actual checks and owner feedback before marking complete.

## Result

The gallery has 23 ready entries:20 new paintings, the approved wide Salvation painting, and unchanged Freeze and March. The nine redesigned current paintings are Ice Wall, Strike, Haste, Flight, Sacrifice, Leap, Mimic, Vault and Sky Lift. The nine first paintings are Mirror, Firewall, Earth Quake, Burn, Fire Starter, Control, Rally, Morph and Curse. Rescue and the card back are refreshed additional files. The owner approves the first redesigned set's direction: “Keep this direction.” The owner approves all nine first paintings: “All nine work.” The legacy extras await specific feedback.

All new selected images are 1672 × 941, near16:9. Each uses the whole image inside a definite16:9 contain window, with no crop or stretch. Current cards use the actual renderer and its existing top-clipping behavior. Freeze/March show their exact game frame on both sides, with byte-identical source copies. The phone view shows the new painting first; desktop shows current and proposal beside each other. Named buttons, Previous/Next, keyboard arrows, direct hash links and full-image links work.

The built-in image tool makes 23 outputs:20 requested images plus 3 targeted corrections. Vault revision 2 restores antler clearance. Control revision 2 retains a conventional carved knight bust and pedestal instead of living forelegs. Earth Quake revision 2 removes a generated signature-like mark. Exact prompts and edit-reference paths are saved in the preview's PROMPTS.json; PROMPTS.md states the direction and CONCEPTS.md records actual rule meanings. Generated originals stay in the image store. Selected copies are in the project's wide-review/art folder.

## Verification

`npm run check:browser card-art-wide` passes in final run `effects-integration-K6EaNv`: all 23 proposal paths exist, all images load, the current renderer matches, the new sources fit16:9, the two kept cards retain their current frame, desktop and phone layout work, and keyboard/hash navigation, overflow and browser-error checks pass. The check saves 23 card comparisons and 2 full-page views. The parent inspects the generated images, rendered comparisons and phone ordering. Native browser inspection verifies the final Mirror preview and leaves the gallery open.

`npm run test:docs` passes 166 checks in 13 files. `git diff --check` passes. The existing public card images, catalog, renderer and game CSS have no diff. The design detector and targeted TypeScript checks pass for the gallery helper. Durable test evidence and asset hashes are in external session folder card-art-wide/verified. No production integration, animation retargeting, commit or deployment is part of this proposal review.
