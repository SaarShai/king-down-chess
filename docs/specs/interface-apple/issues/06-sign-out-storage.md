# Keep sign-out safe through errors and full storage

Status: ready-for-human

## Scope

Repair the four faults from the two reviews of PR 361. Keep all prior repairs. Leave changes uncommitted for the lead.

The account screen lets the bound client remove credentials. On an error, it shows a short line and keeps the current session. If the client module cannot load, the screen keeps the signed-in state and lets the player retry. It does not report a successful sign-out.

Under the auth lock, removal clears the matched credentials and all stored flow verifier slots before it writes the closure record. The store scan uses Web Storage length and key. It does not trust the flow index. A flow that starts later stays.

Each closed session has a 24-hour expiry. Each closure write removes expired entries. No count limit drops live entries. If the closure write still fails after removal frees space, the client keeps credentials removed, sends the sign-out event and revokes the token. The event and revoke stay; the stored guard for that closure can be absent.

## Review cases

The source tests keep both full-store cases, the actual click-handler case for the same account and another account, and the two-client flow-index race. The flow case checks that both old callbacks fail. The live-session refresh control and normal draft-save controls add coverage. The two draft cases cover both old routes, ordered saves, a stable generation through refresh, and restore.

## Checks

The first focused run and the scratch baseline each pass 107 tests in four files. The nine mutation runs each fail at runtime assertions. Their union covers all 11 new source tests. Each run keeps call signatures and passes compilation. The scratch runner restores the repaired sources when it ends.

The required final sequence runs focused tests, the full suite with the local test database, docs tests, type checks, the launch build and the next-save browser check. The account browser cases use local fixtures at all three required sizes. The external report holds the final results, logs, counts and limits. The lead owns the commit and independent review.
