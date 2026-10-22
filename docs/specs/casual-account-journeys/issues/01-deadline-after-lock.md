# Check deadlines after the game lock

Type: task
Status: resolved

## Plan

1. Hold a real PostgreSQL game-row lock while a timely turn or claim waits. Advance the service clock past the stored first-turn or move deadline before releasing the lock.
2. Keep receipt resolution first. Sample fresh eligibility time after the lock and permission reads for an unseen command. Use it for the existing end/log/deadline paths.
3. Prove that a late turn changes no board or move uses, that existing claim/no-start/timeout behavior stays, and that accepted retries still resolve without another effect.

## Scope

This is one U07 correction. It does not change the three-day policy, first-turn cancellation, claim eligibility, lazy expiry, sweep triggers, matching, rating policy or engine rules. The blueprint's unresolved operator/claim wording remains open. U05 release checks remain a separate gate.

## Verification

- Four real-lock cases: first-turn and later-move deadlines, each with a waiting player turn or waiting opponent claim.
- Observe PostgreSQL blocking before advancing only `Date`; use no timed sleep. Confirm one expiry/claim event, unchanged engine save/snapshot/turn counts, and no extra turn notification.
- Retry an accepted command after terminal status and a later clock time; reuse with changed input must remain `COMMAND_CONFLICT`. Retry an accepted claim once without another end event.
- Run focused tests through `npm test` only after the main task gives the shared test slot.

## Evidence

The command previously sampled its final eligibility time before engine work and the transaction's row lock. An unseen turn could therefore commit after its stored deadline, while a claim that became eligible during the wait was rejected. The service now samples fresh time after the locked receipt check and awaited permission reads, then uses it consistently for eligibility, the event, result and any next deadline. Accepted receipts still resolve before this new eligibility check, as required by the blueprint's durable-command contract.

At base `25d7bd8775ab885b858e997361eb60de14c41a04`, all four new regression cases fail and the 32 existing service tests pass. With the fix, `KINGDOWN_TEST_FILE='src/match/{service,service.db}.test.ts' npm test` against the disposable loopback test database passes all 36 service tests, typecheck and 54 artwork checks. Logs: `/tmp/kingdown-u07-deadline-red.log` and `/tmp/kingdown-u07-deadline-green.log`. The test observes an actual PostgreSQL row-lock wait and advances only the service clock; it does not wait for a real deadline to pass.

The main task owns integration, staging and browser checks. No build, browser check or deployment was run for this slice.
