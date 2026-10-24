# Play the approved promotion, card casting and check motion

Status: in review; branch `staging/lane-motion` (from `staging/lane-effects`, ticket 85); not merged into `staging/first-game`, not deployed.

## What

The motion concepts of `docs/specs/effects-animation/issues/23-motion-concepts.md` go into the game, on the effects system of PR #92 (ticket 85):

1. **Promotion**: the gold reveal. The owner approved it ("looks great"). Its visual direction does not change.
2. **Card casting**: the local release (the material changes where the card acts), not the wisp.
3. **Check**: the warning that shows the real cause, and its withdrawal when a legal move ends check.

The concept previews and their direction are on `codex/effects-integration`: `docs/specs/effects-animation/preview/concepts/{promotion,cards,check}/` and `docs/research/king-down-motion-direction-2026-10-24.md`. This branch does not copy them.

## Scope

- Promotion: `src/render/effects/promotion.ts` (new), `src/render/PaintedView.ts`.
- Card casting: `src/render/effects/card.ts`, `src/ui/motion.ts`, `src/plugin/screens/board.ts`, `src/style.css`.
- Check: `src/render/effects/check.ts` (new), `src/render/effects/board-effects.ts`, `src/render/effects/states.ts`, `src/render/PaintedView.ts`.
- Tests: `src/render/effects/{motion-concepts,check,board-effects,card}.test.ts`, `src/render/effects/view-harness.ts` (the view harness, moved out of `card.test.ts`), `tools/plugin-motion.test.ts`, `tools/plugin-motion-concepts.test.ts` (new), `tools/verify-motion-concepts.mjs` (new; `npm run check:browser motion-concepts`).
- No change to the rules, to combat, to a spent card (it does not refill), or to other static indications (selection, destinations, threats, last move, rails, state marks).

## Acceptance

- Each concept plays on the plugin board and in the web game where it applies, at phone size (390 x 844) and desktop size, in both board orientations.
- Reduced motion, pace Off, a hidden page and a skip show the static end state at once.
- Rendered frames agree with the previews.
- `npx tsc --noEmit -p .`, the full `npm test`, the board tests in Chromium, WebKit and Firefox, and `npm run check:browser motion-concepts` pass.

## Result

### Promotion

- `PromotionPlayback` is a scene effect. It ports the preview's `ascension.js`: 740 ms; the chosen piece is opaque at 42%, the pawn is gone by 45%, the gold dust rises from the stone board's own pigment and falls as three flakes. It draws on the promotion square only and hides that square's static figure, so the square is never empty and never shows two figures.
- The preview's 100 ms arrival is the game's own move. `animateMove` plays the reveal after the scene move, at the move speed: 740 ms at the normal pace, 370 ms at the fast pace (the plugin board). A capturing promotion keeps its own move and capture; the reveal adds no combat beat.
- No reveal: reduced motion, pace Off, a hidden page, symbols mode, and a move that a skip or a newer move ended. The chosen piece then shows at once. Reduced motion or a hidden page that starts during a reveal ends it at once, as it ends a card.
- The pigment loads on the first promotion (`loadAscension`, from `docs/2d-first-pieces/board-art/stone-board.webp`). Until it loads, the reveal shows without dust.

### Card casting

- Freeze and Firewall use the local release (the two cards with a preview). The board shows the start position for 125 ms (the card prepares), then the result board. The approved material grows on the frozen piece, or on each piece of the protected army, from 0 to its held strength (.42) in 450 ms (Freeze) or 480 ms (Firewall). No king source, trail or spell art crosses the board. The playback keeps the preview's length (Freeze 1600 ms, Firewall 1300 ms).
- The material uses the square as its seed, as the held state does, so the hand-over from the cast to the held state does not jump. (The preview used `sq % 4` for Firewall.)
- Firewall's follow-up move and a Mirror copy keep their earlier playback.
- Plugin card coin (`castRelease`): the card face gathers a little of its material and brightens for 125 ms, then drains into the spent style by 500 ms. The face follows the preview's glow (brightness 1 + .2 sin(pi ms / 500)), grey and opacity, sampled every 125 ms on a linear clock (`UiMotion.play` takes an optional easing). The material draws on its own canvas and then fades as one image (.86 x the drain), as in the preview.
- One difference from the preview: its emblem also dims by .28 of the spent value, to brightness .72 at rest. The game's spent coin keeps its own static style (brightness 1, grey, opacity .85: the G2 contrast), so the release ends there. The animation has no last keyframe, so it ends on that static style. Only the face animates; the coin keeps its static filter. The material layer (`.ui-cast-release`) follows the coin through a coin row rebuild and goes when its clock ends or stops.
- The web game has no card hand, so the coin part is in the plugin only. The board part is the shared `PaintedView`.
- A spent card stays spent (unit test).

### Check

- Onset, 440 ms (`check.ts`): the real checkers' edge (their silhouettes from the shown board, in warm gold) flashes once in the first 270 ms; a rust wash presses in under the king; at 175 to 325 ms a seal lands beside the king. The cause lines stay still: no travelling attack, no growing path, no pulse.
- The held check is the preview's still result: the wash, the seal and the still cause lines. It replaces the old ring and danger plume (`checkImpact`, which stays for the signals preview). Reduced motion and a resync show it at once.
- A legal move that ends check on a live board withdraws the wash in 220 ms on the king's old square; the seal and the cause lines go at once. The withdrawal starts when that move starts to play (`StateEffects.endCheck` and `release`), also for the first move after a load. A move with no playback (a drop) starts it at its forward sync. A resync, a rewind, a review or reduced motion removes the check at once. A web page that only hides the mark and plays no move (the promotion picker, the game-end ceremony) shows no withdrawal.
- The fast pace (plugin) halves both times.

### Decision: the held check

The preview holds its still result: the wash, the seal and the still cause lines. This branch holds the same, in place of PR #92's ember ring and danger plume (`checkImpact`). Reasons:

- The concept withdraws the held wash on a legal evasion. With the ring as the held mark, there is no wash to withdraw.
- `checkImpact` is PR #92's earlier check effect, with its own onset. Staging before PR #92 drew a different check mark. The check effect is the thing that this ticket replaces.
- The cause lines (`link`, the static cause indication) do not change. Other static indications do not change.

The independent review reads the coordinator's constraint ("static indications stay unchanged") to include the held ring, and asks for an explicit scope decision. The owner or the coordinator can keep the ring: the change is in `drawBoardEffects` (`src/render/effects/board-effects.ts`) only.

### Frame comparison

`tools/verify-motion-concepts.mjs` drives the production `PaintedView` on a paused page clock and saves frames at fixed times (±16 ms) at 390 x 844 and 1100 x 900, in both orientations, with and without reduced motion. The same times in the previews (`seek`), side by side, are in [86-motion-concepts-frames.webp](86-motion-concepts-frames.webp) (game left, preview right): the promotion at 370 ms of the reveal, the check at 60 ms (the rook's gold edge) and at rest (wash, seal, still cause line), and Freeze at 300 ms (the ice grows on d5). The reveal, the wash, the seal, the edge and the ice agree in place, size, colour and timing. The differences come from the game itself, not from the effects: the game's own king glow for the side to move, the game's Freeze fixture (a sparse board; the preview used a dense one), and the board frame of each page. In both orientations and at 390 x 844 the effects stay on their squares; the seal sits beside the king in the same screen direction as in the preview.

### Review fixes

The independent review (a Sol run) of `fda28f3e` found five points; `df3ce9f3` fixes four:

- The first evasion after a load showed no withdrawal (the highlight used a stale `forward`). The withdrawal now starts when the move plays.
- Reduced motion or a hidden page during a reveal did not end it. It now ends like a card.
- The card material set its own alpha, so the fade did nothing and the material vanished at 500 ms. It now fades as one image.
- Both the coin and its face greyed, so the grey doubled. Only the face animates now; the brightness difference is explained above.

The fifth point is the held check (see the decision above). It stays open for the owner.

### Runs

On `331f1fb2` unless noted:

- `npx tsc --noEmit -p .`: pass. `npx vitest run src`: 2599 pass.
- `npm run check:browser` on `9e4dd189`: motion-concepts, plugin-ui, effects-animation, effects-game, effects-states, end, king-effects, visual-design: all ok.
- Board and motion tests (`tools/plugin-{board,motion}*.test.ts`) on `9e4dd189`: Firefox fails the same 45 tests as staging (old faults), nothing new. WebKit: 243 pass, 2 reduced-motion plugin-motion tests timed out under parallel load; in isolation `tools/plugin-motion.test.ts` passes in WebKit on this branch (25 of 25) and on `staging/lane-effects` (23 of 23). The Chromium hand-over test failed 2 of 7 runs under load and passed 4 of 4 isolated runs with a diagnostic.
- Full `npm test`: see the PR.
