# Check interactions and save challenge positions

Status: needs-info
Type: task
Blocked by: 02 and owner approval of the framework spec

## Outcome

A designer adds an existing card, power or game rule to a design scenario, sees
the exact effect and its limits, and saves a failure or interesting line.

## Scope

Reuse `powerMarks`, `cardMarks`, `playPower`, `playCard` and the game engine.
Keep the current influence trace. Add engine events and refusal reasons only
where a selected case requires them. Reference stable rule instances and entities.
The rendered marks use `src/render/legend.ts`.

Describe each supported item's state reads and changes. Use these to propose
pair and multi-rule cases. Save coverage with explicit unsupported and untested
cells. Keep whole-game rules and state isolated for each case. A hand-built board
is marked constructed; a real-game claim needs its legal prefix.

Save a challenge with full rules and state, goal, horizon, alternate solutions,
and provenance. Engine lines are suggested solutions unless proven. Difficulty
stays unmeasured until people try it.

## Checks

- At least one piece/card, piece/power and rule/turn-state case passes end to end.
- Mark expiry with extra actions is checked at each applicable boundary.
- A targeted three-effect sequence tests shared state and order.
- Illegal sub-actions, unresolved conflicts and event cycles give clear failures.
- Stable identity survives each supported capture, swap, promotion and return.
- An engine event and a rule-influence explanation cannot be mistaken for each other.
- Two isolated rulesets cannot change one another's state or search settings.
- `npm test` and affected browser checks pass; visual changes use an approved sample.

## Evidence

Pending. Add the precise fixtures before implementation. No campaign is part of
this ticket.
