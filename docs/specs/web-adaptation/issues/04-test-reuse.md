# Find the reusable test seams

Type: research
Status: resolved
Blocked by: 01, 02, 03
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:research

## Question

Which existing checks give the highest useful test seam for web adaptation?

## Evidence

- `src/api/http.db.test.ts` covers website identities and cross-surface game actions.
- `src/match/service.db.test.ts`, `setup.db.test.ts`, `matchmaking.db.test.ts`, and `results.db.test.ts` cover service transactions.
- `src/plugin/state.test.ts`, `queue.test.ts`, and `screens/board-model.test.ts` cover state rules.
- `tools/plugin-ui-harness.ts` and `tools/plugin-protocol-fixture.ts` supply controlled views and failures.
- `tools/plugin-*.test.ts`, `tools/plugin-ui-check.mjs`, and `tools/lib/` hold device and race assertions.
- `tools/lib/registry.mjs` lists the existing named web checks and plugin checks.

## Answer

Use the HTTP boundary with the real service and disposable database as the main correctness seam. It proves identity, validation, transactions, retries, privacy, and cross-surface play in one place. Add a small number of browser journeys for the user-visible boundary. Keep existing pure setup, engine, reducer, and draft tests when their modules move. Do not copy the full service suite behind every screen.

Add one registered web account-play check. Give the existing browser fixtures a top-level-page driver. Reuse the assertions for turns, input, card targets, retries, and layout. Keep MCP/host-only checks on their existing driver.

A screenshot does not prove a touch move. The check selects the board destination, submits the turn, and reads the saved server revision. Native Android input, desktop WebKit input, and a real iOS browser are separate evidence.

## Limit

This resolves reuse, not acceptance. No check runs in this task. [Choose the test and device gate](16-test-gate.md) holds the proposed acceptance matrix.
