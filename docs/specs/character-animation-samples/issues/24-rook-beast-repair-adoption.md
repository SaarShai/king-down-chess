# Adopt reviewed Rook and Beast repairs

Status: in-progress

## Plan and gates

Adopt the 14 reviewed non-idle Batch1 repairs independently of the two Rook idle facing/joins and rejected white Beast rest authority. Preserve original proposal files, status and exact source pixels; derived ready versions retain hash-bound parent visual review and original identity/provenance. Replace only expected old selections under the catalog lock, keep all unrelated selections, repin and verify the runtime, then merge via reviewed PR. No deployment.

## Result and checks

Fourteen immutable replacements are selected at a353248327dd25504ca695aa878a4cb58a128782b1d326af72b877606af27a67. Catalog has 465 ready banks and 15 repair banks; draft and missing counts stay 262 and6. The previous 451-bank package remains the verified MAIN version until the new copy is checked.

Existing strict publisher and source-preservation gates pass. The 465-bank package builds without source or exporter changes. Registered game checks pass: character runtime64.9seconds, state effects14.3seconds. Added real legal Rook whiteE and blackW captures and Beast blackSW capture exercise the replaced banks through game input, alongside previous turns, effects, both armies, cancellation and Undo checks.

The 16 underlying visual decisions are in MAIN .codex-runs/batch-adoption/batch1-visual-review.json; immutable derived candidates and original evidence are in batch1-reviewed/. Only non-idle14 are selected. The two Rook idles still need explicit resting-facing/turn-join integration; white Beast idle still fails its E-turn rest join. Full CI remains required before merge.
