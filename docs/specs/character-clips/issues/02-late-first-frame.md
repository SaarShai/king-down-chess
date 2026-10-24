# A late first frame skips the first clip drawing

Status: resolved
Type: bug

## Fault

The `character-clips` browser check failed twice on 2026-10-24 under machine load (the staging checks of `d3ee2821` and the live check of `fdc5f2f7`): "knight: starts on his first drawing", drawing 1, not 0. Each time, the check passed again on a quiet machine.

Cause: `setSelected()` started the clip clock at the selection (`performance.now()`). The first frame that draws the figure comes later. The Knight shows each drawing for 42 ms (24 fps), so a first frame later than 42 ms shows drawing 1 or later. A player on a busy page sees the clip start in its middle.

## Fix

The clip clock starts on the first frame that draws the selected figure (`selectedAt ??= time` in `render()`; `setSelected()` clears it). A late first frame now shows the first drawing. The breathing after the clip counts from the same start.

## Evidence

- New unit test in `docs/2d-first-pieces/clips/clips.test.mjs`: the first frame comes 120 ms after the selection; the Knight and the Rook start on their first drawing. It fails on the old scene (Knight drawing 3) and passes with the fix.
- `node --test "docs/2d-first-pieces/**/*.test.mjs"`: 57 pass.
- CI on PR #105: 11 of 11 checks pass. Merged into `staging/first-game` as `8a47c982`; it reaches main with the next release.

## Review

- Independent review (Sol, xhigh, read-only), 2026-10-24: ready, no P0–P3 findings. It confirms the cause, checks every read and write of `selectedAt` and `clipShown` (reduced motion, idle off, symbols-only, deselection, re-selection, `dispose()`), and reruns the new test against the old scene (fails) and the fix (passes).
