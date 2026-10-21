# Ranked service boundary

Status: resolved
Type: task

The owner approves the first ranked family in the outer ranked-policy proposal. Ticket 30 owns integration.

## Plan and checks

1. Store one fixed policy on each new game. Preserve legacy rows and results.
2. Canonicalize ranked starts before the draw. Separate automatic matching and deliberate seat acceptance.
3. Gate the existing result transaction by policy. Show the policy in public game lists and history.
4. Check schema boundaries, retries, matching, rating results, SQL migration and type checks.

## Recovery gate

The migration defaults to `legacy` for old rows and old server inserts. A recovery server must carry the policy-aware start and result code. A server that can rate a new Casual result is not a valid recovery target. Disable match writes until a tested policy-aware forward recovery is ready. Ticket 30 checks the compiled recovery writer against a Casual finish.

## Evidence

- `npm run typecheck` passes.
- `KINGDOWN_TEST_FILE='src/match/{service*,setup*,results*,ranked-policy*,matchmaking*,badges*}.test.ts' npm test` passes 139 selected tests in 9 files against the disposable loopback database. The old schema upgrade retains the exact state and snapshot.
- The migration-order and web-account-access selection passes 33 tests with matchmaking. The bootstrap applies every migration twice.
- After the last fixture change, `src/match/{results.db,ranked-policy.db}.test.ts` passes 21 tests. The new policy cases cover canonical setup, forged setup rejection, matching separation, deliberate acceptance, old receipts, simultaneous cross-surface finish retries, Casual outcomes, ranked ratings and Casual rematches.
- Each selected test command also passes the 54 shared artwork checks. This is not a full-suite pass.

No live database or deployed server changes. Ticket 30 owns the transport, UI, recovery proof and independent review.
