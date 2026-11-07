# Show Join when a friend opens the invite link

Status: resolved
Type: task

## Fault and scope

A friend opens the invite link (`/j#<key>`) on the website. The page reads the preview (200), but it stays on "Open the invite link that your friend sent." It shows no Join control. The fault occurs 3 of 3 times.

Cause: the start-up mount shows the join screen while the preview read is in flight. The browser host's `route('join')` then counts as a new route. It increments the route generation, so `publish()` drops the preview reply. It also pushes `/j`, which removes the key from the address.

## Plan

1. In `createBrowserRuntime().route`, keep the current address and the route generation when the join screen is already the current route.
2. Add a unit test: a held preview survives `route('join')`, and the key stays in the address.
3. In the `web-game` browser check, a second signed-in seat opens the invite link, sees Join, clicks it, and arrives at the game. Before, seat 1 joined through the server tool only.

## Acceptance

- The link shows the preview and the Join control. Join opens the game for both seats.
- Back and another invitation still drop an old preview (the existing tests).

## Evidence

- Local online server from this branch: before the change, the preview returns 200 and the page shows no Join. After the change, Join shows, the redeem returns 200, and both seats open `/g/<id>`.
- `src/online/runtime.test.ts` passes with the new test.
- `npm run check:browser web-game` passes with the new link step.

A third Start game with two friend games waiting gives no link. This is the server limit `OPEN_INVITE_LIMIT` (two open link invitations). The page shows "You have 2 open link invitations. Cancel one or wait for it to end." This is not a fault.
