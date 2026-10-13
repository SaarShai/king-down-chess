# Save and replay one design study

Status: claimed
Type: task
Blocked by: rendered sample approval for new visual controls only

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

Owner approval, 2026-10-12: “approved. start building the framework on this
branch, beginning with saved studies and interaction tests.”

## Build plan

1. Save a versioned study with full rules, explicit Position state, source
   identity, design references, legal history and assertions. Do not use FEN as
   the only state: extra actions make its inferred ply count wrong.
2. Validate the whole import before changing a session. Reuse Game and direct
   legal-action matching for play, undo and replay, in an isolated context.
3. Provide local file save/load and a deterministic study check. Build the
   unchanged Rook control and the boundary/negative cases.
4. Render a small sample of study controls around the real board. Get the
   owner's yes before the visual build. Continue nonvisual work meanwhile.
5. Review independently; run npm test and the affected browser checks. Record
   concrete results before marking the ticket done.

Verification follows the checks above. No game campaign is part of this build.

## Build checkpoint

The nonvisual layer is built. It has a strict, versioned full-state format,
source checks, legal replay, play, undo, and local file export. The command line
refuses output overwrite. Tests compare My Rook with Rook for both sides,
blockers, pins and check. They check moves and attacks in the shared engine
scope. Extra actions retain their exact counters; FEN is display only.

The [usage guide](../usage.md) gives commands and limits. The record supports
constructed positions. It refuses real-game provenance until a start and prefix
can prove it. The ticket stays open for browser integration.

The [rendered sample](../sample/README.md) contains eight desktop and phone
states. It uses the real board renderer and marks. Results are labeled
illustrative. The owner has not yet approved this sample.

Independent review finds one import gap: drawn cards can exceed the engine's
eight-card hand limit. The fix checks dealt plus drawn cards and adds a rejection
test. Further tests cover GrowthB and a held turn that gives check. The reviewer
checks the fix and finds no remaining should-fix in these changes.
