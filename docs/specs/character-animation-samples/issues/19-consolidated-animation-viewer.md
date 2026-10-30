# 19 — Consolidated animation banks

Status: needs-review
Type: task

## Plan

1. Read the selected audit reports and verify the selected manifest and PNG hashes.
2. Copy exact PNG bytes and source manifests to content-addressed local files. Preserve action metadata, timing, pivots, cues and review status.
3. Add one viewer with status, character, army and action filters, playback and size controls.
4. Test frozen copies, hash failures, status retention, alpha failures and local frame URLs. Check browser playback with a small fixture.

## Acceptance checks

- Runtime frame URLs use only the output's frozen assets. Source paths are evidence only.
- Source changes cannot alter an imported bank. A hash mismatch stops the import.
- The importer never promotes a review status. Failed alpha becomes a repair diagnostic.
- The canvas clears before each frame. The viewer preserves the frame aspect ratio and recorded times.

## Evidence

- `tools/consolidate_animation_banks.py` imports the selected reports. It checks all declared manifest and runtime PNG hashes. It uses the shared alpha gate unchanged.
- Source reports and manifests retain their exact bytes. Playback banks, PNGs and catalog snapshots use SHA-256 names. The selector updates only after the import completes.
- The import preserves effect cue objects, URL-only reverse lists, entry and settle frames, missing studies, pivots and timing. It retains the stricter review status and records alpha failures as repair defects.
- The viewer uses recorded visible intervals first. Turns use their recorded nearest-index schedule, or the turn contract's nearest-index sampling unless a schedule names floor sampling. Other actions use their recorded frame times.
- Focused `KINGDOWN_TEST_FILE=tools/animation-consolidation.test.ts npm test` passes: type checks, two importer/browser tests and the 67 existing node checks. The fixture checks exact copies, changed source and frozen-file rejection, status conflicts, alpha defects, local URLs, final-pose timing, no-match filters and phone-width layout.
- The interface detector reports no findings. The root task runs the complete source-bank import and independent review. Large generated banks stay local.

## Limits

The pixel gate does not prove artwork quality or owner acceptance. A movement study keeps its source review status. This viewer cycles its selected frames; it does not place a moving piece on the game board.
