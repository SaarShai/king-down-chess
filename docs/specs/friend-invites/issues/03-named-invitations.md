# Add named invitation state and service paths

Status: claimed
Type: task
Blocked by: none; migration run is approved with the spec
Spec: [Online friend invitations](../README.md)

## Scope

Own `0022_friend_invites.sql`, invitation state in `src/match/protocol.ts`, `src/match/store.ts` and `src/match/service.ts`. Add atomic friend create-and-invite, recipient checks, decline and cancel. Update web API and account deletion paths. Ticket 04 follows this ticket in the same files. Do not release either ticket alone.

## Acceptance checks

- The recipient is a user ID. Only that recipient accepts a named invitation.
- Create and invite commit together. A refused write leaves no waiting game. Same-command retries create no second game.
- Decline, cancellation, use and expiry have the state rules in the spec. Permission checks use the correct direction.
- Rotation keeps recipient and original expiry. Old links stop working. Reads do not rotate.
- Old open links work until their original expiry. A deleted recipient never makes an open link.
- The migration is reviewed. A local database fixture passes before any requested staging run.

## Tests to add

- Add service and real database cases for send, wrong recipient, retry, decline/accept race, cancel/accept race and expiry equality.
- Add migration fixtures for accepted users whose account is deleted, unused old invites and duplicate detection.
- Add block, challenge setting, rename and deletion cases. Add web API schema and privacy cases.

## Plan and checks

1. Add local migration fixtures and invitation tests. Record the failing cases.
2. Add state, atomic send, recipient checks and transport contracts for ticket 03.
3. Add shared account locks, counts and budgets for ticket 04.
4. Run real connection races, the full suite, doc checks and account/online browser checks.
5. Fetch and merge the source branch. Record checks and commits here.

Pass criteria: all acceptance checks above pass. Race tests use separate PostgreSQL connections.
Only the local disposable cluster receives the migration. No remote database or deploy runs.

## Evidence

- Migration commit: `a253344b`. The local bootstrap runs `0001` through `0022` twice. It passes.
- `friend-invites.db.test.ts`: 12 state cases pass before the limit change. The 13 remaining cases fail on missing limits or the small index fixture.
- State cases cover atomic send and retry, recipient privacy, rotation, settings and blocks, rename, deletion, paging, both terminal races, expiry and migration fixtures.
- The migration fixture checks a deleted accepted user, an unused old link and duplicate detection. Row security stays on.
- Full checks and final review remain open until ticket 04 is complete.
