# Beast idle and turn and white Rook idle

Status: in-progress

## Plan and checks

- Repair each army's own source frames. Keep the shipped turn endpoints exact.
- Check board-size sheets, 25 fps clips, alpha, endpoint hashes and timing.
- Freeze five banks in a catalog copy. Pin the selection and build a local runtime.
- Run focused tests and the runtime browser check. Open a PR and check CI. Do not merge or deploy.

## Repair

The Beast turns drop frames 2, 4 and 6. They retain the 120 ms duration and exact NE and E endpoints. Each Beast idle uses a short return from source frames 38 to 40, with a 2,000 ms loop and exact E rest at both ends. The white source idle used a clipped 512 × 634 canvas. The earlier registered white source has an alpha gutter. A uniform scale and translation align its three retained motion frames to the shipped E rest. The white E rest and older idle source have different chain detail; the exact E rest remains the join authority.

The white Rook uses its own reviewed idle-slam repair, including the fixed frames 26 and 27. Its original 600 × 600 frames use a different registration from the shipped S turns. A premultiplied uniform 1.28 scale and translation of −40.5, 40 pixels map the source to the 768 × 768 turn canvas. The shipped white S rest replaces the loop's rest frames. The loop keeps its 2,000 ms duration. No new art was made.

Both white idles and the black Beast idle use the prior connected turn component's height, so the connected turns keep their world scale. The Beast idles face E; the white Rook idle faces S.

## Gates

The five board-size sheets and 25 fps clips are in the run folder. The turn clips use the runtime's nearest-frame sampling, with forward and reverse play. The idle clips use the runtime's time-based sampling. The contact sheets and timed previews were inspected on light and dark backgrounds.

`python3 -B <run>/check-r2.py` passes 113 distinct frames through the alpha gate. It also checks duration, frame order, and both exact shipped endpoints for each bank. The Beast turn endpoints match adjacent ready turns. The idle endpoints match the E or S ready turn at both ends.

`tools/replace_animation_selections.py` freezes the five replacements under the catalog copy's lock. The source catalog hash is `8c3919af2217a8a9413a9271d136a5e8be2cdff299069dc8386354e39ec8af3f`. The new hash is `6279af2ef76ba46d75ba10ad5ddc822c67c5d5d78897457a1d13cc6893aed241`. The catalog has 748 entries; the ready runtime selection has 478 entries. The catalog copy and media stay in the run folder.

The replacement evidence includes the white Beast registered source manifest and the white Rook repaired source manifest. The candidate records the source frame hashes and each registration transform. The original frame banks remain unchanged.

`node tools/build-character-runtime.mjs --source <catalog copy> --output <run>/runtime-final` builds 478 banks and 5,421 assets. The runtime manifest SHA-256 is `ce85904886feb306a7e80d567cc0842ac56adbe4c956d652a4e96c9a461248ce`. A comparison with the 473-bank package finds five additions and no removals. Twenty-two existing turn banks change only their registration reference hash; their heights and all other fields stay exact. The effects stay exact.

`KINGDOWN_TEST_FILE='**/{character-runtime-package,animation-replacement}.test.ts' npm test` passes two focused tests, type checks and 67 board checks. This is not a full-suite pass.

`npm run check:browser character-runtime` passes against the final local package in 73.8 seconds. Its log is in the run folder. An earlier run completed the game cases but failed the checkout-stability guard because the ticket and selection changed during the run. The final run keeps the checkout unchanged.

The browser check covers the registered character-runtime cases. The five new banks have separate sheet, clip, alpha, timing and endpoint evidence; the browser check does not by itself prove every new motion.

The first PR verification found an unindexed lesson heading and a process-exit race in `tools/machine-lease.test.ts`. The recipe now sits under the existing indexed art section. The lease test accepts an ancestor that has already exited, but still checks the live child and the held lease. All nine browser CI jobs passed on the first commit.
