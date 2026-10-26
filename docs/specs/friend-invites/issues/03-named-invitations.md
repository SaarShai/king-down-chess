# Add named invitation state and service paths

Status: needs-info
Type: task
Blocked by: Owner approval; migration approval is a separate step
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
