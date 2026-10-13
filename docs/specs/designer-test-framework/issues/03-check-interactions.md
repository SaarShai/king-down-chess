# Check interactions and save challenge positions

Status: claimed
Type: task
Blocked by: 02 for integration; visual sample approval for new controls

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

Owner approval, 2026-10-12: “approved. start building the framework on this
branch, beginning with saved studies and interaction tests.”

## Build plan

1. Add deterministic assertions for legal/refused actions and complete state at
   an action index. Results name each assertion, its expected fact and its actual
   result. Missing support stays separate from a failed fact.
2. Cover custom-piece plus card, custom-piece plus power, both-side marks, extra
   actions and expiry. Add a selected three-part sequence with declared order.
3. Save source-linked challenge goals and legal lines. Preserve complete state
   and history on export/import and replay; never infer entity identity from a
   square alone. State unsupported identity attribution honestly.
4. Reuse the engine for behavior. Validate every recorded move directly. Verify
   that separate studies do not change the game's rules or one another.
5. Review the code and fixtures; run npm test and the affected browser checks.

No campaign is part of this ticket.

## Build checkpoint

The first runner and five constructed studies are built. Checks name expected
and actual facts at each action index. A failed assertion, invalid replay,
unsupported operation, and untested case have separate results. Coverage never
turns a missing check into a pass.

Cases cover the unchanged Rook, custom piece with Haste, custom piece with Frost,
two marks with free marks and Haste, and the second-player turn rule. The trace
stores observed state changes. It does not infer a cause or entity identity.
Challenge lines retain their goal and horizon. They are legal suggestions;
goal proof, uniqueness and difficulty remain unmeasured.

The [usage guide](../usage.md) lists the reads and changes used to select these
cases. Unknown fields and unsupported rule language fail at import. There is no
event interpreter, so an authored event cycle cannot run.

This ticket stays open for browser integration, persistent entity identity and
causal engine events. Capture, swap, promotion and return identity are not yet
claimed. No balance campaign or human playtest is part of this checkpoint.
