# 01 Use the recorded player in Haste analysis

Status: resolved
Branch: staging/fix-haste-analysis
Base: origin/main, f8fcec0a
Source: release 3 audit, finding 5. The owner requests this fix.

## Fault

Haste can give White two actions in a row. Analysis ignores each action's
`by` field and infers the player from its index. The decision cost and the
largest favourable score change can then go to the wrong player. The mine
has a copy of the same code. Its capture map also infers the player.

## Plan

1. Add fixed records with the sequence `[white, white, black]`. Calculate
   the expected costs and score changes without the code under test.
   Run the tests on the unchanged source. Require a failure.
2. Use `by` when present. Infer the player only for old records. Make the
   mine import the shared metrics. Remove the copies.
3. Run the affected tests, full `npm test`, and `npm run test:docs` with
   the shared test lock. Record the results. Commit, push, and open a PR.

## Acceptance

- The new tests fail before the fix and pass after it.
- For `[white, white, black]`, lead values `[0, 1/2, 1/3]` give a largest
  favourable score change of `1/2`. Decision costs are
  `[1 + log2(4/3), log2(8/7)]` bits.
- Recorded players take precedence over both default and double-first-turn
  rules. Old records still use the rules when `by` is absent.
- The mine uses the same metric functions as the analyser. Its Haste
  capture map uses the recorded player.
- The shared metric module does not load game storage. The mine can load
  when game storage is unavailable, as its `--specs` command requires.
- All required checks pass. This change has no database or browser path.
- No deploy, sign-in, remote database, or animation bank change.

## Evidence

- Before the source change:
  `KINGDOWN_TEST_FILE=tools/mine.test.ts KINGDOWN_TEST_NAME='recorded Haste players|Haste capture map' npm test`
  fails with 11 failed cases and 8 skipped cases. The type checks pass.
- Under default rules, White's cost is `1.1926450779423958` bits. The
  expected cost is `1.4150374992788437` bits. The largest favourable score
  change is `0`; the expected value is `0.5`.
- Under double-first-turn rules, White's cost is `1` bit and the largest
  favourable score change is `1/6`. The recorded players require the same
  expected values as the default-rules case.
- Both copies fail the cases above. Both also fail when the first action
  has no score. The mine puts both test captures on rank 2 instead of rank
  7 from each capturing player's view.
- Before log: `/private/tmp/kingdown-fix-haste-analysis/before.log`.
- The fix uses `by ?? moverAt(...)`. The mine imports `leadMetrics` and
  `trajectory` from `src/sim/metrics.ts`; both copies are removed. The
  remaining player lookup in the capture map uses `by` too.
- The new tests assert calculated values. A function identity check
  replaces the old copy-equality tests. The existing simulation tests
  retain coverage for old records without `by`.
- Final affected check:
  `KINGDOWN_TEST_FILE='{src/sim/sim.test.ts,tools/mine.test.ts}' npm test`:
  48 tests in two files and 67 art tests pass. The storage-availability
  case passes. All 11 original fault cases pass.
- Full `npm test`: 5,373 tests pass, 342 skip; 270 files pass and 17 skip.
  All 67 art tests pass. Both type checks pass. Exit 0.
- `npm run test:docs`: 183 tests in 16 files pass. Exit 0.
- One outer `bash tools/test-lock.sh` holds the shared lock across the
  final affected check, full suite, and doc checks. The full suite has no
  file, name, or skip filter. Optional database URLs are removed. This
  change has no database or browser path, so no extra check is required.
- Final logs: `/private/tmp/kingdown-fix-haste-analysis/affected-final.log`,
  `/private/tmp/kingdown-fix-haste-analysis/full.log`, and
  `/private/tmp/kingdown-fix-haste-analysis/docs.log`.

## Review

An independent review is required before merge. This task opens a PR and
does not merge it.
