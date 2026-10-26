# Enforce the two limits in transactions

Status: ready-for-agent
Type: task
Blocked by: 03
Spec: [Online friend invitations](../README.md)

## Scope

Own the shared count and lock rules in the match service and store. Apply them to named send, named or open acceptance, random acceptance, Find and rematch. Add the sender-wide open-link cap and typed errors. Use the existing rate limiter for lookup and invitation writes.

## Acceptance checks

- Four paired games permit one more; five refuse another. Count setup and playing games of all multiplayer kinds.
- Two open named invites refuse a third in that direction. Closed and expired invites free one slot.
- Two open links refuse a third. Old excess rows remain valid but prevent new sends.
- All seat writes use the same account-lock order. Find skips a capped pair without a loop.
- A failed accept leaves its invitation open. A successful retry returns its receipt at the cap.
- Both hosts enforce the same per-actor rate budgets and return the exact notices.

## Tests to add

- Use separate database connections to race two accepts at four games, a join against rematch, and random accept against friend accept.
- Race two sends with one pending slot; race two open-link sends with one slot. Assert exactly one success.
- Cover reverse sends, setup games, rematches, old excess counts, decline, cancellation and expiry before sweep.
- Check all notices and count-query plans. Run existing matchmaking and rematch cases.
