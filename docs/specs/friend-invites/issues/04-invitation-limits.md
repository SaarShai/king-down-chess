# Enforce the two limits in transactions

Status: claimed
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

## Plan and checks

1. Add local migration fixtures and invitation tests. Record the failing cases.
2. Add state, atomic send, recipient checks and transport contracts for ticket 03.
3. Add shared account locks, counts and budgets for ticket 04.
4. Run real connection races, the full suite, doc checks and account/online browser checks.
5. Fetch and merge the source branch. Record checks and commits here.

Pass criteria: all acceptance checks above pass. Race tests use separate PostgreSQL connections.
Only the local disposable cluster receives the migration. No remote database or deploy runs.

## Evidence

- Ticket 03 service commit: `125bbe53`. Migration commit: `a253344b`.
- Before limits: 13 of 25 invitation cases fail. After limits and race barriers: the focused run passes 229 cases in 10 files.
- The real races cover two accepts at four games, join against rematch, random accept against friend accept, two named sends, two open sends, decline against accept and cancel against accept.
- Each race uses two separate PostgreSQL connections. A third connection holds an account lock until both writes wait.
- The first full run passes 5434 cases, fails 21 and skips 18. Contract fixtures need the new fields and route/tool counts. The next focused run passes 166 of 167 cases; the last stale permission code is fixed.
- Final full, doc and browser checks remain open. No remote database, push or deploy runs.
