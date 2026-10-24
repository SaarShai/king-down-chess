# Approved character animations in the game

Status: ready-for-human
Type: task

## Scope

Put the approved character animations into the game: the web build and the plugin widget share the board scene (`docs/2d-first-pieces/board/scene.mjs`). Reduced motion shows the final state at once.

Sources of approval (character-animation thread and `docs/specs/character-animation-samples/` in the main checkout, not on main):

- Knight lance tap, nine-drawing v2: the owner says "bank the previous version for knight".
- Rook slam, crack and heal, two-second high-resolution loop: the owner says "that's great".

The effects thread (states, cards, interface, king grounds) is in PR #92. This ticket does not touch that work.

## Plan

1. Build board atlases from the reviewed sample sheets. Register them to the board sprites with one scale and one translation. Make Charcoal drawings with a colour map from the two painted armies. (`docs/2d-first-pieces/clips/build.mjs`)
2. Play the clip once when a Knight or Rook is selected, then breathe. No clip with reduced motion or Motion Off.
3. Unit tests in `clips/clips.test.mjs`; browser check `character-clips`; key drawings and a video for the owner.

## Checks

- `node --test docs/2d-first-pieces/clips/clips.test.mjs`: 4 cases pass (also in `npm test`).
- `PLAYABLE_BROWSER=chromium npm run check:browser character-clips`: passes. Both armies: Knight 9 of 9 drawings in 733 ms, Rook 26 of 26 drawings in 1983 ms, then the still figure; no restart while selected. Reduced motion and Motion Off: no clip.
- `npx tsc --noEmit -p .`: passes.
- Full `npm test`: see Results.

## Results

See the PR for the full suite result, the screenshots and the video.

## Open owner decisions

1. The Rook slam drawings are a redrawn Rook (face, skin and proportions differ from the board Rook). The figure changes when the clip starts and ends. Pick: keep the change, use the clip's rest drawing as the board Rook, or regenerate the clip from the board Rook.
2. The samples are Ivory only. The Charcoal clips come from a colour map; the Charcoal Knight's cape is lighter than the painted one. Pick: accept, or generate Charcoal drawings.
3. Trigger: the clip plays on selection. Alternative: now and then at rest, as the resting pawns do.

## Not built

- Bishop, Queen and Pawn previews: in progress in the character thread, not approved.
- The five banked interface studies (coin spend, draw reply, opponent found, both ready, invite copy): their art is on PR #92's branch; live wiring builds on that PR.
- Review suggestions of the independent animation review (check path, protection symbols): not owner decisions yet.
