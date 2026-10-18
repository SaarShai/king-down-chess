# Approve the adaptation spec and build order

Type: grilling
Status: open
Blocked by: 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

Does the owner accept the web scope, the state boundary, the test seams, the sample and the phased build order?

## Rule

The spec is approved before its build, and the rendered browser sample before the visual build. The owner delegated these approvals to the agent on 2026-10-18 ("regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."); record them as "decided by delegation (owner, 2026-10-18)", each after an independent review. Deploys, runs, rule changes, spending and feature-branch merges to main still need the owner's word.

## Options

1. Accept the scope and resolve the open tickets with their picks where suitable.
2. Narrow the first web release and keep the other slices for a named later release.
3. Change the destination before the build.

Recommended: 1, after the blocked evidence and samples exist. Silence is not approval; the delegation is.

On yes: record the accepted choices and the source commit here. Mark the spec approved for the named phases. Make small build tickets from the phase slices (to-tickets), with the same checks. Add the TASKS.md line on main.

## Review checklist

- The inventory covers all built in-scope work and the web-only gaps.
- The local app and its saves stay usable.
- Web and plugin use the same services and the same account UI.
- The API, cache, identity, retry, budget and engine decisions are explicit.
- The sample uses real game rendering and records the owner's choices.
- The test seams check behavior and cover browser-only risks.
- Each slice ends in a complete, checkable user path.
- A reviewer who did not write the code reviews each non-trivial diff before merge.
- A deploy still needs the owner's word for its concrete public scope.
