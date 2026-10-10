# Build the balance and rules framework

Type: task
Status: done (PR #30 merged 2026-10-10)

## Acceptance checks

- The schema covers pieces, powers, cards, and rules. It lists source gaps.
- The dataset records value, error, sample, depth, machine, flags, commit, and source where known.
- The source ledger accounts for unavailable or invalid data. Pending rows have no result.
- Criteria show their source and approval state. Status rows link to evidence.
- Models show their limits. Blank NEW designs have no invented prediction.
- Proposed runs follow the queue format and stay unlaunched.
- `npm test` passes. Document drift fails the new check. A rebuild gives stable files.
- The pull request contains no game, price, or main tracker changes.

## Progress

The framework uses main `7035b5e` as its reviewed game source. It changes no game rule or price.

The full local and Drive scan reads 15,001 source files and records 833 run IDs. It writes
11,991 measurement rows, 279 criterion status rows, and 7,242 distinct measured version contexts.
The schema covers 97 rule fields and 110 workbook versions. The audit lists 100 source gaps
and conflicts, with no unreviewed source drift.

All four named pending runs keep null values. Void, incomplete, and conflicting rows also keep
null values. Measurement IDs are unique. The M1 host name does not resolve; remote-only data
remains a stated gap. The two NEW columns are blank. The report gives no invented prediction.

Three proposed runs pin the reviewed source. Each initial command submits one timing shard.
Later waves have at most five notebooks. No simulation, notebook, or remote job starts.

## Verification

- The full build command completes on the current source. A second full rebuild gives the same
  bytes for all five output files. The measurement file SHA256 is
  `378df8237a0dac09bd88788749b364530290de6b676c6cb34a6e16828baa1ec6`.
- Two CLI rebuilds of the same fixed fixture give the same bytes for all five output files.
- Parser tests also repeat the raw build. Report tests check repeated writes and evidence IDs.
- `npm run typecheck` passes. `npm run test:docs` passes all 74 tests.
- Strict `npm run balance:check -- --json` exits 1 for the 100 listed source gaps.
  Report mode exits 0 with the same findings. Mutation tests check added and changed dimensions.
- `VITEST_MAX_WORKERS=2 npm test` passes: 1,494 tests and 42 artwork checks; 13 tests skip.
  The default parallel run hits existing hook/deploy timeouts while other worktrees also test.
  The full suite passes with two workers.
- The diff against main has no game source, price, or main tracker change.

## Review

The review keeps historical contexts separate, preserves reported error limits, and removes
false claims about rules that now ship. The launch proposals use one first shard because the
launcher interprets `--first` as a suffix of the shard list. A test guards the wave limit.
The framework uses the existing dependencies. It does not fit one regression across mixed runs.

The tracked-file check rejects tracker line citations. The generator now cites their reviewed
headings. A regression assertion checks the generated queue source reference.

## Merge review (2026-10-10)

The owner: "examine those PRs and decide what to adopt and how to commit and/or merge." Decision: adopt the whole change (the typed model, the checks, the dataset with its size-allowlist entry, the documents), after a merge of main into the branch and the fixes below.

Checks on the merged tree (main 96c24e8 + this branch): `npm test` 109 files, 1,825 cases, exit 0 (the pins still match: `docs/MATRIX.md`, `docs/RULES.md` and `src/rules/rules.ts` have no commit since 7035b5e); the gate's history mode finds no secret; `npm run balance:check -- --report` lists the 100 recorded gaps with exit 0.

Independent review (a reader that did not write the diff; one lens on the schema and drift check finished, the dataset, math, documents and repository lenses were stopped at the owner's request). Five should-fix items, four fixed here:
1. Strict `balance:check` exited 1 on every snapshot, because each finding was an error, so its exit code could not signal drift. Fixed: drift and misfit codes are errors, the recorded gaps are warnings (`DRIFT_CODE` in `design.ts`); strict exit 0 today, 100 warnings, and exit 1 means a source changed.
2. Open: `auditDesign` does not read `KINGS`, `RULES_2017`, `RULES_2021`, `USES_RULE` or `setup.ts` `POOL`, so a change there passes the check. The acceptance line holds for the Rules interface, CHOICES, DEFAULT_RULES, POWERS_BALANCED and the C.1 and C.2 tables. Follow-up: pin those constants the way POWERS_BALANCED is pinned, one mutation test each.
3. The vitest cases on the live documents would turn `npm test`, and so every push, red at the next edit of `docs/RULES.md` or `docs/MATRIX.md`, with no printed hash to re-pin from. Fixed: those cases run with `KINGDOWN_BALANCE_DRIFT=1`; the drift finding prints the new sha256 and names `design.ts`; the day-to-day guard is `npm run balance:check` (FRAMEWORK.md, "Rebuild and check"). Follow-up: narrow the pins to the schema-bearing sections, then wire the strict check into CI.
4. `build-balance.ts` labelled any `--workbook` file as the 2026-10-09 workbook. Fixed: the label is the path that was read.
5. `schema.test.ts` asserted a finding code that no code emits (`DECLARED_TARGET_NOT_SHIPPED`). Fixed: the assertion is gone; `DECLARED_TARGETS` stays as the record of the target and has no consumer yet.

Notes for the next rebuild: the dataset comes from this Mac's `sim/out` and the Drive backup, so a rebuild on another machine gives another file; `status.json` is 1.9 MB against the gate's 2 MB limit, so a larger snapshot needs an allowlist entry.
