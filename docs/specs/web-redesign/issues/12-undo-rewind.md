# 12 · Undo plays the move backward, with no words

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 02b, 11

## Scope

- Owner choice: Undo "plays the moves backward but doesn't say what it takes back". The rule of when Undo works is in ticket 02b (spec §4.7). Decision D4 (one ply for each press).
- Demo: `feat-help` (the rewind, the `rewind-mid` state; "Undo again while the rewind plays, or a tap on the board, ends it at once") and `proto/app.js` 853–864, without their words.
- Files: a pure `rewindPlan(before, move, after)` module beside `scene.mjs` and its `node --test` file (spec rule 8); `src/render/PaintedView.ts` (an optional `animateBack` on `BoardView`); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (play a rewind plan); `src/render/renderer.ts` (Clay falls back to `sync`); `src/main.ts` (`undo`; call lines only); `tools/verify-turn.mjs`.

## Plan

1. [ ] `rewindPlan` gives one track for each figure: the mover slides back (also the long jumps of Flight and Strike); a swap moves both pieces back; a shoved piece goes back; taken pieces fade in on their squares (each victim of a bite chain); a promoted piece slides back and cross-fades to a pawn; a Paladin that left the board comes back; a mark (Freeze, Ice Wall) fades out. A move with nothing to slide (a pass, a Sacrifice) cross-fades.
2. [ ] `undo()` plays the rewind, then syncs the board. A press during a rewind ends that rewind at once and takes back the next staged ply, if one is left. A tap on the board only skips to the end frame. A new action (New game, a link, the account) cancels it, as `reset()` does today.
3. [ ] Motion Off and reduced motion: the board changes at once. Fast: half the time.
4. [ ] No words on screen about what Undo took back. The normal context line and the Moves line update (ticket 11). The screen reader hears "Move taken back."
5. [ ] The Clay look syncs at once.

## Verification

- [ ] `node --test` of `rewindPlan`: the end state of each track equals the position before the move, for a capture, a swap, a shove, a Beast chain, a promotion, a Paladin's self-removal, Flight, Strike, an Ice Wall mark, a pass and a Sacrifice.
- [ ] `turn` check, extended: Undo after a capture brings the taken piece back (a scene state hook); no animation runs after it ends (`noRunningAnimations`); a tap skips; two fast presses after a Freeze and a move bring the position back to the turn start; Motion Off is instant; the context line shows no words about the undone move.
- [ ] `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size. The plugin session knows before the pull request.
- [ ] Rendered sample: one phone video (a capture, then Undo; a Freeze and a move, then two Undo presses; a promotion, then Undo) and stills at 390×844 and 1440×900. The owner's yes, with the date, in Comments.

## Risks

- Each special move needs a correct reverse, or the cross-fade. A skip must not leave a figure half faded.

## Does not do

- No Undo after the press. No words on screen.

## Comments
