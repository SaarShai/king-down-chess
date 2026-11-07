# The still pictures are the runtime rest frames

Status: resolved
Type: task

## Problem

The board drew the old part sheets first. One to four seconds later it changed to the runtime art. During that change
the figures changed: the Paladin, the Archer, the facing of each army and the sizes. The Guide, the title and the
promotion picker showed old still pictures (`public/ui/pieces`).

## Plan and checks

- `tools/build-piece-stills.mjs` cuts the rest frame of each character and army (pieces and king designs) from
  `public/character-runtime` to its painted pixels. It writes `public/ui/pieces/<character>-<w|b>.webp` and
  `src/render/painted/piece-stills.mjs` (pivot and size in bank px).
- With the character runtime on, the scene draws a figure at rest from its still picture until the runtime has that
  frame. The pivot, the scale (`bankScale`, so `HEIGHT` sets it) and the soft pool are the same as the rest frame's.
- `piece-stills.test.mjs` fails when a rest frame changes and the tool did not run again.
- Check in Chromium and WebKit: the full board before and after the change to the runtime art.

## Results

- Full board, 390 px phone, runtime manifest held back until the first frame was drawn: on each square of ranks 1, 2,
  7 and 8, at most 0.12 % of the pixels change by more than 48 levels, except e8 and e7 (3 to 4 %). There the Shadow
  King's smoke and hands move between the two pictures; the figure is the same.
- Title lineup, Guide cards and promotion picker show the new pictures in both engines.
- Not checked: a slow link (the still pictures add a request for each kind on the board before the first frame).
