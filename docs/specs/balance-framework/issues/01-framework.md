# Build the balance and rules framework

Type: task
Status: done

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

This section records the first build. [Ticket 02](02-close-evidence.md) adds the verified M1
evidence and closes the schema gaps. [Ticket 03](03-resolve-source-conflicts.md) applies the
owner's final source corrections. Those tickets hold the current counts and checks.

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
