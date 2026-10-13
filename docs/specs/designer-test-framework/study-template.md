# Design study template

Copy this file into a study ticket. Replace each bracketed field. An empty field
is an open question, not permission to use an implicit default. Small fixture
studies can mark statistical fields “not applicable” with a reason.

## Intent and scope

- Study ID and version: [ID]
- Design ID, version and parent: [exact references]
- Kind: [piece, card, power, effect, game rule, or scenario]
- Rule sentence: [what happens, when, to whom, at what cost, and for how long]
- Intended player choice: [choice and tradeoff]
- Expected counterplay: [what the opponent can see and do]
- Primary question: [one answerable question]
- Baseline and candidate: [exact difference]
- Population and mode: [armies, starts, pool, players or policies]
- Out of scope: [claims this study cannot answer]
- Matrix entry and owner status: [source; proposed, lab, or approved]

## Meaning and support

| Field | Definition |
|---|---|
| Source, owner and targets | [including exclusions and target selection time] |
| Active condition or event trigger | [reads current state, history, or both] |
| Action and cost | [move, free action, extra action, resource and use limits] |
| State change | [movement, attack, capture, protection, identity, reserve, etc.] |
| Timing and order | [safety points, continuation, expiry and conflict rule] |
| Repetition and termination | [why the event sequence ends] |
| Support | [edit / preview / full game / AI / replay / measurement, each with status] |

## Frozen context

- Source commit and source-file hashes: [manifest]
- Ruleset and full resolved rules: [artifact and hash]
- Design versions, army pool, card pool, deal, setup and replacements: [artifacts]
- Piece values, evaluator parameters and files: [exact values and hashes]
- All policy settings and resource budgets: [including card and power hold settings]
- Random streams, schedule and independent blocks: [IDs and artifact]
- Outcome, repetition, draw and action-cap rules: [exact rules]
- Compute plan and run authorization: [not needed for fixtures, or owner quote and queue row]
- Output store and backup plan: [existing results-root contract]

## Scenario contract

- ID and ruleset reference: [IDs]
- Origin: [constructed, generated, or game ID and action index]
- Full state: [board, side, turn, rights, spent flags, marks, hands, history,
  reserves, clocks, random state, and every other field the rules read]
- Legal prefix or reachability status: [prefix, proof, or constructed only]
- Actions to try: [unambiguous engine actions]
- Expected legal actions and refusals: [facts and rule references]
- Expected state and events: [before, intermediate, after and expiry]
- Save, undo and replay assertions: [facts]
- Player challenge, horizon and solution status: [optional; alternatives included]

## Coverage and study plan

| Case or comparison | Why needed | Expected fact or measure | Status and evidence |
|---|---|---|---|
| Normal use | [intent] | [fact] | [unrun] |
| Refusal and boundary | [risk] | [fact] | [unrun] |
| Both sides and timing | [risk] | [fact] | [unrun] |
| Shared-state pair | [dependency] | [fact] | [unrun] |
| Multi-rule sequence | [dependency or exclusion reason] | [fact] | [unrun] |
| Full ruleset | [integration] | [fact] | [unrun] |

- Primary measure, unit and practical margin: [definition and approval status]
- Secondary measures and comparison family: [complete list]
- Control and exposure matching: [what is held fixed and how this is checked]
- Independent unit and interval method: [block, game, player, etc.]
- Pilot, sample size, precision target, stopping and maximum cost: [plan]
- Failed jobs, missing cells, retries and caps: [predeclared treatment]
- Discovery versus fresh confirmation: [separate data and seeds]
- Policy competence and cross-play: [checks, opponents, resource budget]
- Actual cost and timeouts: [decision/game durations, overruns, worker/thread
  settings, predeclared timeout rule and treatment of unequal cost]
- Human task and experience claim: [participants, order, help, measures]
- Falsifier: [what would reject the design claim]

## Results and decision

| Answer | Result | Evidence | Limits and next check |
|---|---|---|---|
| Correctness | [missing / invalid / inconclusive / resolved] | [fixtures] | [scope] |
| Integration | [status] | [coverage and failures] | [scope] |
| Balance | [estimate, interval and band result] | [report] | [scope] |
| Strategy | [observed plan and failure case] | [replays and cross-play] | [scope] |
| Counterplay | [observed replies] | [earlier and later branches] | [search limit] |
| Human experience | [counts, ratings and observations] | [playtest record] | [sample limit] |

- Validation: [source, schedule, completeness, direct legal replay, controls]
- Strongest counterexample: [scenario and what it shows]
- Independent review: [reader, findings and fixes]
- Decision: [keep in lab / revise / park / propose adoption for a named mode]
- Owner approval: [quote and scope, or pending]
- Evidence that would change the decision: [specific next question]
