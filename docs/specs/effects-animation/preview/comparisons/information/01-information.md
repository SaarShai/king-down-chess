# Contextual information comparison

Status: verified preview; Proposed rejected

## Owner decision

The owner rejects the proposed game-information layout. Keep the current game layout. Do not integrate this proposal.

## Plan

1. Reuse the real board, table styles and rule text in a local harness.
2. Keep Current at the source layout. Add a full piece reading and turn instruction in Proposed.
3. Check both sizes, all samples, rule focus, state and assets. Keep the server on port 5303.

## Acceptance checks

- Current uses `src/ui/table.css` without baseline overrides. Text follows `readPiece` and `contextLine`.
- Both variants share one position, selection and settings. The board uses `PaintedView` and `marksModel`.
- Pawn, Archer, Frozen, Mercy and staged turn use real rules and legal actions.
- Proposed has full text and no horizontal overflow at 1280×720 and 390×844.
- All rules opens the selected piece or power. Close returns focus to its opener.
- An assert-based browser check passes. No storage write, console error or failed asset load occurs.

## Scope

Only this folder changes. This is a local sample. No production code or dependencies change.

## Result and checks

- The local sample runs on port 5303. All five scenarios work.
- The browser check passes at 1280×720 and 390×844. It checks 10 scenario and size pairs.
- Current matches a render of the real game in text, font, clamp and element bounds. The Pawn leaves `rank.` below the clamp.
- Proposed shows the full guide. All checked text fits its element. Horizontal overflow is 0 px at both sizes.
- Toggle keeps the position, mark, selection, turn and settings. Desktop board pixels stay equal.
- Rules focus the correct piece or power. Escape and Close return focus to each opener.
- The engine stops the frozen knight. Mercy stops the rook take and permits the pawn take.
- Keyboard controls, board selection, settings, End turn and Undo pass.
- The check records no storage write, console error or failed request.
- The final design scan returns no findings.

## Review

One board and one position serve both variants. Rule text comes from the game. Only this folder changes. All imports point to tracked files. No production code, dependency, tracker or save path changes. This sample needs no separate unit test; the assert-based browser check covers its state and focus logic. The full unit suite does not run.

## Evidence

External report: `/Users/za/.codex/visualizations/2026/10/23/01a168fe-8505-7842-89a3-dd078bd311a1/comparison-previews/information/information.md`.

Run the check from the repo root:

```sh
node docs/specs/effects-animation/preview/comparisons/information/verify.mjs /absolute/external/evidence/directory
```
