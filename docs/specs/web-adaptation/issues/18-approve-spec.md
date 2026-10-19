# Approve the adaptation spec and build order

Type: grilling
Status: resolved
Blocked by: 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17
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

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."), after six independent reviews ([review record](../../../research/web-adaptation-2026-10-18/approval-reviews-2026-10-19.md)).

**Option 1: accept the scope and the phased build order.** The merged services and account UI carry the route; the local page keeps its save and tools; the route and visual samples prove the browser boundary; the slice gates keep each incomplete operation closed. The [spec](../spec.md) is approved for phases 1 to 8, with [the test gate](../test-gate.md) and [the release route](../release-route.md). It excludes [shared screens later](../../shared-screens-later/README.md) and the map's Out of scope.

- **Source:** `2837bcc6` (main: the PR 61 merge `cd8fa9f2` and the PR 62 engine alias). The deploy source is the PR 63 merge, with test-only changes on top.
- **Order:** this approval comes before ticket 08 closes. Owner, 2026-10-19: "Yes: close ticket 18 now at the current main, and start ticket 01's code on codex/web-01 now. No tests, commits or pushes on this Mac until the deploy record. No merge or publish without my word." Step 3 of [ticket 08](08-release-evidence.md) is known from a read-only check; step 4 (the deploy ID, the served commit and the recovery path) follows from the deploy record and gates each publish.
- **Accepted choices:** the answers of tickets 01 to 17, as the [map](../map.md) lists them. The spec states each one in a line and links its ticket.
- **Build tickets:** [web build](../../web-build/README.md), 20 tickets in dependency order. The web-only work comes first (01 to 04: the test driver, the safe worker publish, the closed `/api` dispatch, safe reads and the account-off switch). Tickets 05 to 07 and every later move of shared screens start after the plugin session hands over `src/plugin/`. Each ticket changes from needs-info to ready-for-agent when its blockers and its Starts events exist.

### Review checklist

| Item | Evidence | Open gap |
|---|---|---|
| The inventory covers all built in-scope work and the web-only gaps. | [Inventory](../inventory.md) (81 work units), the [merge record](../../../research/web-adaptation-2026-10-18/release-record-2026-10-19.md), the [build coverage](../../web-build/README.md#scope-coverage). | None. |
| The local app and its saves stay usable. | [09](09-web-play.md), [11](11-save-ownership.md), [the test gate](../test-gate.md) (local saves across sign-in and sign-out, old links, offline files), the [post-merge baseline](../../../research/web-adaptation-2026-10-18/baseline-post-merge.md). | Product checks come with each build ticket. |
| Web and plugin use the same services and the same account UI. | [02](02-shared-client.md), [03](03-http-contract.md), [05](05-one-account.md); build ticket 05 keeps one implementation. | The `src/plugin/` handover; the same-user check on a test account. |
| The API, cache, identity, retry, budget and engine decisions are explicit. | [03](03-http-contract.md), [06](06-hosting-routes.md), [07](07-engine-compatibility.md), [10](10-account-entry.md), [11](11-save-ownership.md), [15](15-public-safety.md), [17](17-release-route.md). | The tested continuation of each engine in use and the recovery output, in build tickets 06 and 02. |
| The sample uses real game rendering and records the owner's choices. | [14](14-visual-sample.md) (78 renders, 69 trace checks, delegated choices, two reviews); [13](13-routes.md) (the history trace). | The local-home row has no render; build ticket 07 adds it. |
| The test seams check behavior and cover browser-only risks. | [16](16-test-gate.md) and [the test gate](../test-gate.md) (T1 to T5, redaction, crossed sign-in, worker, input and device cases); build ticket 01 adds the driver. | Real Android has no named tester; the speed baselines. |
| Each slice ends in a complete, checkable user path. | The spec's phase table, [the release route](../release-route.md), the [build order](../../web-build/README.md#order); the slicing review accepts all 20 tickets. | None. |
| A reviewer who did not write the code reviews each non-trivial diff before merge. | Each build ticket requires an independent reader, the confirmed fixes and the owner's merge word. | None. |
| A deploy still needs the owner's word for its concrete public scope. | [17](17-release-route.md) and each publish ticket: a reviewed packet, the exact main source and a separate publish go. | None. |

### What this approval does not give

No merge, run, deploy, database write, spending or rule change. Each build merge needs the owner's word. Each publish needs a separate go for its exact scope, with its release packet.
