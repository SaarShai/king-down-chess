# 02 — Board signals

Status: ready-for-review
Type: prototype

## Scope

Build a local review page. Use the production painted scene, legal engine moves and move marks. Keep all work in this ticket and `preview/signals/`. Do not change the game.

## Plan

1. Build the three material studies: irregular frozen mass, thick curved ice wall, and protective flames.
2. Keep the accepted interface. Make swap playful and give check a brief impact.
3. Check still frames before playback, then check fixture legality, layers, clocks and phone layout.

## Pass criteria

- Each study uses real state and legal moves. The Archer stays on its source square. Its shot crosses a blocker.
- Freeze is an irregular translucent ice mass with cracks and ground frost. It builds up the lower figure, then flakes and melts. Do not use a fence of repeated crystal posts.
- Ice Wall has thick faceted volume with visible front and back layers. Firewall has red-orange flames with gold cores. A thin shield is not a material effect.
- Figures stay rigid and readable. Freeze means no move; a ward means no capture. Pips show turns left.
- Draw every ground ring below figures. Keep the approved interface controls and style.
- Keep selection, extra move, capture targets, destinations, bite order, threats, reserve drop and last move as existing static cues. Do not add animation studies for them.
- Only the active study has a clock. Pause, reduced motion and a hidden tab stop it.
- The page has no side scroll at 390 px. Text stays visible when motion stops.
- The root task checks the page in a browser before the owner reviews it.

## Evidence

Work starts from the fixtures in `tools/fixtures/shared-mechanics.ts`. This page uses browser-safe fixture inputs with the same FEN and LAN actions. It does not import that module because it imports Node assertions.

## Build result

- The page has 12 studies. Freeze and the distant Archer shot are first. The owner removes eight animation proposals: selection, extra move, capture targets, destinations, bite order, threats, reserve drop and last move.
- The scene uses the production stone board, figure art, `drawMarks`, `marksModel` and `checkersOf`.
- The page states which marks it reuses and which transitions are new. The Guard and shelter samples keep their rule exceptions.
- Freeze uses a cracked frozen mass. Ice Wall uses thick curved ice slabs. Firewall uses real flame shapes with gold cores. These pure drawing functions live in `preview/signals/materials.ts` so card studies can use the same material. Expiry uses legal engine actions.
- Swap uses paired opposed light trails. Check has a crimson danger plume behind the king, scattered embers and a ground shock ring, then retains the source link. Shove keeps the accepted indication.
- All figures stay rigid. The renderer's idle, king and pawn clocks are off. One local clock draws only the active sample. Pause, reduced motion and a hidden tab stop it. A change to the system motion setting also stops it.
- At widths up to 850 px, the controls stay above the board and remain in view during replay. The detail follows the board.

## Checks

- Pass: fixture actions resolve through `GameRules.legalMoves` and `makeMove`.
- Pass: `tsx preview/signals/fixtures.ts` checks Freeze, expiry, a shot over a blocker, an unchanged Archer source, all six far2 directions, Haste with no capture, ward scope, Guard protection, Holy Light shelter and the Mercy pawn exception.
- Pass: targeted strict TypeScript check with unused-local checks, including `materials.ts`.
- Pass: the remaining 12 menu entries exclude all eight rejected animation proposals. All calls to the ground-ring helper are in the under layer or the under-layer check impact.
- Root checks on the first build pass: controls, selectors, five timeline frames, flip, phone width, reduced motion. The sole console error is a missing favicon; the page now requests the existing game icon. The new material pass still needs visual review.
- Pass: `git diff --check`.
- The root browser review found a missing canvas backing size. The page now sets 960 × 1024 before scene creation. A second review found controls below the board in a narrow panel. The compact controls now precede the board.
- The final root browser check passes; see ticket 01 for the run and coverage. No full unit suite runs for these isolated samples.

## Shared material API

Import `drawFreeze`, `drawIceWall`, `drawFirewall` and `materialState` from `preview/signals/materials.ts`.

Each draw function takes the canvas context and `{ x, y, progress, front, seed? }`. `x` and `y` are the real scene foot in board units. Draw `front: false` below figures. Draw `front: true` after the target's screen row. Progress 0–0.3 builds the material, 0.3–0.72 holds it, and 0.72–1 clears it. Use 0.42 for a still hold. The functions do not change figure art or game state and have no clocks.

## Limits

This is a local sample. It does not change `src/`, game rules, art files, or the shipped app. The timeline tests signals, not the full move animation. The hint uses a fixed legal move and does not run search. The hint and shove indications retain the accepted direction. Reserve drop and last move have no animation samples.
