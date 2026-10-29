# Audit Stratus turn registration

Status: in-progress

## Plan and checks

1. Compare the pinned catalog and runtime for all eight turns and both selected idles in each army. Establish the rest authority and test each endpoint with pivots aligned.
2. Version only the metadata needed to register the split black components. Preserve all frame bytes, timings and pivots. Leave unrelated art and movement drafts unselected.
3. Compare the full runtime against the prior package. Check actual turn-out, return, Undo and cache limits through registered browser checks. Run focused package and runtime tests, then obtain independent review.

## Result

The selected black SE idle sets runtime height 266.5. The exporter splits two pairs of black turn banks because their padded source endpoint hashes differ from the matching smaller canvases. N, E, SW and NW had a scale mismatch. All 16 native turn endpoint pairs and all 16 runtime pairs have exact RGBA pixels after transparent padding with the pivots aligned. Both idles in each army close on the SE turn endpoint.

Two new bank versions declare source height 533. All other source fields and frames are unchanged. The body-height field supplies the exporter registration height. This value records the chosen SE rest registration, not a new measurement of each padded source silhouette. Registration-source identity remains each split component's bank because the exporter groups by source hash.

The replacement publisher checked the expected-old hashes and selected the two reviewed versions in catalog `54abc4ff79287f536d2678ec110f86cdad8213a671d4bbaa7f0196869bb0c4fd`. The actual 468-bank build has runtime manifest `05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e`. Compared with the previous runtime, only four black turn registration/source records change; frame lists, canvases, pivots, timing, asset index and separate effects remain equal. Original banks, source frames and prior runtime manifest and asset index remain available for rollback.

Independent review found no actionable defect in the proposal or game check. It rechecked the old and new bank hashes, evidence, all 40 source-frame references, all candidate endpoint pairs, registration heights and the full bank comparison. The earlier diagnostic join array recorded pre-change heights; the candidate runtime and integrated browser check establish the post-change values.

`KINGDOWN_TEST_FILE=tools/character-runtime-package.test.ts npm test` passed its focused case, type checks and 67 Node checks. `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test` passed 12 focused cases, type checks and 67 Node checks. Registered `stratus-registration` passed all 16 game routes and Undo in 42.3 seconds; `character-runtime` passed in 73.2 seconds; `effects-states` passed in 14.4 seconds. These are focused checks, not a full-suite pass.

The selected-idle handoff can still snap to rest during a move. A direct interpolation probe fails hand continuity. The black SE–S art issue and movement drafts remain separate from this registration repair.
