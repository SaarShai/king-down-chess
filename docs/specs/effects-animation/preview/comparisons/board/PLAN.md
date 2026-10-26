# Crowded board comparison

Status: verified preview; Proposed rejected

Scope: this folder only. Static preview. Keep the production art, engine and current marks.

## Owner decision

The owner rejects Proposed crowded-board marks. Keep the current game marks and their static behavior. Do not integrate this proposal.

## Plan
1. Build two dense engine fixtures. Apply Freeze and Ice Wall through legal moves.
2. Render Current with the production mark and state functions. Render Proposed in the same scene with static shape cues.
3. Capture an early sample. Check 1280 × 720, 1440 × 900 and 390 × 844 phone controls, legal targets, fixed pose, flip and keyboard access.
4. Save evidence and the external report.

## Checks
- [x] Early URL, screenshot and external ready note exist.
- [x] Both samples have legal target evidence and true frozen/protected states.
- [x] Current uses production marks, last-move wash and state effects.
- [x] Variant switch preserves position, canvas bounds and piece pose.
- [x] All marks and figures stay still; playing is false.
- [x] Desktop and phone screenshots pass visual review.
- [x] Keyboard, sample controls and flip work without page errors.
- [x] Focused type and browser checks pass; final report exists.

## Design
Mode: Operate. This local preview extends the existing painted board. It uses one board and nearby controls. The brief fixes the visual direction; no product or design files outside this folder change.

## Result

The page uses one PaintedScene and two 32-piece engine fixtures. Current calls the production mark and state functions. Proposed changes only the static marks. The engine plays Freeze on c3, a7-a6, and Ice Wall on e4. The last move comes from that legal pawn move.

`npm run typecheck` passes. A strict standalone TypeScript check of `main.ts` and its imports passes. `verify.mjs` passes on 1280 × 720, 1440 × 900 and 390 × 844. Twelve image holds stay identical over 900 ms. Six Current renders match a real PaintedView with zero changed channels. Sample, selection, keyboard, flip and reduced-motion checks pass. No browser errors occur. The evidence is in `legal-evidence.json` and `verification.json`.

The final twelve screenshots pass a visual review. Selection stays under the figures. Desktop controls and the key sit beside a height-bounded board. The full board, controls, key and readout fit 1280 × 720 and 1440 × 900. The phone shows one readable board. Its controls, board and readout fit the viewport. All 15 imports resolve after this folder is copied: local files travel with it and external source files exist in both worktrees.

The design detector reports one cream-palette warning. The page inherits the game's parchment, stone and painted art; this is a fixed visual constraint. No other detector finding occurs.

The registered `verb-marks` check waits behind an exclusive check in another lane. It is stopped by its exact PID before it starts. This is not recorded as a pass. The preview diagnostic provides the focused browser evidence. No full test suite runs.

## Verification rule

Compare the painted scene only after its contact-shadow stamp build and fade settle. `PaintedView.ready()` confirms the first art frame. The diagnostic also waits for idle work and then 300 ms with no new scene frame before it compares pixels. This keeps a loading shadow from being reported as a changed mark.

## Scope and review

All repository writes stay in this folder. There are no production, dependency, global tracker, commit or deployment changes. The simple solution uses one scene, the existing engine and the existing mark functions. No extra rendering layer or copied art is required.
