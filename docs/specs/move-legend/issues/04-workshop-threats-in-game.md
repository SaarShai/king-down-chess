# Show threats in the game uses the Workshop's threat marks

Status: ready-for-agent
Size: S
Blocked by: ticket 03 (the shared drawing in `src/render/legend.ts`).

Owner, 2026-10-11, on the side-by-side renders of the game board and the Workshop board: "do 2-4 (for 4, use the workshop threats). exclude the board change." Item 4 is this ticket. These words replace the owner's approval of the amber marks of ticket 02 ("amber threat marks approved", 2026-10-11).

## Scope

- Settings → Show threats stays the switch, and it still tells the player which of their pieces an enemy can take. The data still comes from the engine.
- The marks are the Workshop's threats (Try with, the eye on; `src/workshop/marks.ts` `threat`): a faint red arrow from each attacker to the piece it attacks, the arrowhead where the attack stops, and a red glow under the attacked piece.
- The Workshop draws a grey "stopped" threat with a stamp when a rule refuses the take. The game's threats come from the engine's real takes, so a game threat is never stopped.
- The amber diamond on a covered empty square has no Workshop form: it goes. The amber triangle goes. Their CSS and the overlay code go.
- Files: `src/move-text.ts` (`threatsIn` gives the attacker and the target), its test; `src/render/legend.ts` (`arrowLine`, `threat`), `marks.ts`, `renderer.ts` (the `Highlights` type only); `src/workshop/marks.ts`; `src/screen/play.ts`, `settings.ts`, `src/main.ts`; `src/style.css`; `docs/visual-design/README.md`, `verify.mjs`; W13.

## Plan

1. [ ] `threatsIn(pos)` returns `{ from, to }[]`: each enemy piece and the own piece it can take (the king: `checkersOf`).
2. [ ] `legend.ts`: `arrowLine()` and `threat()` as shapes; the Workshop draws its threats, pushes, swaps and follows from them.
3. [ ] `play.ts` puts the threats in `Highlights.threats`; `marks.ts` draws the red glow under each attacked piece and the arrows over the figures.
4. [ ] Delete `.mk-cover` and `.mk-threat` (`src/style.css`) and their overlay code; the overlay keeps the keyboard cursor.
5. [ ] `docs/visual-design/README.md` and `verify.mjs` part 3; W13 threats states (painted only).

## Verification

- [ ] Unit tests: `threatsIn` pairs; the threat shapes; `marks.ts` draws a threat.
- [ ] `npm test` through the lock script passes.
- [ ] `npm run check:browser visual-design painted-game workshop` pass.
- [ ] Renders, before and after, at 1440 × 900 and 390 × 844: `painted-threats-queen`.

## Does not do

- No change to the Workshop's threats or its eye.
- No threat marks in the clay look: clay is parked (owner 2026-10-11) and leaves the build.

## Comments
