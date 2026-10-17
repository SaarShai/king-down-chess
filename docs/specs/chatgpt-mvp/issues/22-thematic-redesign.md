# 22 · A thematic look and game feel for the plugin

Status: needs-triage
Type: HITL
Size: L
Blocked by: 21 (the UX review reports)

## Problem

The owner, after the iPhone test (2026-10-15): the graphic design is "rather boring, formal, uninspired". It "can be more thematic". "Think creatively. Think like a game designer." The owner's examples:

1. Buttons can be like bricks, in the same style as the board squares, that press in.
2. Nested menus can be like chests inside chests.
3. Choosing a king should be more exciting.
4. The king emblems: the web game has live emblem animations (`src/power-motion.ts`, `src/power-motion.css`, [painted motion](../../../painted-motion/README.md)). The plugin's king choice does not use them.
5. Choosing cards can be more exciting, with effects and animations.

Also unused in the plugin: the board sounds (`src/render/sfx.ts`), the end ceremony (`src/ceremony.ts`) and the piece lessons (`src/lessons.ts`).

## Scope

1. A design round: concepts for the materials (each component family as an object of the King Down world), the menu metaphors, and the key moments (king choice, card choice, the seat reveal, the first move, a capture, a power, check, the win, a badge, "Opponent found", a rematch). Inputs: the theme sections of the three UX review reports (ticket 21 QA, `docs/qa/plugin-ux-review-protocol.md` section 5) and the owner's examples.
2. Rendered samples of the home card, Play, New game with the king and card choice, and the board, on a phone and on desktop, with the motion shown (a short video or a frame strip). New art only from Codex image_gen on the owner's plan.
3. The owner approves a sample (spec Q18) before the visual build.
4. The build: the approved look, with reduced-motion support, frequent effects under about 400 ms that never block input, and the page under the payload limit.

## Acceptance

- [ ] The owner approves one rendered sample.
- [ ] The king choice uses the live emblems; the card choice has its effect.
- [ ] Buttons and menus use the approved materials on each screen.
- [ ] Reduced motion keeps every state change with no large motion.
- [ ] The UI checks, the plugin tests and the payload check pass.

## Comments
