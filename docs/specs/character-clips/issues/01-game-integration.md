# Approved character animations in the game

Status: ready-for-human
Type: task

## Scope

Put the approved character animations into the game: the web build and the plugin widget share the board scene (`docs/2d-first-pieces/board/scene.mjs`). Reduced motion shows the final state at once.

Sources of approval (character-animation thread and `docs/specs/character-animation-samples/` in the main checkout, not on main):

- Knight lance tap, nine-drawing v2: the owner says "bank the previous version for knight".
- Rook slam, crack and heal, two-second high-resolution loop: the owner says "that's great".

The effects thread (states, cards, interface, king grounds) is in PR #92. This ticket does not touch that work. The PR targets `staging/first-game`; the integration PR #94 takes it to main.

## Plan

1. Build board atlases from the reviewed sample sheets. Register them to the board sprites with one scale and one translation. Make Charcoal drawings with a colour map from the two painted armies. (`docs/2d-first-pieces/clips/build.mjs`)
2. Play the clip once when a Knight or Rook is selected, then breathe. No clip with reduced motion or Motion Off.
3. Unit tests in `clips/clips.test.mjs`; browser check `character-clips`; key drawings and a video for the owner.

## Checks

- `node --test docs/2d-first-pieces/clips/clips.test.mjs`: 5 cases pass. A copy of the scene without the atlas draw call fails the play case.
- `PLAYABLE_BROWSER=chromium npm run check:browser character-clips`: passes (43 s). Both armies: Knight 9 drawings in 733 ms, Rook 26 drawings in 1983 ms, then the still figure; no restart while selected. On a stopped clock every drawing shows in order. Canvas pixels near the figure: the rest drawing differs from the still figure by 1.8–2.1 % of pixels (Knight) and 0.2–0.6 % (Rook, whose board sheet is the rest drawing; it was 3.5–4.4 % before), the raised drawing from the rest drawing by 1.2–7.3 %. Without the atlas draw, the raised change is 0 and the check fails. Reduced motion and Motion Off: no clip.
- `npx tsc --noEmit -p .`: passes.
- Full `npm test` (after the merge of `staging/first-game` and the Rook sheet change): 4830 passed, 2 failed, 8 skipped; docs scene tests 55 of 55 pass. `tools/plugin-motion.test.ts` "opens end actions during a live win (reduced motion true)" timed out under load and passes alone. Earlier run: 4767 passed, 2 failed. `src/match/service.db.test.ts` "runs a Daily friend game…" fails on `origin/main` too. `tools/plugin-app.test.ts` "makes one game after a lost Start reply…" passes alone on this branch and on `origin/main`. An earlier full run under heavy machine load had 19 plugin failures; the five failing files pass alone on both branches.

## Review

An independent review (read-only) found three faults; all are fixed:

1. A late atlas started the clip in its middle. Now `load()` waits for the atlases and the scene decides at selection whether the clip plays.
2. The tests passed with no clip pixels drawn. Now the unit tests record the atlas cell of each drawing, and the browser check compares canvas pixels.
3. The drawing count on the real clock could fail on a slow browser. Now the stopped-clock part counts every drawing.

## Results

Evidence: `docs/specs/character-clips/evidence/knight-in-game.webp` and `rook-in-game.webp` (Ivory top row, Charcoal bottom row, in-game captures on a stopped clock). The check also records a video.

## Decisions taken

The owner's standing rule is to act on the recommendation, so these are settled:

1. Rook look: the board Rook is the slam clip's rest drawing, for both armies. `clips/build.mjs` writes `rook/rook.webp` from it, so the figure does not change when the clip starts and ends. The sheet windows are wider (840 px) and the Charcoal mirror origin moves to 970; the capture pound still deforms the stone arm as before. Before and after: `evidence/rook-board-before-after.webp`.
2. Charcoal: keep the colour map. Generated Charcoal drawings are a later option.
3. Trigger: the clip plays on selection.

## Not built

- Bishop, Queen and Pawn previews: in progress in the character thread, not approved.
- The five banked interface studies (coin spend, draw reply, opponent found, both ready, invite copy): their art is on PR #92's branch; live wiring builds on that PR.
- Review suggestions of the independent animation review (check path, protection symbols): not owner decisions yet.
