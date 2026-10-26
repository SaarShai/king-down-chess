# Board, information and effect comparisons

Status: decisions recorded; Holy Light ending pending

Owner request: develop crowded-board clarity, state endings and the game information area in parallel. Compare current magic with more expressive painted variants. Show comparison previews before integration.

Plan: use isolated worktrees for four studies. Start the first three in parallel; build the magic study as a parallel lane. Reuse the real board, art, rules and existing effects for the Current baseline. Copy only self-contained preview folders into this branch after review. Add one comparison index and verify the rendered pages on desktop and phone dimensions.

Acceptance: Current and Proposed use the same position, time and scale. Current is the production baseline. Each study has obvious local controls, responsive layout and keyboard focus. Animated studies have replay, pause, scrub, speed and reduced-motion handling. A hidden tab stops playback. Static board indications remain static. Effects respect legal state and leave a readable result. No production renderer, engine, rule or GUI integration change is part of this ticket.

Motion thesis: endings explain the loss of a real condition through its material; expressive magic shows support and borrowed movement through translucent light. State endings stay quieter than onset. Only the viewed sample runs. Work stays within the shared canvas clock and local drawing bounds where possible. The information and mark studies explain a choice without new ambient motion.

Boundaries: keep approved promotion, Firewall/Guard formation, Sky clouds and Lava A. No combat animation. No Ice King ground. Keep selection beneath figures. Keep destinations, extra moves, capture targets, bite order, threats, reserve drops and last move static. Card refill remains preview-only. Existing casting/check concepts are separate pending samples.

Evidence will record each worker's owned folder, checked viewports, early sample and final verification. The owner chooses a direction before game integration.

## Magic direction

The owner rejects the first fuller painted Holy Light mantle, initially approves exploring translucent light (“Closer; keep this direction”), then rejects the resulting four-effect polish: “the originals are better!” The latest verdict supersedes the earlier direction approval. Retain the original Current Holy Light, Mercy, Control and Mimic effects; do not integrate the Proposed variants. The owner also approves the Freeze ending. The crowded-board proposal, Ice Wall ending and game-information proposal are rejected. Holy Light ending remains pending feedback.

## Owner decisions

| Study | Decision |
| --- | --- |
| Crowded-board marks | Reject Proposed; keep Current. |
| Freeze ending | Approve Proposed. |
| Ice Wall ending | Reject Proposed; keep Current release. |
| Holy Light ending | Pending feedback. |
| Game information | Reject Proposed; keep Current. |
| Revised magic | Reject polished Proposed; retain all four originals. |

These are preview decisions. No game integration is requested in this feedback.

## Delivered previews

The launcher is `preview/comparisons/index.html`. All four studies run on the existing local preview server. Only preview folders and their browser-check registration were added. Production code, rules and approved effects stay unchanged.

- Board: two full 32-piece positions. Current matches the production renderer. Proposed uses distinct static marks below figures. The full board and controls fit 1280 × 720.
- Release: legal loss of Freeze, Ice Wall and Holy Light. The active badge ends with the rule. Current preserves the production 1,344 ms ice residue. Proposed clears in 620 ms.
- Information: five real scenarios. Current reproduces the source text and layout, including the clipped Pawn guide. Proposed shows complete guidance and places the turn instruction beside End turn. All rules returns focus to its opener.
- Magic: Holy Light, Mercy, Control and Mimic. The solid mantle is rejected. The new variant uses soft light-density textures and sparse motes. A final visibility pass strengthens only the broken shelter filaments. Current remains the original.

## Verification

`npm run check:browser effects-comparisons` passes after the final visibility change. It checks all four delivered pages, both variants, desktop and phone layouts, timeline seek, reduced motion, no horizontal overflow and the launcher links. No browser errors or failed requests were recorded. Captures wait for loaded fonts and completed canvas frames.

Each study also has focused evidence: six exact Current board image matches and twelve static holds; three legal state losses and deterministic release frames; ten information scenario/size pairs, exact source baseline and rules focus; all four magic samples with shared pose, time and source identity. Focused tests and scene checks pass. `npm run test:docs` passes all 166 checks in 13 files. Whitespace and syntax checks also pass. These are focused passes, not a full game regression run.

The parent inspected desktop and phone captures and the live preview. Evidence is in the session's external `comparison-previews` folder, including `final-check/comparisons.json`. No physical phone or cross-browser performance claim is made. No game integration, commit or deployment is part of this ticket. Freeze ending is approved. Polished magic, crowded board, Ice Wall ending and game information are rejected; keep their current game versions. Holy Light ending remains pending feedback. The Ice Wall decision concerns release only; its approved formation and held state remain approved. Game integration remains outside this ticket.
