# Firewall sample ready

The first fire rebuild is ready for owner review. The owner approves this revision: “both look great”.

## Ready source

- `docs/specs/effects-animation/preview/signals/materials.ts`: Firewall only; public API stays the same.
- `docs/specs/effects-animation/preview/signals/fire.ts`: deterministic rising heat texture; shared by the back and front layers.
- `docs/specs/effects-animation/issues/11-firewall-material.md`: scope and checks.

## Preview paths

- `/docs/specs/effects-animation/preview/signals/index.html?sample=firewall`
- `/docs/specs/effects-animation/preview/cards/index.html?sample=Firewall`

Use a local Vite server for this worktree. The check uses its own free port. Main preview server 5198 stays unchanged.

## Early visual evidence

Evidence root: `/Users/za/.codex/visualizations/2026/10/23/01a168fe-8505-7842-89a3-dd078bd311a1/effects-wave2-agents/firewall-evidence/`

- `signals-0.42-430.png`: quiet hold at exactly 430 px.
- `signals-0.57-430.png`: a later hold, with changed tongues.
- `signals-0.18-430.png`: formation.
- `signals-0.84-430.png`: extinguish.
- `cards-0.42-430.png`: army ward in the card context.
- `cards-0.84-430.png`: ward at the moved rook.
- `signals-full.png`: full canvas for close inspection.

I inspect the 430 px PNGs and the full canvas. Fire now has connected hot roots, warped rising tongues, red fringes and local sparks. Front fire stays low at the centre. Other effects and combat files stay unchanged.

## Focused checks complete

- Both previews show a 430 px board from a 960 × 1024 canvas, in both directions.
- No HTTP, browser or window errors.
- Ten lifecycle samples per preview; exact full-canvas equality after backward seeks.
- Reduced motion stays pixel equal. Replay starts, advances and pauses.
- The card fixture moves the rook from a2 to d2. Its fire ward stays at d2.
- Material self-checks pass: seed variation, time variation, reverse seek, distinct formation and clear endpoints.
- Three changing wards (back and front): median 4.9 ms, p95 5.4 ms in local Chromium.
- Project type check and direct TypeScript check of the two material source files pass.

More evidence in the same root:

- `firewall-430.mp4`: 4.8 s, 120 exact timeline frames at 430 px.
- `signals-flipped-430.png`, `cards-flipped-430.png`.
- `signals-reduced-430.png`, `cards-reduced-430.png`.
- `checks.json` and `check.log`: focused check result.
- `check.mjs`: repeatable check; run from this worktree with `node <evidence-root>/check.mjs`. Add `FIRE_CAPTURE=1` to remake the clip.

The combined root check and full game suite are not run. This revision is a local sample and still needs owner review.
