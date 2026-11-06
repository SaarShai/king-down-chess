# Merge of the effect branches

Status: ready-for-review
Type: task

This branch joins `fx/queen`, `fx/ranged`, `fx/melee`, `fx/kings` and `fx/fallen` on the main branch. The tickets of the parts are `34-ranged-captures.md`, `34-melee-strikes.md` and `docs/specs/king-demise/issues/01-king-demise.md`.

## Change

- Conflicts were only in `scene.mjs` and `character-effects-game-check.mjs`. All workers' edits stay.
- Plan order for a painted capture: stance, then the effect (thorns or ranged plan), then the king's death time.
- Fix found in the merge check: a painted melee blow's dust, chips and cracks stood still at the end of the attack and vanished when the animation ended. These effects now run on through the turn back and end with the animation (`afterglow` in `scene.mjs`).

## Verification

Real game on a fake clock, frame by frame, before and after: one capture per attacker type in both armies, six king captures in both armies, six king falls in both armies. Results are in the pull request.
