# Interaction discovery design

Status: resolved
Type: task
Blocked by: none

## Request

Design the next layer on this branch: propose rule combinations and challenging
scenarios, find gaps in interaction coverage, and turn surprising game sequences
into saved regression tests. This request approves design, not a product build
or new game runs.

## Plan and checks

1. Map the current study, coverage, replay and measurement interfaces.
2. Specify bounded proposals, honest coverage counts and reviewed regression
   promotion. Record support limits, source binding and acceptance cases.
3. Make a rendered sample with proposals, gaps, a replay review and a saved case.
   Check navigation, phone layout and example labels. Run document checks.
4. Present the spec and sample for approval. Keep the live eight-game proof and
   its heartbeat separate. Do not edit its engine or launch more games.

## Findings

The current coverage rows are designer labels linked to check IDs. They cannot
prove a complete interaction matrix. Study traces show state changes, not rule
causation. Challenge lines are checked for legality, not goal completion or a
forced solution. Four-cell measurements support named piece/card factors; they
do not support arbitrary rule switches or the custom T piece. The new layer
must preserve these distinctions.

## Answer

The [spec](../interaction-discovery.md) and
[sample](../sample/discovery.html) are ready for owner review. Build pair
proposals and coverage, then verified replay-to-regression promotion. Keep
triples and bounded reply search as separate later slices. A reviewed intended
result can create a failing regression; engine observations never approve their
own expected behavior. Preserve full history, source binding and the complete
scope denominator.

The rendered sample has four views. Browser checks exercise gap → review,
disabled save before expectation confirmation, sample save and return to
coverage. The missing count changes from six to five; the failed count changes
from two to three. The total stays 24. At 390 × 844 the document width remains
390 pixels, with no horizontal overflow. Screenshots have a visual check at
the default size and phone size. The viewport is reset after the check.

Evidence: `/tmp/kingdown-discovery-proposals.jpg`,
`/tmp/kingdown-discovery-coverage.jpg`, `/tmp/kingdown-discovery-phone.jpg`.
The sample uses illustrative values and saves nothing. No engine, run service,
remote job or adopted rule changes in this design task. The live proof remains
under its existing heartbeat. The build waits for spec and sample approval.

`npm run test:docs` passes: seven files, 113 assertions. `git diff --check`
passes. No product implementation tests run because only the design and static
sample change.
