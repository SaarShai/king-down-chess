# Retry an accepted winning turn

Type: task
Status: resolved

## Plan and scope

Extend the existing real-PostgreSQL checkmate/result fixture. Accept its final checkmating turn, then retry that exact command through both service instances after terminal status. Check the original result is returned, the accepted command remains a single receipt, and result/rating effects stay unchanged. Reusing the ID with a different turn must return `COMMAND_CONFLICT`.

This is bounded U07 evidence for the existing receipt-first contract. It adds no product behavior or engine rules and does not include quota, rematch or browser checks. U05 remains a separate release gate.

## Verification

- Checkmate is saved once at revision 5 after four player turns.
- Two service instances return the same finished view for the accepted command.
- One winning-turn receipt, four turn events, one finished-result outbox event and exactly two rating-history rows remain unchanged across retries and a conflicting payload.
- Stored player ratings stay unchanged, and both players' totals show exactly one completed game.
- Run the focused result/service tests through the shared `npm test` lock after the main task gives a slot.

## Evidence

At base `b48ca7ccdb9d1fb6bdb780ea13921b304bcfac7a`, the existing product behavior satisfies this contract. The retained Fool's Mate command succeeds again through both service instances after terminal status. The response stays identical apart from the refreshed server clock, while a changed turn with that ID returns `COMMAND_CONFLICT`. Its single receipt, four turn events, one finished-result event, two rating-history rows and stored player ratings remain unchanged. Both players have one completed game in their totals.

`KINGDOWN_TEST_FILE='src/match/{results,results.db}.test.ts' npm test` against the disposable loopback database passes all 18 result DB tests, typecheck and 54 artwork checks. Log: `/tmp/kingdown-u07-winning-turn.log`. No product edit, build, browser check or deployment was needed. The main task owns integration and any staging/browser checks; U05 remains a separate gate.
