# Movement coverage inventory

## Plan and checks

- Read the frozen catalog and retained runtime without changing either. Count the 17-character, two-army, eight-direction movement matrix by distinct case and status.
- Report pose provenance and possible reusable clips separately. Do not infer authorship or reuse from frame counts, file names, mirroring, or draft stride fields.
- Test duplicate cases, missing stubs, missing rows, draft and ready separation, shared source sheets, and corrupt bank hashes. Run the tool on the actual catalog and record the input hashes and limits.

## Result

The selected catalog has 270 movement-study records for 268 distinct cases: 260 draft, two needing repair and six missing stubs. Pawn SE has two draft records per army. Four Flame cases have no row: NE and NW for both armies. The target is 272 cases. There are zero ready movement records and zero packaged movement records, so selected movement-bank coverage and proven reusable movement clips are zero. This does not count the game's existing procedural motion.

The selected frames in 18 records name 14 distinct source-sheet hashes. The other records do not provide that field in selected frames. These hashes do not establish a complete count of authored pose sets; the tool reports that count as unknown. It reports game coverage and proven reusable clips as unknown when either ready or packaged movement appears, including mismatched inputs, until separate game and motion evidence exists. Pending human playback review is a separate status and is never treated as ready. It never mirrors or recolors art.

Catalog SHA-256: `54abc4ff79287f536d2678ec110f86cdad8213a671d4bbaa7f0196869bb0c4fd`. Runtime SHA-256: `05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e`. Run with `python3 tools/animation-coverage.py <catalog-manifest> <runtime-manifest>`.

The initial focused check passed typecheck, the inventory test and 54 existing node checks. The revised focused check covers pending review and both catalog/runtime mismatch cases. No full Vitest suite or game playback was run. No two-distance reuse proof is possible from the selected movement banks until one complete movement is accepted and integrated.

## Independent review

The independent reviewer (`/root/improvements_review`) found that pending human review needed a separate status and that mixed catalog/runtime inputs could imply unsupported coverage. Both cases were fixed. The reviewer found no further actionable defect on re-review. On the staging base, `KINGDOWN_TEST_FILE=tools/animation-coverage.test.ts npm test` passed the selected test, typecheck and 67 existing Node checks. This is not a full Vitest run.
