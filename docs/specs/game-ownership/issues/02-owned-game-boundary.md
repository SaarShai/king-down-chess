# Integrate the game-owned boundary without changing search behavior

Type: task
Status: open
Blocked by: 01
Parent: U04

## Outcome

Each game owns its immutable rules and search lifetime. Product helpers cannot read another game's active rules. Preserve current moves, human atomic turns, computer action budgets and commit order.

## Work

1. Extend the existing compiled browser/worker check with controlled multi-action games, cancellation and retained warm state. Compare independent game workers with interleaved games. Capture per-action limits and accepted action order; Node fixed-depth probes alone do not close this gate.
2. Use the smallest boundary supported by ticket 01: owned immutable definitions and private synchronous helper entry points, with no product callback escape. Keep search state per game. Keep the server's existing isolated worker/reset policy.
3. Migrate `Game` and its actual local/account/Workshop helper callers in one working slice. Include status, setup, notation, preview and save/reload. Do not add a second authority or compatibility API.
4. Replace the baseline tests that pin unsafe ambient behavior with assertions for the corrected product boundary. Add an import check that prevents product callers from bypassing it.
5. Preserve existing complete-turn rejection, repetition, uses and continuation. Run relevant mechanics, state, worker and browser checks once, obtain independent review, then publish only a staging preview if product source changes.

## Verification

- Different game configurations cannot change each other's legal moves, status, setup or notation.
- Nested calls and errors restore internal scope; asynchronous work cannot escape through the public API.
- Preview does not mutate accepted state. An invalid later action rejects the complete human turn.
- Compiled computer fixtures preserve budgets, action order and cancellation. Warm state remains within its owning game.
- Save/reload and the signature-mechanics web–ChatGPT journey still pass.
- Product imports enforce the boundary. Original project and production remain unchanged.

## Limits

No new rules, art, AI policy, per-node allocation scheme, generic effect language or mandatory server-worker removal. Arbitrary simulation evaluator overrides are not covered by ticket 01; treat their ownership explicitly if this change reaches those callers.
