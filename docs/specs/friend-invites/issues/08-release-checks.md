# Check the full friend flow

Status: needs-info
Type: task
Blocked by: 01 through 07; owner approval
Spec: [Online friend invitations](../README.md)

## Scope

Own the final check matrix and evidence in this ticket. Add missing tests only where the earlier tickets do not cover a boundary. Do not deploy or run a remote migration without the owner's word.

## Acceptance checks

- Run the full required source checks through `npm test` and record actual case counts.
- Run `npm run test:docs`. Run the relevant named checks through `npm run check:browser`.
- Record real PostgreSQL race results, web and app parity, old save and old invite evidence. A mock is not database proof.
- Compare affected product screens with the approved samples at 375×812, 1280×800 and picker 320×568.
- Record an independent review before the pull request reaches main. No code, data or visual approval is inferred from a test pass.

## Tests to add

- Use the new race and permission cases from tickets 03 and 04.
- Run the complete invitation, account, matchmaking, rematch and cross-host journeys.
- Check keyboard focus, long handles, zoom, offline retry, empty lists, limits and stale actions.
