# 12 · Undo plays the move backward, with no words

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 02b, 11

## Scope

- Owner choice: Undo "plays the moves backward but doesn't say what it takes back". The rule of when Undo works is in ticket 02b (spec §4.7). Decision D4 (one ply for each press).
- Demo: `feat-help` (the rewind, the `rewind-mid` state; "Undo again while the rewind plays, or a tap on the board, ends it at once") and `proto/app.js` 853–864, without their words.
- Files: a pure `rewindPlan(before, move, after)` module beside `scene.mjs` and its `node --test` file (spec rule 8); `src/render/PaintedView.ts` (an optional `animateBack` on `BoardView`); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (play a rewind plan); `src/render/renderer.ts` (Clay falls back to `sync`); `src/main.ts` (`undo`; call lines only); `tools/verify-turn.mjs`.

## Plan

1. [x] `PaintedView.animateBack` plays the reverse scene move, then syncs the old board. Taken pieces return at the end. A pass, a promotion or a move with no reverse slide syncs at once.
2. [x] Undo takes one staged ply. A second press ends the old rewind and takes the next ply. A board tap skips the slide. A new game cancels old work.
3. [x] Off and reduced motion sync at once. Fast uses half the time.
4. [x] The context and Moves lines update with no words about Undo. The screen reader says "Move taken back."
5. [x] Clay syncs at once.

## Verification

- [x] `turn` checks a capture rewind, the returned piece, two fast presses and no Undo words on screen.
- [x] `w6-parts` checks reverse moves, instant paths, Off and an old wait after a new position.
- [x] `npm test`, the type check and all ten named browser checks pass. Both new checks pass twice.
- [x] Sample W6 has phone and desktop sheets and a phone video with capture, Undo and Archer mate.
- [ ] The owner gives yes on the sample.

## Risks

- Each special move needs a correct reverse, or the cross-fade. A skip must not leave a figure half faded.

## Does not do

- No Undo after the press. No words on screen.

## Comments

Undo plays the reverse scene move, then syncs the old board.
Taken pieces return after the slide. Clay syncs at once.
Cut: no rewind plan or separate track for each piece.
Tests: 1644 passed, 13 skipped; 50 motion tests pass. Type check passes.
All ten named browser checks pass after the merge.
The new end and parts checks each pass twice.
Both plugin checks pass. The page is 4,294,665 bytes.
Sample W6: four stills, one phone video and two sheets. No fault.
The sample waits for the owner's yes. Integration runs the full suite.
