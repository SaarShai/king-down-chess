# Record hosted staging duration evidence

Status: bounded hosted duration evidence recorded; release acceptance remains open. Parent: U09.

## Plan and pass criteria

Use the provider's existing read-only metrics for the accepted staging deployment. Keep product code, telemetry settings and deployment unchanged. Reuse the native acceptance window and record the exact project, deployment, time range, metric, filters and aggregation.

1. Save the metric schema and the provider's p50, p95 and sample count for the same scope. Split counts by status and route so errors and non-game requests stay visible.
2. Record regions and function start types only if the existing schema exposes them. Do not collect client addresses, user agents or private payloads.
3. Distinguish server function duration from network, browser readiness, individual game operations and physical input latency. Do not compare unlike measures or claim a phone result.
4. Reconcile the blueprint and ticket status with current evidence. Run documentation checks. Keep the earlier source, compiled, loopback and native evidence; rerun none without a relevant change.

## Scope

Project `prj_6iNibe34pA8ZSblH8DPAHyDTuz3j`, deployment `dpl_CtN33YipFC2U7etN9tC8FrJkahfD`, game source `5ac73cc9`. Use the bounded acceptance window from 2026-10-21 05:00 to 06:30 UTC. Production, load tests, added telemetry and new infrastructure are outside this task.

## Result

The provider reports 67 function calls on `/mcp`: p50 352 ms and p95 1,386 ms. All groups use the preview environment and `iad1` region. Status counts are 200: 47, 202: 8, 204: 3, 400: 8 and 409: 1. The breakdown sums to the same 67 calls. Start types are 65 hot and two prewarmed; no cold-start measurement is claimed.

The parent evidence folder `staging-hosted-performance` holds the schema, raw queries, hash receipt and scope report. Percentiles use the provider summary, not bucket arithmetic. The first breakdown syntax was rejected; the documented repeated group options succeed. No rejected result contributes to the measurements.

This sample does not measure a specific move, opening a game, client network, sign-in or a phone. HTTP statuses alone do not establish application success or error causes. The existing loopback benchmark remains separate. Keep physical-device and operator gates open. No product or deployment change occurs.

## Checks

All query scopes and time bounds match. The grouped count equals the total; artifact hashes are recorded. `npm run test:docs` passes 161 checks in 13 files. The diff has no whitespace errors. Product tests are not repeated because no product code changes.
