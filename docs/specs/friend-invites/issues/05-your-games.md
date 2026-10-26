# Show incoming and outgoing invitations

Status: ready-for-agent
Type: task
Blocked by: 03, 04
Spec: [Online friend invitations](../README.md)

## Scope

Own shared invitation rows in `src/account-game/` and the existing friend screen. Extend the list response without placing an unaccepted recipient in a player seat. Add Accept, Decline, Share and Cancel invitation.

## Acceptance checks

- An offline recipient sees the invitation on the next list read.
- Rows show current handles, options and expiry. Incoming rows have Accept and Decline. Outgoing rows have Share and Cancel invitation.
- More game rows cannot hide invitations. Row keys stay separate from seated games.
- A five-game refusal keeps the invitation and gives View your games. Stale or terminal actions show the current state.
- Focus, live status, repeated clicks, scroll and long handles work at the sample sizes.

## Tests to add

- Add games-list and hall cases for both directions, pagination and terminal results.
- Add queue and remount cases for stale reads and lost responses.
- Add a fake-transport browser journey for accept, decline, cancel and each limit.
