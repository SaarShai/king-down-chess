# 03 · Game feel in a widget

Type: research
Status: closed

## Question

Which proven patterns make a turn-based board game in a small webview feel alive without cost (card selection, a live king emblem, tactile buttons, menus as chests, a win moment), with timings, easing and reduced-motion rules, and which can the current painted renderer and CSS do cheaply?

## Answer

Report: [03-game-feel.md](../../../research/plugin-submission-2026-10-15/03-game-feel.md) (checked: 12 claims, 4 corrected).

- OpenAI gives no motion rule, but says "Avoid custom gradients or patterns": stone on every control is a review risk. Texture belongs on the game surface and one main action per screen (approval item C1 now picks b).
- No haptics (the frame cannot vibrate). Sound only as a setting, off by default. Every loop must look right at 30 fps and stop after 5 s. Timings: press 60–90 ms, sheet 240–320 ms, a moment 300–700 ms, a win at most 1.5 s (added to L3).
- Reduced motion: captures and the shake play under Reduce Motion (fault round 2, F29). The sheet blur costs a lot on phones (approval item L4).
- Cheap motion gains for ticket 07: the king topple, the lift tell, the live king emblems, the card deal and flip.
