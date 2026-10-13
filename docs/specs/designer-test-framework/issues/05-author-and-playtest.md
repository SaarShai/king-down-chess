# Author effects and record human play

Status: needs-info
Type: task
Blocked by: 04 and owner approval of the framework spec

## Outcome

A designer defines a card or power from supported effect parts, checks it, tries
it in a full game, and submits evidence about play as well as balance.

## Scope

Choose one concrete designer request before this build. Add its effect definition
to the shared rules vocabulary and MATRIX as a lab proposal. Reuse named engine
behavior where possible. Each supported composition states targets, timing, costs,
duration, stacking, king safety and termination. Unsupported behavior gives a
reason; it is not replaced by a similar existing behavior.

Do not introduce arbitrary user scripts or a second generic interpreter. A new
behavior primitive requires engine work and conformance fixtures. Once supported,
designers can combine and parameterize it without writing code. Expose a new
part only after edit, preview, full-game, replay and evidence paths work.

Add playtest records to design studies: tasks, version, participant familiarity,
order, help, observed choices, predictions, lookups, ratings and exact moments.
Keep identity data separate. Add the six-answer decision packet, including its
strongest counterexample and the owner's adoption decision.

## Checks

- The chosen new effect works through a piece or card and its selected interactions.
- A card and a power can refer to shared effect behavior without sharing costs or evidence by mistake.
- A composed trigger chain terminates; an unresolved conflict cannot start a game.
- A small recorded human trial tests prediction, choice, counterplay and replay interest.
- Missing or conflicting human evidence remains visible; no aggregate fun score appears.
- `npm test` and affected browser checks pass. The owner approves the rendered sample.
- Multiple distinct custom-piece types remain unsupported until a separate engine
  spec covers type identity, state format, hashing, evaluation and all game paths.

## Evidence

Pending. Human recruitment and any campaign need their own concrete plan. This
ticket changes neither official rules nor live hosting.
