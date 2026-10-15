# Interaction discovery

Status: proposed; owner approval required before build.

This layer helps a designer find what to test next. It proposes combinations,
shows missing tests, and turns a reviewed game moment into a saved check. It
uses the existing Studies workflow. It does not invent or adopt game rules.

## Design boundary

The designer chooses a saved ruleset, the items in scope, and a test budget.
The system proposes cases with a reason. The designer selects cases, inspects
observed behavior and declares the expected result. Only then can a case enter
the regression suite. A discovery is a lead, not a balance or fun verdict.

Start with a deterministic planner and detectors. No language-model service or
new compute service is required. The main checkout's run rules still apply.
Proposals and coverage inspection start no games. Measurement plans use the
existing preview and per-run approval path. Search has its own explicit budget;
it cannot silently turn into self-play or a remote campaign.

## Current seams and limits

| Existing part | Reuse | Required addition |
|---|---|---|
| `src/study/model.ts`, `session.ts` | Full rules, complete position state, replay prefix, source check | Verified game-to-study extraction with provenance |
| `src/study/check.ts` | Legal action, square, state and status checks | Separate reviewed expectation record; coverage obligations |
| `src/study/evidence.ts` | Versioned study with linked measurements | Separate discovery document referencing saved study versions |
| `src/study/measurement-plan.ts` | Supported recipe validation and preview | Link a proposal to a supported plan; explain rejected mappings |
| `src/sim/replay.ts`, run validation | Legal replay and frozen run evidence | Bounded signal scan and a candidate index |
| `docs/MATRIX.md`, rule and card registries | Meaning, legal values and implementation status | Typed interaction descriptors with conformance checks |

Current traces report state changes, not which rule caused them. No detector
may claim attribution from a board change alone. Current challenges validate
legal example lines only. This design adds explicit goal checks and reply
coverage before any stronger claim. Four-cell tests currently support selected
piece/card factors, not arbitrary rule flags or the custom T piece. Unsupported
proposals remain visible; they cannot create an invalid run plan.

## 1. Select a finite scope

A discovery document freezes the source, complete rules, design versions,
catalog version and generator version. The scope lists named item versions and
selected parameter values. It also declares side assignments and mode. It never
expands all combinations of every numeric or boolean engine setting.

An interaction descriptor has a stable item ID, implementation status, valid
modes, dependencies, conflicts, read/write state fields, action phases and a
source reference. Examples of shared fields are marks, turn ownership, capture
permission, movement, hand resources and game-ending status. These fields select
likely interactions; they do not prove causation or establish rule precedence.
The engine and approved rule text remain authoritative. Unknown descriptors
appear as catalog gaps. They are never silently excluded from the denominator.

A rule change starts with MATRIX as usual. This layer introduces no rule change,
so it does not add new game items to MATRIX.

## 2. Propose combinations with reasons

Enumerate every feasible pair within the selected scope. Enumerate both action
orders when order can matter. Also enumerate who owns the effects: same side
and opposing sides where legal. Exclude an impossible combination only with a
recorded constraint and its source. Keep a count and inspectable list of these
exclusions. A missing adapter means unsupported, not impossible.

Offer triples as a separate tier. Nominate them when a pair affects a third
item's state field, when a prior failure names that third item, or when a
designer requests them. Show the selected triples and all omitted triples.
Pair coverage never means coverage of all triples or all rule behavior.

Rank proposals in this stable order:

1. Reproduce a current failure or a changed rule's prior failure.
2. Fill an untested timing, side or boundary case for a changed item.
3. Test items that write/read the same state or alter the same action phase.
4. Fill remaining pair gaps; then nominated triple gaps.

Break ties by canonical item IDs and scenario IDs. Save the full candidate
count, selected IDs, omitted IDs and reasons, seed and limits. A budget selects
a prefix of this order. Increasing a budget retains earlier selections.
Deduplicate before ranking, but keep every nomination's provenance.

Default planning bounds: 12 selected items, 200 proposed obligations and 24
scenario drafts. Show overflow before generation and ask for a narrower scope
or an explicit larger bound. No silent truncation or random sampling is allowed.
A weighted set-cover heuristic may reduce the proposed scenario list, but only
against explicit obligations. Label it a heuristic; show any uncovered cells.

## 3. Create challenging scenarios

Each scenario template names its prerequisites, construction rules, relevant
items, trigger action, observation boundaries and candidate checks. A generated
board must pass the existing position validator. Every setup action must replay
legally under the frozen rules. An arbitrary constructed board is not claimed
to be reachable from a normal game start.

The first template families cover:

- Blocked and clear paths; friendly and enemy blockers; edge and corner cases.
- Protection before and after capture, displacement, swap and expiry.
- Extra actions, chain captures and end-of-turn timing; both actual actors.
- Spent resources, last available use, empty hands and unavailable targets.
- Check evasion, exposed kings and action-caused terminal states.
- History-sensitive repetition and draw state, with the required full history.

Templates emit a positive case and a nearby negative case when both are legal
states. They use actual turn ownership, not ply parity. They cannot assume that
mirroring colors preserves directional rules. Each transformed case is checked
again. Missing state support, such as persistent entity identity through return,
is reported as unsupported.

A challenge adds a goal expressed with supported facts and a finite action
horizon. Keep an earlier decision point before the commitment, not only the
position where a tactic already wins. In the first slice, replay designer
example lines and check the goal at their endpoints. Record alternative replies
manually. Label the result “example line verified; replies not exhausted.”

Later bounded search can enumerate legal replies with explicit node, time and
horizon caps. A timeout or incomplete reply tree yields unknown, never forced.
A unique-solution claim requires a complete proof under the stated horizon and
goal. Human playtests remain the source of difficulty and enjoyment evidence.

## 4. Show coverage as obligations and evidence

An obligation key contains catalog/source/rules/design fingerprints, item and
parameter versions, ownership, action order, template and boundary. A display
label cannot make two different keys equivalent. A coverage report shows:

| State | Meaning |
|---|---|
| Missing | Feasible obligation with no saved case |
| Draft | A candidate exists; expected behavior is not reviewed |
| Ready | Reviewed expectations exist; no current check result |
| Passed / failed | Current source ran the referenced checks |
| Blocked | Case exists but cannot run; show the cause |
| Unsupported | Required state, adapter or check is unavailable |
| Stale | Evidence belongs to a different source or relevant context |
| Excluded | A stated constraint makes the combination impossible |

Show counts for the complete selected scope, not just the visible filter. For
example, 24 declared obligations = 8 passed + 2 failed + 5 draft + 6 missing +
1 unsupported + 2 stale. Report exclusions separately. This is scenario coverage,
not a percentage of all possible positions. “Both rules appeared in a game”
is exposure evidence only and never becomes a passed behavioral obligation.

A passed cell needs at least one reviewed check that concerns its stated
interaction. Link the exact study version, check IDs and result hash. A negative
control or rule-ablation case can strengthen the claim; merely listing two item
names cannot. Multiple linked cases aggregate conservatively: any current
failure is visible, and an unreviewed draft never replaces a failed case.

Source changes make old results stale by default. Keep them for comparison.
Re-run against the new source as an explicit new execution. A dependency map
may prioritize checks; it cannot mark old evidence current without execution.

## 5. Nominate surprising game sequences

Scan only explicitly selected, validated local run outputs. Freeze input hashes
and record all games scanned, rejected files, detector settings and scan limits.
Initial bounds: 200 games and 20,000 recorded actions per scan. Preview actual
counts and local replay work. Overflow needs a narrower selection or explicit
budget change. Streaming validation must not load an unbounded result corpus.

The first detectors are deliberately observable:

- A declared study expectation differs from the observed replay.
- A resource or mark changes twice before turn ownership changes.
- One action removes multiple pieces or produces an extra-action state.
- Legal-action count crosses a designer-declared threshold.
- A legal action causes checkmate, stalemate or a draw near an active effect.

A signal records its before/after values and threshold. Shared active rules are
candidate participants, not proven causes. Score swings are not a first-slice
detector: current logs need a consistent evaluation scale, perspective and
search budget before such a comparison is valid. Strategy and fun labels remain
hypotheses. Player nominations can refer to the same verified game/ply keys.

Preserve run ID, part, game/pair ID, source/spec/settings, raw-file hash, action
index, full move prefix and actual side to act. A filename alone is insufficient.
Reject torn records, invalid moves and source mismatches. A failed or capped
game is labeled as such; it may still yield a legal behavioral case, but is not
silently promoted to complete balance evidence.

Group exact duplicates by full state, rules and relevant history, not board FEN
alone. Keep all source references. Approximate tactical similarity can group
cards in the UI but cannot delete cases. Do not normalize colors unless all
rules in the scope support that symmetry and transformed replay passes.

## 6. Review and save a regression

A candidate opens with the original replay and the first nominated boundary.
Show the detector reason, full context, before/after facts and nearby actions.
The designer can move the boundary earlier and select expected facts. Distinguish
“observed in this game” from “required by this design.” Engine output is not an
independent oracle; copying observed facts does not approve them.

Require an expectation basis: approved rule reference, designer decision with
reason, or independently authored test. The user must explicitly confirm the
expectations before promotion. If behavior is a bug, save the intended result
and show a failing regression. Do not alter the expectation to make it pass.

Promotion creates an ordinary versioned StudyTest plus a discovery provenance
record in one atomic library save. It retains the complete start state and replay
prefix, and converts action indices to the case's local boundaries. The default
keeps all history. Optional reduction may remove a suffix first, then try smaller
legal prefixes or fixtures only when the nominated condition and declared checks
still reproduce. History-sensitive rules keep their required history. A smaller
constructed fixture loses any claim of normal-game reachability. Keep the
original replay beside every reduction.

Saving is idempotent for candidate ID + reviewed expectation digest. It does not
overwrite the parent study or an existing regression. Storage failure saves
neither half and allows a retry. Export/import preserves the binding and all
provenance; missing raw files are shown as unavailable, not verified again.
Run regressions through the existing check service. A changed source requires
explicit rebase/replay and a new saved version; never edit a historical record.

## 7. Browser flow

Add “Explore interactions” to a saved study. Four connected views are enough:

1. **Proposals:** select scope and budget; show why each combination is proposed.
2. **Coverage:** inspect complete counts and filter missing, failed or stale cells.
3. **Review sequence:** inspect a nominated replay; choose expected checks and
   their basis. A challenge is optional, with a goal and bounded horizon.
4. **Saved regression:** show the new version, current check result and provenance;
   return to the gap it fills or create a supported measurement plan.

Unsupported and stale cases have explicit next steps. A proposal that cannot map
to a supported measurement recipe opens behavioral study authoring instead.
The existing run approval remains the only route to remote games. Static sample
values are examples and no sample control saves, scans or starts games.

## 8. Data and implementation slices

Add a strict, separately versioned discovery document, `kingdown-discovery/1`.
It references existing study/test versions rather than adding optional fields to
strict study schemas. Store scope and generator fingerprints, obligations,
proposals, detector scan manifests, candidate provenance and reviewed promotions.
Validate all references and counts on import. Retain unknown-source documents
as inspect-only; never silently rebind them to today's rules.

Use small modules: catalog/constraints, planner/templates, coverage reducer,
replay scanner and promotion service. They share the existing engine/replay and
study store. Browser workers handle bounded local checks with progress and
cancellation between games. A cancelled scan retains its scanned denominator
and unprocessed count. It never labels partial output complete.

Build end-to-end slices after approval:

1. Pair proposals and honest coverage: three template families, deterministic
   scope/budget, authored fixtures, drafts saved to the existing library.
2. Verified replay nomination and promotion: selected run inputs, the five
   observable detectors, explicit expectations, atomic regression save/reload.
3. Broader templates and nominated triples; supported measurement handoff.
4. Optional bounded reply search, only after its goal and proof semantics pass
   separate review. Human challenge testing remains distinct.

## Acceptance checks

- A fixed scope produces stable IDs and order; a larger budget preserves the
  earlier selection. All selected, excluded, unsupported and omitted counts sum.
- Order-sensitive effects generate both orders. A conflicting pair records its
  exclusion; an unknown descriptor records a gap. Pair completion leaves triples
  and untested boundaries visible.
- One failed check prevents a passed coverage claim. Mere co-occurrence and a
  copied observation cannot satisfy a reviewed behavioral obligation.
- Change source, rules, side, history, catalog or parameters: stale evidence
  cannot count as current. Same board with different marks/history stays distinct.
- Extract a real replay with an extra action and resource change: replay the full
  prefix, retain the actual actor and verify the extracted state byte-for-byte
  after canonical normalization. A corrupt or mismatched source is rejected.
- A legal surprise can save an intended failing regression. Saving twice creates
  one version. Simulated storage failure leaves neither a partial study nor an
  orphan provenance entry. Reload and export/import retain the exact binding.
- A negative fixture changes one relevant rule or expectation and must fail the
  intended check. This protects against self-confirming regression generation.
- A legal challenge line that misses its goal does not pass the goal check.
  Truncated search reports unknown; no forced/unique label leaks into the UI.
- A cancelled scan reports partial work. An oversized input fails before scanning.
  No discovery control dispatches a remote game or changes a saved run approval.
- Browser checks cover proposals → gap → review → save → reload on desktop and
  phone, keyboard access, readable labels, save failure and stale/unsupported paths.

## Review decision

Approve this spec and its rendered sample to build slices 1 and 2 first. They
close the loop from a coverage gap or verified surprise to a durable regression.
Triples and reply search remain explicit later slices. This approval starts no
new game campaign and changes no adopted rule.
