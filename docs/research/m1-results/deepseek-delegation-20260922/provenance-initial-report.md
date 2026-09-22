# Source/spec provenance qualification for paired comparisons

Owned files only: `tools/conditions.ts`, `tools/conditions.test.ts`, `campaign/provenance-report.md`.

## Scope and plan

Qualify the `--pair A,B` branch of `tools/conditions.ts` by the top-level `src`, `specKey` and
`rulesKey` stamped on every record.

Plan (all items applied):
1. Add a small pure validation seam: `identifyArm` (per-arm identity, rejects internal mixing) and
   `qualifyPair` (cross-arm: rejects a differing known source id, reports settings differences).
2. Reject an internally mixed arm: two different values, or a mixture of missing and present
   values, for any of `src`/`specKey`/`rulesKey`.
3. Reject two different known source ids across arms.
4. Do not reject differing `specKey`/`rulesKey`; print the observed identities and require review of
   the frozen specs for intended differences and equal practical budgets.
5. Print prominent `UNVERIFIED` status when an arm is fully unstamped or one arm lacks identity.
6. Preserve existing arithmetic, duplicate-gameId/start-field validation, sparse-sample handling and
   the `(per-game interval, not setup-clustered)` wording.

No new framework or dependency. Records have no new required fields.

## Acceptance checklist

- [x] Mixed identity values (different values, or missing+present) within one arm are rejected,
      for each of `src`, `specKey`, `rulesKey`.
- [x] Different known source ids across arms are rejected.
- [x] Differing `specKey`/`rulesKey` across arms is allowed, printed and flagged for review; not
      rejected wholesale.
- [x] All-legacy missing identity and one-side missing identity print `UNVERIFIED`; neither becomes
      verified.
- [x] Same hashes are stated not to prove matching practical cost.
- [x] Per-game vs setup-clustered uncertainty wording preserved.
- [x] Existing regressions green; `npx tsc --noEmit` clean.

## Evidence

Pre-fix failure (before editing `tools/conditions.ts`), two arms with different known source ids:

```
$ npx tsx tools/conditions.ts --pair .tmp-prov/pa.jsonl,.tmp-prov/pb.jsonl
paired 1 games (.tmp-prov/pa.jsonl minus .tmp-prov/pb.jsonl) · unmatched A 0 · unmatched B 0
  result +1.000 · ...
exit=0
```

The old code accepted `srcAAA` vs `srcBBB` (and never printed either identity). Fixtures were
synthetic JSONL in a worktree-local `.tmp-prov/`, now removed.

Post-fix, same command:

```
$ npx tsx tools/conditions.ts --pair .tmp-prov/pa.jsonl,.tmp-prov/pb.jsonl
Error: conditions: .tmp-prov/pa.jsonl source id srcAAA differs from .tmp-prov/pb.jsonl source id srcBBB; arms played by different known sources cannot be paired
exit=2
```

Coherent same-source pair:

```
provenance (.tmp-prov/pa2.jsonl vs .tmp-prov/pb2.jsonl)
  source .tmp-prov/pa2.jsonl=srcAAA .tmp-prov/pb2.jsonl=srcAAA (match)
  specKey .tmp-prov/pa2.jsonl=spcAAA .tmp-prov/pb2.jsonl=spcAAA
  rulesKey .tmp-prov/pa2.jsonl=rulAAA .tmp-prov/pb2.jsonl=rulAAA
  observed settings hashes match, but equal hashes alone do not prove matching practical cost (budget); review the frozen specs before treating the arms as equal-budget.
exit=0
```

Differing `specKey`/`rulesKey`, allowed with qualification:

```
provenance (.tmp-prov/pa2.jsonl vs .tmp-prov/pb3.jsonl)
  source .tmp-prov/pa2.jsonl=srcAAA .tmp-prov/pb3.jsonl=srcAAA (match)
  specKey .tmp-prov/pa2.jsonl=spcAAA .tmp-prov/pb3.jsonl=spcBBB
  rulesKey .tmp-prov/pa2.jsonl=rulAAA .tmp-prov/pb3.jsonl=rulBBB
  observed specKey and rulesKey differ across the arms: legitimate only as an intended rule/evaluator treatment. Review the frozen specs to establish the intended differences and equal practical budgets; the hashes alone establish neither, and matching hashes alone do not prove matching practical cost.
exit=0
```

One-side missing identity, unverified:

```
provenance (.tmp-prov/legacy.jsonl vs .tmp-prov/pb.jsonl): UNVERIFIED
  ...
  UNVERIFIED PROVENANCE/SETTINGS: source (.tmp-prov/legacy.jsonl), specKey, rulesKey missing on at least one arm; this paired comparison cannot claim same source or same settings. One arm is a fully unstamped legacy run.
exit=0
```

Required checks:

```
$ npx tsc --noEmit
exit=0

$ npx vitest run tools/conditions.test.ts
Test Files  1 passed (1)
     Tests  27 passed (27)
exit=0

$ git diff --check
exit=0
```

New tests: unit tests of the seam (mixed/different value and missing+present mixture for each
identity field; uniform/partial/legacy arms; different known source rejected; differing
spec/rules allowed with review; legacy and one-side missing unverified; coherent pair verified)
plus CLI tests through `--pair` for the same cases. The 16 pre-existing tests still pass.

## Limitations

- No campaign games were run and no real stored run was sampled; evidence is synthetic fixtures.
- A one-side-missing identity is described as `UNVERIFIED`, not rejected, matching the assignment.
- The settings check compares hashes only. Differing or equal `specKey`/`rulesKey` cannot by itself
  establish an intended treatment or equal practical budget; the report states this and requires
  human review of the frozen specs.
- Identity is limited to the three top-level fields named in the assignment; no other metadata is
  cross-checked.

Status: prerequisite ready for review. Supervisor acceptance is the next step.
