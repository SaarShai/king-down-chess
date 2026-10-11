# 07 · Matchmaking: open games, accept, find

Status: claimed
Type: AFK
Size: M
Blocked by: 06

## Scope

- `lobby(actor)`: open `random` games of other players, oldest first, with their features, the creator's handle and picture; never the actor's own and never a blocked player's.
- `accept(actor, game)`: takes the open seat under a row lock; exactly one of two racers wins; the game goes to `setup`.
- `find(actor, options, colour)`: accepts the oldest open game, or creates one with the actor's options.
- `cancel(actor, game)`: the creator ends a waiting game with no result.
- Expiry: the sweep ends an open game after 24 hours with no result.
- A count of players active in the last 10 minutes, returned only when it is 10 or more (spec Q4).
- An actor who must pick a handle first gets a clear error code (`HANDLE_NEEDED`), so the page can ask for it.

## Acceptance

- Database tests: 20 parallel accepts on one game give one winner; find on an empty lobby creates; expiry after 24 hours; blocks respected; cancel.
- `npm test` with the test database passes.

## Notes

- Research part 01 §3.4; explorer note B §5 item 1.

## Plan

1. Test the lobby through the plugin service on a test database with the runtime role. Add the list and its public types.
2. Test accept, find and cancel. Use 20 separate database clients for the accept race. Reuse the setup step and row lock.
3. Test the 24-hour expiry, blocks, handle errors and the 10-minute active count. Add migration 0011 and its checks.
4. Run `npm test` with the test database. Merge the integration tip, run the checks again and push the branch.

Checks: one accept wins; the oldest eligible game matches; expiry and cancel give no result; blocks hide games; counts below 10 stay hidden. Each test fails before its service change.
