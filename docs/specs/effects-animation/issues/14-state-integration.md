# State effects on the painted board

Status: resolved
Type: task

## Scope

Apply the twelve approved state and indication studies to real board state. Keep the eight excluded mark kinds static. Preserve character playback and engine rules. No deployment, commit or pull request. Other workers own card playback and interface effects. Root owns the combined checks, review and merge.

## Plan and checks

1. Move the four reviewed materials to `src/render/effects/`. Make both workshops use the same source.
2. Read marks and protection from the game rules context. Track actual position changes. Load and repeat sync show quiet hold. A new live state has onset. Removal clears only at its valid square.
3. Draw ground effects before figures and front material after its row. Reuse the approved Archer, ghost, Swap, Shove, Check and Hint art. Keep excluded marks static.
4. Check static marks at different times, load/sync/undo/replay/expiry/rematch, variant rules, layer order, Fast/Off/reduced/hidden/dispose. Use focused tests through `npm test`. Capture the real game at 430 and 390 px and both board directions.

All four steps pass. No new owner approval is claimed.

## Integration matrix

| Study | Real hook | Limit |
| --- | --- | --- |
| Freeze | `Position.marks`, `GameRules.markKind`, live forward sync | Approved ice volume builds, holds at a fixed frame and thaws on actual expiry. No thaw over an empty or replaced square. Freeze still permits attacks. |
| Ice Wall | The valid ward slot, owner, target square and remaining turns | Uses the engine's square. No invented rule makes a single-square ward follow a shove. |
| Firewall | Valid whole-army ward slot and its owner's current pieces | All pieces have the approved fire material. A moved piece keeps the hold at its new square after sync; no new flare on each move. |
| Guard | `context.rules.guardImmune` and actual Guard squares | No shield when immunity is off. The king exception clears when another protection blocks that capture. |
| Holy Light | Current power, shelter flag, king square and permitted neighbours | Uses the orthogonal or full-neighbour rule in the current context. Never shelters the king itself. |
| Mercy | Current power, shelter flags, king square and permitted neighbours | Keeps the pawn exception where the engine allows it. A pawn-only lab aura has no matching approved material and gets no misleading mantle. |
| Distant Archer focus | The selected Archer and real `Highlights.shots` | Focus stays at source and eligible target. No projectile or generic capture animation. |
| Hover ghost | A real legal destination under pointer or keyboard cursor | Keeps the production ghost and the approved brief foot ring. The legal tile remains static. |
| Swap pair | Real selected square and `Highlights.swaps` | The approved braided light runs once and settles. Neither figure moves in the preview. |
| Shove and landing | Real `Highlights.shoveTo` | The approved trace joins target and landing. Existing rings and landing arrows stay readable. |
| Check and cause | Real `Highlights.check` and engine checker paths after a live forward sync | Approved danger entrance settles into the warning ring and cause lines. Load and replay show quiet hold. |
| Hint | Actual `Highlights.hint` from the lesson search | Uses the real Show me result, including a multi-step Beast path. No mock search result or new normal-game Hint control. |

All twelve hooks are complete. None lacks a real consumer. The five later GUI object samples remain outside this worker's scope.

## Static exclusions and lifecycle

Selection, extra-move availability, legal destinations, generic capture targets, Beast bite order, threats, reserve drops and last move use still production marks. `drawMarks` no longer reads a clock or accepts onset fields. Power runes and the old Swap arrows stay still; the approved Swap light uses a bounded onset.

Ground marks draw before figures. Painted material fronts and pips draw after their screen row. Symbols draw above material faces and badge edges so their identity stays clear. Symbol badge contents sit in the gap between rows; no badge covers the next row's icon. The real symbols source is used in the capture.

State progress uses the existing scene wake period. No new timer or frame loop is added. A quiet hold stops its own wake work. Fast doubles progress. Off, system reduced motion, hidden tabs and skip settle state work. Dispose clears it. Repeat sync does not restart onset. Equivalent normalized rule values retain history even when online updates rebuild their wrapper. Changing games explicitly clears that history before the first sync, even with equal rules and consecutive plies. Rewind and replay of known positions use quiet holds. A new rematch can still start a new effect with the same rules context. Protection exceptions account for combined wards and shelter.

The combined renderer suppresses action indications during existing character playback. Settled materials stay on unaffected pieces. It excludes moving source/target squares from the ordinary state layer until landing; card playback supplies its actual shown position. No new ordinary combat effect is added. Character playback itself stays unchanged.

## Exact source changes

- `src/render/PaintedView.ts`: state observation, indications, layer hooks and lifecycle cleanup. `animateMove`, `animateBack` and `scene.play` are unchanged.
- `src/render/marks.ts`: remove the arrival wave and continuous mark motion. Preserve the still legend.
- `src/render/effects/materials.ts`, `fire.ts`, `state-flare.ts`, `archer-flare.ts`: move the approved implementations here with the same exports and drawing code.
- `src/render/effects/indications.ts`: move the approved ring, pips, trace and Check drawing from the sample. Share the 4.8-second timing value.
- `src/render/effects/states.ts`: derive valid states and track bounded onsets, holds, expiry and cancellation.
- `src/render/effects/board-effects.ts`: apply the shared drawing to actual board coordinates.
- `src/render/PaintedView.test.ts`, `src/render/marks.test.ts`, `src/render/effects/states.test.ts`, `src/render/effects/board-effects.test.ts`: focused checks.
- `docs/specs/effects-animation/preview/signals/main.ts`: import the runtime materials and indication drawing.
- `docs/specs/effects-animation/preview/signals/state-flare.test.ts`: import the runtime flare modules.
- `docs/specs/effects-animation/preview/cards/study.js`: change only the shared material import.
- This ticket and `evidence/14-state-integration/{GAME_READY.md,capture.mjs}`: plan, evidence and repeatable capture.

Delete the four old source files under `preview/signals/`: `materials.ts`, `fire.ts`, `state-flare.ts`, `archer-flare.ts`. They are moved, not copied. Both workshop pages load without page errors after the move.

## Evidence

Base: `bdd886c7`.

- Pass: `KINGDOWN_TEST_FILE='src/render/{marks,PaintedView,effects/*}.test.ts' KINGDOWN_TEST_LOCK_WAIT=5 npm test`. 51 focused tests and 50 existing scene tests pass, with the project type check. Log: `/tmp/effects-state-final-unit.log`. This is not a full-suite pass.
- Pass: `KINGDOWN_TEST_FILE='docs/specs/effects-animation/preview/signals/state-flare.test.ts' KINGDOWN_TEST_LOCK_WAIT=5 npm test`. Five approved-material tests, the type check and 50 existing scene tests pass. Log: `/tmp/effects-state-materials.log`.
- Pass: `PLAYABLE_BROWSER=chromium npm run check:browser verb-marks powers`. Run: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-state-game-FMXA3c/`.
- Pass: `PLAYABLE_BROWSER=chromium npm run check:browser lessons special-moves`. Run: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/effects-state-game-G9DUwZ/`.
- Real-game captures: `/tmp/effects-state-game/`. `capture.json` lists 57 images and no page errors. The set has 430/390 px, both directions, a real Freeze power tap, settled conditions, a moved Firewall ward, real board selections, the real lesson Hint and symbols. Both workshop pages also load. Log: `/tmp/effects-state-capture.log`.
- Early result and local launch notes: [GAME_READY.md](../evidence/14-state-integration/GAME_READY.md).
- Pass: `npm run test:docs`. 166 checks in 13 files pass. Log: `/tmp/effects-state-docs.log`.
- Pass: `git diff --check`.

The capture script uses its own free-port server and separate browser and closes both. It does not use preview port 5198 or the owner's tabs.

## Root merge notes

Keep these state calls when joining the card worker's changes: `stateEffects.sync` and `wakeStateEffects` in sync; `stopStateEffects()` in skip; `stateEffects.dispose()` in dispose; rate assignment in setPace; and the settle call in applyLively. Keep the shared runtime material paths above. Copy the preview import edits and remove the four former source files.

No dependency, engine, plugin, ceremony, registry, combat, art or pose file changes occur. No commit, PR or deployment occurs. Root still owns the final combined browser checks, independent review and merge. No blocker remains in this owned implementation.
