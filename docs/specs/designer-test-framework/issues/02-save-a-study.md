# Save and replay one design study

Status: needs-info
Type: task
Blocked by: owner approval of the framework spec and a rendered sample

## Outcome

A designer saves one supported custom piece and one complete scenario, plays an
action, undoes it, and sees the same result in the Proving Ground, game and replay.
The [unchanged Rook example](../worked-studies.md) is the first acceptance case.

## Scope

Reuse `DesignSpec`, the existing share code, `Position`, FEN/LAN, `genDesigned`,
`movesOf` and the current save controls. Add stable version references and a
scenario contract for state, history, rules and expected facts. Validate imports
before changing the open game. Show the operation support table with reasons.

Use the existing one-design slot. Preserve the three-rule limit. Refuse unsupported
history conditions and a second distinct design. Do not add a new move interpreter.
The record format states its version and refuses an unreadable format.

## Checks

- Unchanged Rook has equal moves and attacks across the shared paths.
- Positive, blocked, pinned, checked-king and both-color cases pass.
- Save/reload, undo/replay and full-state equality pass, including spent state.
- Direct legal replay rejects a known illegal action.
- Bad or unsupported input leaves the saved game and current rules unchanged.
- `npm test` and the affected registered browser checks pass.
- The owner approves the rendered sample before the visual build.

## Evidence

Pending. No implementation or run is authorized by this ticket alone.
