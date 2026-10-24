# Card effects study

Status: ready-for-review

## Scope

Build an isolated review page for all 21 released cards. Use the painted scene, existing art and production board marks. Resolve the shared fixture actions through the engine. Do not change production code or rules.

## Plan and checks

1. Build Strike and Earth Quake as the first review samples. Check source, travel, contact and result on the board.
2. Cover all released card IDs with distinct effects. Keep each fixture's action sequence and result. Check legal actions and literal expected board/marks during page setup.
3. Add deterministic seek, replay, pause, normal/slow speed, reduced motion and board flip. Check one active scene, paused/hidden clock and a 390 px viewport.
4. Record evidence and limits here. Root performs the final browser review and integration.

## Limits

This is a proposed effect study. It is not live match integration. Figures keep their existing painted anatomy; the study moves whole figures and adds effects around them.

## Implementation

The page is `preview/cards/index.html`. It uses one `createScene` and the shipped painted art. Card playback suppresses instructional selection, move, take, swap, shove and last-move marks. Source and action text stays in the controls. Removing the target marks also fixes the stale capture badge which remained over the surviving rook after Burn contact. The frozen result uses `frozenPieces`, `frost` and `FROST_DEFS`, including the remaining-turn pip. The ward result follows the engine mark's owner, square and army scope. Freeze, Ice Wall and Firewall share `preview/signals/materials.ts`: a broken ice mass, curved ice slabs and local flame tongues. Material backs draw below the figures; fronts draw after their screen row. The active card builds the material, then the engine mark holds it at a fixed state. The moving warded rook carries its fire circle.

The preview copies the card-family data from `tools/fixtures/shared-mechanics.ts` into `fixtures.json` so the browser does not import Node assertion code. `check-fixtures.mjs` requires exact equality with that source. The page also checks the legal action, checkpoints, board, card use, marks, reserve, turn and relevant rule fields on load. It resolves all actions through `GameRules.legalMoves`, `toLan` and `makeMove`.

Each action has source, action, contact and resolve phases. The multi-action cards retain both events. Burn, Freeze and Earth Quake are the first revised hero proofs: 1.5, 1.6 and 1.65 seconds. `hero-effects.js` draws short material trails, local bloom, chips, sparks, smoke and dust from the deterministic event clock. It never shakes the board or changes a figure. The other 18 cards now use `movement-effects.js` and `spell-effects.js`. All 21 use the same event clock; old route diagrams and glyph helpers are removed. The full set remains open for visual review. Burn is the opening capture sample. Strike retains the shared quiet pawn move and never shows a ranged strike or promotion.

| Card | Distinct effect and result |
| --- | --- |
| Freeze | Revised hero: cold energy gathers at the king, travels as a short bright wake, bursts into powder and chips, then frost grows around the knight. |
| Ice Wall | A curved wall of ice slabs grows around the own rook and remains as a ward. |
| Strike | The pawn sheds a short gold wake and a few arrival motes, without a capture burst. |
| Haste | A gold wake and afterimages follow the rook through two separate captures. |
| Flight | The knight rises over a fixed ground shadow and lands in its own half. |
| Sacrifice | Rose essence rises from the pawn; gold fragments reveal the returned queen through a continuous crossfade. |
| March | Two dust footfalls follow the pawn through the middle square to its final square. |
| Leap | The rook rises above its own pawn, which stays on a2. |
| Salvation | Rising gold petals and light reveal the returning rook on h1. |
| Mirror | Reflective facets split the frost stream; the frozen material persists during the later quiet pawn move. |
| Firewall | Protective flames and embers build around the own army; the moving rook keeps its fire. |
| Earth Quake | Revised hero: broken seams grow, a dust pressure front moves outward, and stone chips and landing dust follow the engine pushes. No board shake. |
| Burn | Revised hero: energy gathers around the rook; a tapered fire wake follows travel; contact throws a broad asymmetric plume with a hot core, dark smoke and long sparks, then clears to the rook silhouette. |
| Fire Starter | A fiery wake follows the rook; a local flame plume marks its capture on the back rank. |
| Control | Teal essence leaves the adjacent friendly rook; wisps follow the knight's borrowed move. |
| Rally | Gold energy rises around each of the two different movers, with quiet arrivals. |
| Morph | A lilac cocoon and continuous crossfade reveal the knight on the pawn's square. |
| Mimic | Pale glass fragments lend the rook's movement to the knight and trail its quiet move. |
| Vault | Blue updraft and a ground shadow show the vault; sparks mark the landing capture. |
| Curse | Violet smoke carries the enemy knight one square without changing its side. |
| Sky Lift | Blue and lilac updrafts lift the two figures into a swap, with short wakes and ground shadows. |

## Verification evidence

- `node --check docs/specs/effects-animation/preview/cards/study.js` passes.
- `node --import tsx docs/specs/effects-animation/preview/cards/check-fixtures.mjs` passes: 21 released cards, 25 legal actions, exact source data, all checkpoints and final expectations.
- Root's first browser pass loads the page without console errors. It found a panel-height issue; controls and the mobile card selector now precede the board. The first fixed cap still let global game control styles push the board below the viewport. The preview now resets control width, minimum size, margin and section gap within `.study`. `fitStage()` subtracts the measured non-board controls from the available viewport height. Desktop controls sit below the board; mobile controls sit above it.
- Root review found that airborne cards needed figure lift and settled states needed marks. Both are fixed in the owned page. The final root check covers these frames; visual acceptance remains with the owner.
- The review API is `window.effectsStudy`: `ready`, `select(id)`, `seek(progress)`, `getState()` and `samples`. Selection and seek pause playback. The controls add replay, pause, normal/slow speed, board flip and reduced motion. `?sample=Burn`, `?sample=Freeze` and `?sample=EarthQuake` select direct hero views; UI selection updates browser history. The first ready frame starts one playback unless reduced motion is on.
- The page's single clock stops on pause, hidden tab and page exit. Reduced motion shows the final position and does not force playback. Passive scene motion is disabled.

## Review limits

This page proposes effect timing and presentation. It does not add effects to a live match. All figures use the shipped pose; travel, jump lift and a change-of-piece crossfade do not claim new articulated animation. The ghost renderer's contact-shadow draw is suppressed only for airborne preview figures, with a separate shadow on the ground. This adapter belongs to the preview, not production.

No production file, dependency, game rule or deployment changes. No full test suite runs in this worker. Root owns the final browser pass at desktop, panel and 390 px widths, the independent review and integration. Owner visual acceptance remains open. The owner rejected the earlier thin symbolic ice/fire wards; these now use the shared authored materials. The owner also rejected the schematic card action style. All 21 revisions replace routes and outlined shapes with local material effects. The root browser check passes with action/contact sheets and hero playback recordings; see ticket 01. A separate review found a transformation pop at 35%; source removal and crossfade now start together and resolve at 62%.
