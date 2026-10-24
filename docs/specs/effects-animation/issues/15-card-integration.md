# Card effects in the game

Status: resolved
Type: task

## Scope

Apply the 21 approved card studies to real board actions. Keep ordinary character playback and engine rules. Use the shared scene clock. No deployment, commit, or pull request. Root owns the final shared-file merge, review and integrated checks.

## Plan and checks

1. Trace every playback caller and engine card tag. Done. [Caller and merge notes](15-card-integration/INTEGRATION_NOTES.md) name the two plugin drop gates for root.
2. Copy approved material drawing into typed runtime modules. Done. Real move tags select the effect. Position continuation state selects the second Haste/Rally action and Firewall continuation. Mirror adds glass to the real copied effect and leaves card spending to the engine.
3. Check legal results, contacts and lifecycle. Done. The focused test command passes 78 tests in two selected files and all 50 scene tests. This is not a full-suite pass.
4. Capture production PaintedView at 430 px and 390 px, in both directions. Done. [Game ready](15-card-integration/evidence/GAME_READY.md) records the early real result. The source capture has 36 completed turns, exact final scene boards, expected contact counts, no page errors and no horizontal overflow.

## Integration matrix

Each row uses the approved drawing and timing. Card effects run only in card mode. Normal king powers do not gain card effects.

| Effect | Real hook | Limit or result |
| --- | --- | --- |
| Freeze | `power: freeze` | Ice travels from the moving side's king. The shared layer owns settled ice. |
| Ice Wall | `power: ward` | Material grows on the real marked piece. The shared layer owns the hold. |
| Strike | `power: strike` | Gold follows the actual unit or stationary card shot contact. No normal capture VFX is added. |
| Haste | `power: haste`, then `Position.haste` | Both legal actions get their reviewed half-duration. Pass adds no effect. |
| Flight | `power: flight` | The intact real unit lifts and lands on its legal square. |
| Sacrifice | `power: sacrifice` | The real before/after figures share the reviewed crossfade. |
| March | `power: march` | Dust follows the pawn and intermediate footfall. Promotion uses the legal final figure. |
| Leap | `power: leap` | Air and dust follow the real jumper; blockers remain. |
| Salvation | `power: salvation` with `drop` | The reserve figure rises on its real square. Root must allow this drop through plugin animation gates. |
| Mirror | `Move.via: mirrorb` or `mirror` | Glass layers over any released copied card effect. Only the engine's Mirror spend is shown. |
| Firewall | `power: firewall`, then `free` with an army ward | Approved fire forms round the real army. Moving wards follow the intact unit. The shared layer owns stationary holds. |
| Earth Quake | `power: quake`, `Move.pushes` | All real pushes play together, including an empty source square. No damage or capture is added. |
| Burn | `power: burn` | Approved source, fire travel and impact align with the legal contact. |
| Fire Starter | `power: firestarter` | Fire follows the actual move and back-rank contact. |
| Control | `power: control` | Finds a real adjacent lender with a matching engine move. First matching lender is deterministic. |
| Rally | `power: rally`, then `haste` with `rage: 3` | Each different unit gets its reviewed half-duration. Pass adds no effect. |
| Morph | `power: morphp` | Real pawn and legal knight/bishop crossfade on one square. |
| Mimic | `power: mimic` | Finds a real matching friendly lender. The mover keeps its real type. |
| Vault | `power: vault` | The intact unit lifts past the real blocker and lands at the legal contact. |
| Curse | `power: curse` | Ink follows the real enemy piece. Its army and type stay as the engine sets them. |
| Sky Lift | `power: skylift`, `swap` | Both real figures rise and trade squares together. |

## Evidence

- `KINGDOWN_TEST_FILE='src/render/{effects/card,PaintedView}.test.ts' npm test`: 78 selected tests pass; all 50 scene tests pass. Covers all 21 shared card fixtures, 20 Mirror copies, exact legal results, per-action contact counts, normal captures and reserve drops, skip, sync, replacement, replacement by pass, contact re-entry, disposal, hidden tabs, Off, reduced motion and Fast.
- `npm run check:browser painted-game`: passes in 117 s. Covers 61 real plies, 21 captures, mouse and touch, both directions, quiet gait timing, Fast/Off/skip, review/replay, lessons and phone layout. Output: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-card-game-8rG1cb`.
- Local source capture: 36 complete turns at 430/390 px, both directions. Output: `/tmp/effects-card-game-evidence`. See the capture script and Game ready record. Root owns final browser registration.
- `git diff --check`: passes.

## Files

- New runtime: `src/render/effects/card.ts`, `card-types.ts`, `card-hero.ts`, `card-movement.ts`, `card-spell.ts`.
- Tests: `src/render/effects/card.test.ts`, card-related change in `src/render/PaintedView.test.ts`.
- Wiring: card field/lifecycle and playback hunks in `src/render/PaintedView.ts`; the effect option in `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts`.
- Ticket evidence: `15-card-integration/INTEGRATION_NOTES.md`, `capture.mjs`, `evidence/game.html`, `evidence/game.ts`, `evidence/GAME_READY.md`, and two early Burn PNGs.

Local `effects/materials.ts` and `effects/fire.ts` are exact copies for isolated checks. They are not card integration changes. Root takes the state worker's files instead.

## Root handoff

Merge the state layer's `card.shown` use and the plugin Salvation gates before final acceptance. The isolated tree keeps the old settled-state drawing until that merge. No other caller change is needed. The owned card implementation is complete. No engine, ordinary character-motion module, plugin screen, ceremony, registry, dependency or deployment file changes here.
