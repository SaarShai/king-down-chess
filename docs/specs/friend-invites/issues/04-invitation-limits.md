# Enforce the two limits in transactions

Status: resolved
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

## Answer

All six acceptance checks pass. This ticket ships with ticket 03.

- `pairCount` counts both human user IDs in all setup and playing multiplayer games. It includes rematches and reverse games. At five, every new seat write refuses. Old excess games remain.
- `pendingCount` counts only open, unexpired invitations on waiting games. Named counts are directional. Each terminal action frees only its own slot.
- Open links have a sender-wide cap of two. Old excess links remain usable and prevent the next new send.
- Create, named and open join, random acceptance, Find and rematch use the same sorted account locks before row locks. They read counts after the locks. The engine builds outside those locks.
- Find filters capped pairs in SQL and rechecks after the locks. Its candidate pass is bounded. A refused accept leaves the invitation open. A successful receipt returns before the new cap check.
- Both hosts use the same limiter and notices. Lookup and invitation writes share 60 requests per actor per minute. The existing short-code and create/rematch budgets remain.

The files are `src/match/{protocol,store,service,invite-notices}.ts`, `src/api/http.ts`, `src/plugin/{service,server}.ts` and the account permission paths. All three limit errors use HTTP 409. Authorized results carry the actual count and current handle where a pair exists. Unauthorized responses carry neither field.

## Red and green checks

Before the limit change, 13 of 25 invitation cases fail. After the limits and race barriers, the focused run passes 229 cases in 10 files. All 34 current invitation cases pass.
The read race, stale cancellation, old open receipt, same-millisecond cursor and exact-expiry checks each fail before their correction and pass after it.
The exact-expiry check has 1 failure and 33 passes before `bab99388`. The full tool privacy guard catches model-visible revisions before `de76f357`. The focused failure check then passes 49 cases, with 161 cases outside its name filter, plus 67 artwork cases.

## Test names and scope

`src/match/friend-invites.db.test.ts` has 34 cases. These named cases cover the required races:

- `races two accepts at four games and returns the winner receipt at five`
- `races a friend join against rematch acceptance at four games`
- `races random acceptance against friend acceptance at four games`
- `races two named sends with one pending slot`
- `races two open-link sends with one slot`
- `decline races accept: one terminal action wins on separate connections`
- `cancel races accept: one terminal action wins on separate connections`
- `reads complete invitation metadata while another connection rotates its code`

The first seven use held account locks and two waiting connections. The read race holds the metadata read while a second connection rotates the code. It uses real SQL reads and writes.

Other cases check `uses database expiry at equality and frees the slot before a sweep`, `checks rematch offer and accept, then returns the receipt at the pair cap`, `excludes waiting, solo and terminal games from the pair count`, `uses pending and pair indexes without a time predicate in an index`, reverse sends, old excess rows and each slot release.

`src/api/http.db.test.ts` adds `shares the last friend request slot across HTTP lookup and MCP send`. The HTTP schema tests check all three 409 errors. `src/plugin/server.test.ts` checks tool fields, private metadata and limit errors. `src/match/invite-notices.test.ts` checks every shared notice.

The pending-slot cases also cover `decline frees only its own pending slot`, `cancel frees only its own pending slot` and `accept frees only its own pending slot`.
The receipt cases include `returns a legacy open creation receipt before the new sender limit`.
The cursor case uses timestamps one microsecond apart. Rotation preserves the original database expiry to one microsecond.
The count-plan case checks the named, open-link and pair indexes. No partial index has a time function. The pair plan uses `game_players_pair` and game keys.

There are nine real database race cases: seven terminal or slot writes, one read against code rotation, and one HTTP lookup against an MCP send. The seven write races assert distinct PostgreSQL backend PIDs. A third connection holds an account lock until both writes wait.

## Final checks and commits

The [ticket 03 check record](03-named-invitations.md#final-checks) has the full commands, local URL and logs.

- Local bootstrap: migrations `0001` through `0022` pass and repeat.
- Invitation file: 34 passes. Artwork: 67 passes. Both type checks pass.
- Final full `npm test`: 5482 passes, 9 skips, 286 files; then 67 artwork passes. The run holds all three shared browser slots and uses Chrome.
- The Chromium-only `F-032` check: 2 passes, 43 cases outside the name filter; then 67 artwork passes.
- `npm run test:docs`: 180 passes in 15 files.
- Registered account and online-play browser checks: 10 of 10 pass on Chrome. Each registered name counts as one check.

The final full run has eight existing skips and one Chrome skip for the Chromium-only case. The separate Chromium check covers that case. The unchanged offline-poll case passes alone after its earlier full-run failure. No full-run failure remains.

Limits: `2f629d34`. Tests: `bf39ed29`. State and contracts: `125bbe53`. Migration: `a253344b`.
Further fixes: `f6fd73df`, `8634f97c`, `7c3b4aa3`, `b51c1967`, `f35b8b49`, `bab99388`, `de76f357`.
Browser schema and fixture commits: `a51ec280`, `b5f9cc74`, `2ebf1cad`, `84ddfcaf`, `408e061f`, `1d4182c0`, `95050195`.
Source merges: `a598f8c6`, `d42e15de`. The final source fetch and merge are up to date at `f306d452`. No conflict occurs.

No acceptance check remains open. No remote database, push or deploy runs. The local database cluster stays up.
