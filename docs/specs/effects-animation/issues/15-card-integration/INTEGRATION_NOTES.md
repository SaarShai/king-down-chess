# Card integration notes

## Caller changes for root

`src/plugin/screens/board.ts` skips all drops at `stageMove` and response playback. Use `move.drop === undefined || move.power === 'salvation'` at both animation gates. At `stageMove`, sync a drop immediately only when `move.drop !== undefined && move.power !== 'salvation'`. This keeps ordinary reserve drops immediate and sends Salvation (including Mirror Salvation) to PaintedView.

The other callers already pass all moves: `src/screen/play.ts` (live play and review), `src/ui/previously.ts`, and `src/ceremony.ts`. They need no card change. Keep their generation checks and fallback hit callback. Callers still sync the legal result after playback resolves.

## Shared file merge

Card work owns PaintedView.animateMove, animateBack cancellation, skip/dispose card cleanup and small lifecycle calls. State work owns its other fields, sync/state drawing, highlight and marks. Root merges those hunks. Scene changes add one timeline option to its existing play method; ordinary play is preserved.

Shared materials come from `src/render/effects/materials.ts`. Local copies of the approved materials/fire are check aids only. Do not copy them over state worker output.

## State layer handoff

The new private PaintedView field `card: CardPlayback | null` exposes `card.shown: Position`. In the state worker's draw path, use `this.card?.shown ?? this.pos` while card playback runs. The scene samples `card.position(t)` before it calls the host's under/over decoration. This keeps existing wards on the actual shown figures. The card layer draws new Freeze/Ice Wall/Firewall material during onset and omits that new mark from `card.shown.marks` until the final frame, to avoid duplicate material. It draws the moving whole-army ward around intact traveling figures.

Keep the card field clear in sync, skip and dispose. The card patch already adds those lines. Keep the hidden-tab/reduced-motion cancellation call at the start of applyLively. Ordinary moves still use scene.play with no effect option.

## Browser evidence

`capture.mjs` starts its own Vite server on a free port and its own browser. It closes both in finally. It uses the production PaintedView with the shared legal fixtures. It does not open the owner's tabs or use port 5198. It captures nine card turns at two widths and both directions (36 completed turns). Root can register it as a by-name browser check; this worker does not edit `tools/lib/registry.mjs`.

The initial capture's Mirror continuation check sampled after the normal 420 ms pawn move had ended. The capture now asserts an active card scene only for card effects. Both legal Mirror actions finish and the original Freeze card stays unspent.

## Files to take

- `src/render/effects/card.ts`, `card-types.ts`, `card-hero.ts`, `card-movement.ts`, `card-spell.ts`, `card.test.ts`.
- Card-only hunks in `src/render/PaintedView.ts` and `PaintedView.test.ts`.
- `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts`.
- Ticket 15 and its capture/evidence files.

Do not take local `src/render/effects/materials.ts` or `fire.ts`. They are exact approved-preview copies for isolated checks. Use the state worker's files at those paths.

## Known integration limits

The isolated tree still has the old state draw code. Root must use `card.shown` in the new state layer. Thus this tree's settled Freeze still uses the old frost result, and existing army wards on stationary figures depend on the shared layer merge. The card onset and traveling army-ward material use the approved material here.

Control and Mimic do not encode a lender square in Move. The renderer finds the first real friendly lender whose engine-generated movement matches the action. Control requires an adjacent lender. This is deterministic and never uses a fixed sample square.

An action with captures emits one card contact at the reviewed contact time, .62 of its action. Quiet cards, marks, drops and replacements emit none. Ordinary capture callbacks remain with the original scene. Caller fallback sound callbacks still apply when motion is Off, reduced, skipped or hidden.
