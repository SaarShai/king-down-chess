# Remove unused game alerts

Status: resolved

## Plan

- Trace all notification and outbox readers.
- Remove game alert writes and their pass-through data. Keep account notices and old-row cleanup.
- Check Daily turns, game endings, account notices, and rollback. Run the affected tests, full suite, and doc checks.

## Reader trace

`rg` over source, SQL, scripts and tests found no delivery reader for `turn` or `game_finished` outbox rows. The account notice reader selects only `moderation` and `appeal`. The outbox cleanup deletes old rows. Test and check scripts inspect rows but do not deliver them. The old outbox endpoint returns 404.

## Checks

- Before the change, the check for game alert producers found four write sites and failed. After the change, it finds none.
- The first local database run passed 115 tests and failed one because the shared test database had no schema. The test database was then bootstrapped for the rerun.
- The next local database run failed when the disk was full. A rerun passed all 116 tests in the six affected database files.
- The full suite found an old website API assertion for a turn event. The corrected API file passed all 16 tests.
- Full `npm test` with local PostgreSQL: 287 files passed, 5,702 tests passed, 8 skipped. The separate Node checks passed all 67 tests.
- `npm run test:docs`: 16 files and 183 tests passed. Both commands held the shared test lock.
- The privacy test still checks the policy for old turn alerts, which remain stored until account deletion.

## Review

Independent review remains for the PR before merge.
