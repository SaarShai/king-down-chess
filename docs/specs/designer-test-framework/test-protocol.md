# Tests for designer rules and play

This protocol is proposed. The existing
[piece criteria](../../research/piece-balance-criteria-2026-10-03.md) remain the
approved piece standard. New acceptance limits need an explicit study decision.

## 1 Define the claim and the game

Write one primary question. Examples: “Does this piece get used?”, “Does this
card pair create an effect beyond either card alone?”, or “Can a player learn
the timing without help?” Name the population: armies, starts, opponents, skill,
mode, card pool and rules. A claim about a test pool is not a claim about every
possible game.

Freeze full resolved rules, design versions, setup, values, evaluator parameters,
search policy, resource budget, seed schedule, draw rules, action caps and source
hashes. Record replacements and exclusions. A rule diff or an evaluator name is
not a complete context. Keep the baseline unchanged while comparing rule variants.
If a rule requires a new evaluator, report fixed-policy results first; test the
adapted evaluator in a separate study with the same training budget and fresh
evaluation positions.

## 2 Check correctness before strength

Each new rule or effect needs at least one positive case, one refusal, one
boundary case and one interaction case. The fixtures state expected facts before
execution. An empty result without an assertion is not a passing test.

| Risk | Checks |
|---|---|
| Movement and attack differ | Move-only and take-only squares; shots; blockers; pins; king-target restrictions and check detection under the chosen rules |
| Multi-step action | Valid and invalid intermediate states; optional versus required continuation; cost paid once; actual side to act |
| Condition or duration | Just before, at and after a boundary; both sides; extra actions; expiry after source removal |
| Shared state | Two simultaneous marks; spent uses; copy history; reserves; repetition; draw clocks |
| Identity changes | Capture, resurrection, swap, promotion, spawn; identity and type remain distinct; derived events name the source |
| End of game | Mate, stalemate, dead position where supported, repetition, draw rules and caps under the full ruleset |
| Save and undo | Full state, rule identity, rights, history and random state survive save/reload, replay and undo/replay |
| Engine parity | Board preview and engine agree on their shared scope; legal actions execute; illegal actions are refused |

Use seeded generated states to broaden checks. Keep a valid move prefix for any
state used to claim real-game frequency or reachability. Label hand-built states
as constructed until reachability is established. Minimize a failure to the
smallest useful state and sequence, then retain it as a regression fixture.

Only use symmetry when the rule permits it. Forward movement, asymmetric powers,
zones and turn order can break a naive board rotation. Use a verified color and
orientation transform. Baseline equivalence is a useful control: an unchanged
custom copy must match its base piece within the declared support.

Directly match every replay action to the legal action set. FEN/LAN parse and
round-trip checks alone do not prove legality. Use a known illegal action as a
negative control for the validator. A round-trip state format must be checked
for all required history; store a legal prefix or explicit missing state where
the existing format does not carry it.

## 3 Select interactions by risk

Index what each item reads and changes: square occupancy, capture protection,
attack, turn state, history, identity, reserve, resource or end condition. Link
items that share these fields, trigger one another, or compete for a target.
These links select tests; they do not prove an interaction or prove independence.

Test the changed item against one representative of each applicable behavior
family. Add every known conflict and every direct dependency. Then add selected
triples and longer sequences where two effects feed a third. Examples include
shield + displacement + check, copy + extra action + expiry, and spawn + promotion
+ reserve. Cover both action orders when order can matter.

Keep a coverage table: required, passed, failed, unsupported, untested, or
excluded with a reason. Test high-risk combinations first. Random composition
search supplements this table; it cannot replace the explicit cases. Do not
enumerate every setting of every game flag.

## 4 Choose the right balance comparison

| Question | Comparison | Interpretation |
|---|---|---|
| Piece worth | Replace one reference piece on one side; swap colors; calibrate pawn odds at the same depth and settings | Worth under the tested armies and policy; outside calibration range report a bound |
| Piece role | Ordinary activity plus phase, survival, legal opportunities and actual use | Use and paralysis, not just material value |
| Card or power value | Focal item versus explicit alternative; then the whole field and final deal | Marginal strength, matchup spread and pool-level effects are different answers |
| Two-item interaction | Matched neither, A, B, A+B cells | Extra joint effect beyond the separate effects |
| Whole rule or bundle | Exact baseline versus candidate on the same sampled starts | Total effect; cannot attribute it to each changed part |
| Strategy | Cross-play policy variants at the same rules and resource budget | Tested behavior and opponent dependence, not intrinsic rule strength |

Do not remove a piece without recording what replaces it. If material or setup
changes, the result includes that change. A budget-matched comparison uses a
separately calibrated value table. Reuse neither that fit's training games nor
its price assumptions as independent proof that the new item is balanced.

The six piece criteria are worth, capture share, move share, phase role,
participation and game health. Retain the approved bands and Guard exception.
Criterion 4 cannot fail as written; label it descriptive. Show 4b as a proposal,
not an adopted threshold. Presence-versus-absence cohorts describe association;
use a controlled replacement to make a causal claim about the piece.

In games with powers and cards, separate ordinary moves from special actions.
Track source entity, acting entity and changed entities. A passive effect needs
an eligibility or prevented-action measure; zero “uses” does not mean zero effect.
Use the starting-piece denominator for participation. Report promoted and spawned
pieces separately. Show how often a condition is possible, holds, and is used.

For cards, record offered, drawn, held, legally playable and spent instances;
targets, timing, copies and unused cards at the end. Count use per eligible
opportunity as well as per dealt card. If information is hidden, agents must not
read the hidden state. An omniscient test is labeled as such.

Always show outcome, first-player score, draw reasons, duration, caps, paralysis
and matchup spread beside value. Use turn and decision counts beside action
counts when extra actions change the meaning of a ply. Light and Dark may be
stronger than the other kings; test their direct contrast separately with a
declared equality margin. Do not force all six kings to one target by accident.

## 5 Keep uncertainty and selection honest

For two items, define the interaction as `I = y(AB) - y(A) - y(B) + y(neither)`.
Use a predeclared outcome in its own units: score or draw percentage points,
turns, or another explicit measure. Share the army/opening block across all
four cells. Swap the focal side. Record exact deals and random streams where
valid; a shared seed alone does not prove matched starts or card exposure.

Resample the independent unit, usually the army/opening block. Keep all cells,
sides and dependent observations together. Report block count, game count and
missing cells. More games on the same small set of armies do not give the same
coverage as more armies. For human studies, retain dependence within a player
and a pair of players.

Predeclare the primary outcome, practical margin, interval method, family of
comparisons, maximum sample and stopping rule. Use a pilot to estimate cost and
variance; choose the confirmation sample from the needed precision. A pilot used
to select a lead is discovery data. Keep it out of fresh confirmation unless a
valid sequential plan explicitly includes it. Do not extend a run until it passes.

Show both estimates and intervals. “No clear difference” is not equality. A
confidence interval wholly inside an agreed equality band supports practical
equivalence in the tested context. A wide interval supports neither side.
Control multiple comparisons for a confirmatory family. Exploratory leaders
stay leads until tested on fresh seeds and starts. Count every searched contrast,
including hidden filters, in the discovery record.

Do not pool different depths, source versions or policies without a declared
model for those differences. Use a deeper run as a separate replication. Test
caps as unresolved games, show their rate and a sensitivity range for outcome
claims. If a legacy report scores them as draws, label that convention and show
whether another treatment can change the conclusion. Preserve failed jobs and
denominators; use a predeclared rule for retries and incomplete blocks.

## 6 Find strategies and challenge positions

Use four sources: designer hypotheses, risk cases, self-play traces and human
play. Search for events that realize the intended choice: a setup sacrifice,
delayed card use, a protection break, a rescue, a fork, a forcing chain, or a
stalemate trap. A detector nominates a replay. It does not name a strategy as fact.

A strategy record contains the starting conditions, goal, action sequence,
resources spent, alternative plans, opponent replies and failure cases. Verify
the sequence legally. Describe the behavior observed, then test it. A “spend”
setting is a hypothesis about behavior until actual use timing and counts change.

Cross-play a small policy panel: baseline, a policy that favors the new idea, a
policy that tries to defeat it, and a different strength or search style. Give
each the same declared resource budget for a comparison. If one policy beats
another that beats a third, retain the cycle and matchup table. A single rating
can hide it. Check tactic competence, legal play and usable response time before
using an agent as a balance instrument.

For time-limited tests, record actual decision and game durations, overruns,
worker and thread counts, and the timeout rule chosen before the run. Equal
requested time is not always equal actual cost. Show cost beside strength;
label comparisons with unequal measured cost rather than calling them equal-budget.

At a surprising outcome, go back before the commitment. Let the opponent choose
an earlier defense. Repeat from fresh starts and with stronger or different
search. A rescue test at a lost position does not show that the threat was
unavoidable. Best-response search can find abuse; failure to find abuse is not
a proof of safety.

Save an interesting line as a scenario with its full prefix and rules. State the
player's challenge, success condition and horizon. Record alternative solutions.
Label a finite-horizon result as bounded; do not call it forced or unique without
a valid proof. Group duplicate positions and repeated tactical ideas, then choose
varied examples across items, phases and difficulty. Measure difficulty with
people; engine depth alone does not define it.

## 7 Test experience with people

Write the experience claim before the session. For example: “Players see the
threat, can choose to spend a defense or change their plan, and want to try again.”
Use a small exploratory group across stated familiarity levels. It finds reasons
and failures; it does not estimate all players' preferences.

Use the same short tasks with baseline and candidate. Counterbalance their order
and sides. Keep instruction and help consistent. Record familiarity, order,
ruleset and any help. Let people predict an action before showing its result,
then explain the result in their own words. After a delay, ask for the rule again.

Record these separately: correct predictions, lookups, time to choose, perceived
options, ability to recover, surprising interactions, frustration, enjoyment and
choice to replay. Ask which exact moment caused each response. Keep counts with
denominators, individual ratings, disagreements and brief quotes. Store identifying
player data separately from shared design evidence.

Human judgment decides whether the result is worth keeping. A surprising move
count, an interest heuristic or a model's narrative is not a fun measure. Any
advisory automated rubric needs its controls; invalid controls void the verdict.

## 8 Review the decision packet

Show the design change and intended experience first. Then give the six answers,
their evidence, coverage gaps and one strongest counterexample. Include the
ruleset and study identities, representative replays, raw-data references and
validation record. A second reader checks claims and limits.

Choose keep in the lab, revise, park, or propose adoption for a named mode. Record
which evidence would change that decision. Keep good scenarios even when the
design is parked. A new version returns to the affected checks; unaffected old
evidence remains historical until its applicability is explicitly established.
