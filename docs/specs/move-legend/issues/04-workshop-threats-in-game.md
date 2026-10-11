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

1. [x] `threatsIn(pos)` returns `{ from, to }[]`: each enemy piece and the own piece it can take (the king: `checkersOf`).
2. [x] `legend.ts`: `arrowLine()` and `threat()` as shapes; the Workshop draws its threats, pushes, swaps and follows from them.
3. [x] `play.ts` puts the threats in `Highlights.threats`; `marks.ts` draws the red glow under each attacked piece and the arrows over the figures.
4. [x] Delete `.mk-cover` and `.mk-threat` (`src/style.css`) and their overlay code; the overlay keeps the keyboard cursor.
5. [x] `docs/visual-design/README.md` and `verify.mjs` part 3; W13 threats states (painted only).

## Verification

- [x] Unit tests: `threatsIn` pairs; the threat shapes; `marks.ts` draws a threat.
- [x] `npm test` through the lock script passes.
- [x] `npm run check:browser visual-design painted-game workshop` pass.
- [x] Renders, before and after, at 1440 × 900 and 390 × 844: `painted-threats-queen`.

## Does not do

- No change to the Workshop's threats or its eye.
- No threat marks in the clay look: clay is parked (owner 2026-10-11) and leaves the build.

## Comments

**2026-10-11, the build (branch `claude/game-marks`).** `S` is the scratch folder `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/owner5`.

What changed:
- `src/move-text.ts`: `threatsIn()` returns `{ from, to }` pairs; the king's attackers come from `checkersOf()`. The covered empty squares are gone.
- `src/screen/play.ts`: the threats go into `Highlights.threats` in `refresh()`, under the same conditions as before; `drawMarks()` draws only the keyboard cursor. The Show threats switch now calls `refresh()` (`settings.ts`, `main.ts`).
- `src/render/marks.ts`: the red glow under each attacked piece (under the figures) and the threat arrow from `legend.ts` (after the last row of figures).
- `src/style.css`: `.mk-cover` and `.mk-threat` (the amber SVGs) are deleted.
- `docs/visual-design/verify.mjs` part 3: the threat data, a red pixel test half way along the arrow (on against off), no amber mark left, the threat stays with the moves, the choice is saved. `docs/visual-design/README.md`: the Threats row, the token line, the check line and the overlay note.

Evidence:
- `npm test` (lock script): 118 files passed, 1 skipped; 1922 tests passed, 21 skipped; exit 0 (`S/logs/npm-test-3.log`).
- `npm run check:browser`: visual-design, painted-game, workshop, verb-marks, read-piece, cursor-adoption, ux-defects and plugin-ui, each "check: all 1 passed", exit 0 (`S/logs/check04-<name>.log`). The visual-design run folder (`/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/game-marks-Pth1Hn`) has "Show threats: off by default; the red arrow from the rook d5 to the knight d2, also with moves shown; saved".
- Side by side, before left: `S/3-threats-desktop.jpg`, `S/3-threats-phone.jpg` (W13 `painted-threats-queen`). Also rendered: `painted-threats` and `painted-threats-read` (`S/after`).
- I looked at the renders. The arrow runs from the rook to the knight with its head at the knight; the red glow is under the knight's feet. The arrow is thin and faint (the Workshop's 2 px at .6), and it reads less strongly than the amber triangle did.

Changes from the ticket, and why:
- The task named "the badge where the attack stops". In the Workshop, a threat that a rule stops is a grey arrow with a bar and a "cannot be taken" stamp; an open threat is the red arrow, its head on the attacked piece, and the red glow. The engine gives only real takes, so the game draws the open form: the arrowhead marks where the attack lands.
- The clay look shows no threat marks now: it reads only the old overlay, and clay is parked (owner, 2026-10-11). The W13 clay threats states stay in the table and show no threats.
