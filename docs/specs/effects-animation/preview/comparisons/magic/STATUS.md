# Magic comparison

Status: polish rejected; retain the four original production effects

Scope: comparison preview only. No game integration, rule change, dependencies or commits.

## Owner direction

The owner's final comparison verdict is “the originals are better!” Retain Current for Holy Light, Mercy, Control and Mimic. Do not integrate this Proposed polish. This supersedes the earlier direction approval, “Closer; keep this direction.” The first solid gold mantle was also rejected. The translucent study remains available as a rejected comparison, not an approved replacement.

## Polished material

- Holy Light forms a high, warm, broken shelter. It gathers from the real source king, then settles into a still hold.
- Mercy is lower and stays open toward the real pawn, including when the board is flipped. The red pawn exception remains visible.
- Control sends a focused teal transfer from the real lender, then a short wake aligned with the move.
- Mimic sends a wider, softer pale echo. The lender and moving knight retain their identity. The trail clears fully.

Five textures are cached. Per-frame drawing stays bounded. Exact pulse endpoints remove residual motion. Drawing restores canvas state and respects inherited opacity. Reduced-motion shelter matches the normal settled hold. A final phone pass widens the travelling light fragments without adding opacity or loops.

## Preview

Open `/docs/specs/effects-animation/preview/comparisons/magic/index.html` on the shared local preview server at port 5199. Each of the four effect buttons selects and replays its sample. Current and Proposed preserve the same time, position and scale. Replay, Pause, scrub, Slow, Flip board and reduced motion remain available. The board is larger on short desktop windows. All controls fit 1280 × 720; the phone layout uses normal page scroll.

Current imports the production effect functions unchanged. The four Current opaque board regions match the pre-polish captures exactly. These image comparisons exclude page background and controls, whose layout changed.

## Verification

The registered `effects-comparisons` browser check passes after the final material adjustment. It covers all four samples with 32 phase/variant/viewport captures at 1280 × 720 and 390 × 844, plus the existing comparison checks. It checks direct replay selection, timeline seek, reduced motion, fixed comparisons, desktop control bounds, no horizontal overflow and no page errors. The native browser and saved captures were inspected.

Focused paint and transport tests cover legal fixtures, deterministic reverse seek, exact endpoints, stable holds, inherited opacity, bounded draw calls, cached textures, all four replay buttons, hidden/offscreen stop and reduced motion. A Mercy regression check keeps the stronger held-light lobe opposite the pawn in either board orientation. All five focused tests, typecheck and the wrapper's 51 board tests pass. This is not a full game regression run.

The required design scan reports the inherited cream palette and an unused `.wordmark` glow from `src/style.css`. Parchment is the existing game surface. This page has no `.wordmark`, and its text shadows are disabled. No theme redesign is part of this polish.

Evidence is in the session's external `magic-polish/final-check` folder. No physical-phone or cross-browser performance benchmark was run. The owner rejected the polish after viewing it; technical verification does not imply visual approval. Production effects are unchanged.
