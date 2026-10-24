# Guard material ready for local review

The Guard has a broad steel shield with a thick forged bevel, a raised ridge and uneven metal grain. Three fitted plates close into one surface. One reflection crosses the shield; sparse sparks clear. The face and shoulders stay visible. The effect holds still by progress .65.

Only a king can capture the Guard. The existing still shield, red crown and rule text stay. No combat animation or game integration.

## Copy files

All paths are relative to `docs/specs/effects-animation/` in the `effects-signals` worktree.

- `preview/signals/state-flare.ts`: copy only the Guard helpers and `drawGuard`. Shared helpers, Shelter and Swap stay byte-for-byte the same.
- `preview/signals/main.ts`: copy only the Guard `change` description.
- `preview/signals/state-flare.test.ts`: one added Guard test.
- `preview/signals/GUARD_READY.md`
- `issues/12-guard-material.md`

## Review files

- `/tmp/kingdown-guard-material/guard-both-orientations.mp4`: 4.83 s, 24 fps, two 430 px boards. Deterministic timeline recording, normal direction at left and flipped at right.
- `/tmp/kingdown-guard-material/guard-0.14.png`: plates form.
- `/tmp/kingdown-guard-material/guard-0.32.png`: joined surface and moving reflection.
- `/tmp/kingdown-guard-material/guard-0.7.png`: quiet hold.
- `/tmp/kingdown-guard-material/guard-0.7-flip.png`: flipped quiet hold.
- `/tmp/kingdown-guard-material/guard-reduced.png` and `guard-reduced-flip.png`: stable reduced result.
- `/tmp/kingdown-guard-material/guard-page.png`: complete page with rule text.
- `/tmp/kingdown-guard-material/guard-source-art-page.png`: actual source art inspected through the local page before the change.

## Proof

- `review.json` in that folder records exact canvas hashes. Both directions pass: onset changes; .65, .7 and 1 are identical; reverse seeks match forward frames; reduced frames at all ten progress values match each other and the quiet normal frame.
- Actual replay advances. Pause holds. Manual reduced replay and OS reduced motion stop playback. No browser, console or failed-request errors.
- `source-comparison.json` proves that Shelter, Mercy, Swap, Archer, shared helpers, materials, fixtures, style and control code stay unchanged.
- Focused `npm test`: 5 state tests pass, plus the command's project type check and 54 existing scene tests. The added Guard test covers reverse seek, .65 hold and reduced progress including 0 and 1. This is not a full unit-suite pass.
- Strict targeted TypeScript for `main.ts` and `state-flare.test.ts` passes.

Root owns the combined registered browser check. The owner approves this new sample: “both look great”. All work stays local; no production code, art, dependency, commit or deployment changes.
