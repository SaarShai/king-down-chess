# Measure the staging feedback loop

Status: complete for available local staging evidence. Parent: U02; supports U09. Merge-to-preview and remote CI timing require future actual merge/run records.

## Plan and pass criteria

Reuse accepted checks and immutable staging deployment records. Do not run a new game suite or publish a new artifact to manufacture a timing sample.

1. Identify the current staging source and a small set of accepted prior releases. Read provider creation, build/ready and source metadata through the existing authenticated CLI. Keep production out of the query scope.
2. Join each deployment to its exact source and existing check receipt. Measure observed source-to-ready and check duration where both endpoints exist. Call a value merge-to-preview only if an actual merge and its timestamps are established. Missing timestamps stay missing.
3. Separate provider-ready, actual owner-testable readiness and manual verification elapsed time. Keep failed checks and excluded samples visible. Do not infer browser readiness from a READY deployment.
4. Identify any material, evidenced delay that has a small safe fix. Reuse existing runners; do not add another CI service, duplicate full suites or weaken a release gate. Retain provider timestamps in the existing deploy receipt; the command currently discards them.
5. Save raw selected metadata and a checkable summary beside the existing evidence. Update the reconciled backlog. Check the deploy guards and documentation. Keep deployment, product code, production and the second-account gate unchanged.

## Result

Five known staging deployments are measured through read-only provider queries and their existing source/build/check receipts. Provider creation-to-ready is 6.568–8.271 seconds; the median is 7.160 seconds. Four saved prebuild times are 2.143–2.562 seconds. The initial prebuild has no saved end time.

The final Ranked gate takes 257.738 seconds. It reuses three individually passed checks with 152.463 seconds of recorded runtime. The affected embedded journey runs again. Failed runs remain visible; no full-suite or whole-artifact equivalence is inferred from a focused pass. The 112 mechanics executions and eleven archived worker paths remain credited.

The initial integrated release is provider-ready but fails its first web open. It is not a usable-preview sample. Only presentation and Ranked have native cross-host acceptance in this sample. Their recorded acceptance times include manual work and host access interruptions. No exact first-usable timestamp, merge-to-preview or hosted CI duration is claimed: all five source checkpoints have one parent and the branch query returns no remote runs.

The deploy command now retains three provider timestamps in its existing JSON. Missing values stay null. No extra provider request, helper, dependency, service or release gate is added. The existing runtime guide defines the fields and requires separate alias/game observations.

## Verification and limits

Typecheck and all four deploy guard tests pass through `KINGDOWN_TEST_FILE=tools/deploy-staging.test.ts npm test`. The normal runner also passes 54 art tests. Review confirms the receipt fields are additive; project, history, target and ready-state guards are unchanged. The provider's `ready` field supplies `readyAt`; container-exit time is not used. `npm run test:docs` passes 161 checks in 13 files. An evidence check verifies all 34 selected receipt hashes and 71 relative file links. No extra abstraction or release service is needed.

[Measured evidence and methods](../../../../../evidence/staging-preview-feedback/verification.md) link the exact sources, deployment IDs, raw selected metadata, receipt hashes, failures and calculations. The change needs no publish or game-suite rerun. Live staging remains `5ac73cc9`; production and all account/device/host release limits stay unchanged. The second-account check does not block this work.
