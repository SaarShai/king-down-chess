# A late first frame skips the first clip drawing

Status: ready-for-human
Type: bug

## Fault

The `character-clips` browser check failed twice on 2026-10-24 under machine load (the staging checks of `d3ee2821` and the live check of `fdc5f2f7`): "knight: starts on his first drawing", drawing 1, not 0. Each time, the check passed again on a quiet machine.

Cause: `setSelected()` started the clip clock at the selection (`performance.now()`). The first frame that draws the figure comes later. The Knight shows each drawing for 42 ms (24 fps), so a first frame later than 42 ms shows drawing 1 or later. A player on a busy page sees the clip start in its middle.

## Fix

The clip clock starts on the first frame that draws the selected figure (`selectedAt ??= time` in `render()`; `setSelected()` clears it). A late first frame now shows the first drawing. The breathing after the clip counts from the same start.

## Evidence

- New unit test in `docs/2d-first-pieces/clips/clips.test.mjs`: the first frame comes 120 ms after the selection; the Knight and the Rook start on their first drawing. It fails on the old scene (Knight drawing 3) and passes with the fix.
- `node --test "docs/2d-first-pieces/**/*.test.mjs"`: 57 pass.
