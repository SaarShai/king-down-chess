# 07 · Matchmaking: open games, accept, find

Status: resolved
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
4. Run `npm test` with the test database. Confirm that the commit command ends and the checkout is clean before the merge. Merge the integration tip, run the checks again and push the branch.

Checks: one accept wins; the oldest eligible game matches; expiry and cancel give no result; blocks hide games; counts below 10 stay hidden. Each test fails before its service change.

## Interface

- `GameService` and `PluginService` expose `lobby(actor)`, `accept(actor, gameId)`, `find(actor, options, colour)` and `cancel(actor, gameId)`.
- Lobby returns `{ games, active_count? }`. It lists up to 100 open games, oldest first. Each entry gives `game_id`, `options`, the open seat's `colour`, `creator: { handle, icon }` and `created_at`. It gives no account ID.
- Accept, find and cancel return `View`. Accept reuses the setup step. A game with no seat choice starts at once. A repeated accept by its winner or a repeated cancel by its creator keeps the revision.
- Random-game create, find and accept require a handle and return `HANDLE_NEEDED` when it is absent. The lobby preview stays available.
- `active_count` counts distinct players whose game-seat `last_seen_at` is within 10 minutes. Create, join and commands supply those times. The lobby stays read-only. Counts below 10 stay absent.
- Migration 0011 adds indexes for the lobby, expiry and recent activity. The current runtime grants already cover each read and write.

## Result

The lobby lists open games and hides own, blocked and expired games. Accept takes the game row lock and starts setup. Find takes the oldest eligible game or creates one with the caller's features. A transaction lock prevents two finds from making two games on an empty lobby. Cancel and the 24-hour sweep end the game with no result. Random matchmaking requires a handle. The active count appears only at 10 or more.

Checks use `kingdown_mvp07_test` on `127.0.0.1:55432`. The matchmaking tests use their own database copy and the runtime role. Each role change holds the shared role lock.

- Nine matchmaking database checks pass. The accept race uses 20 separate clients: one wins, 19 are refused, and the winner's retry keeps one join. Other checks cover blocks in both directions, oldest-first find, two finds on an empty lobby, cancel, two sweeps at 24 hours, handle errors, and a read-only count with duplicate and old activity.
- `npm run plugin:db:init-test` passes. Migration 0011 runs twice.
- Full `npm test` before the merge: 140 files pass; 2,206 tests pass; 8 skip. The document-art checks pass 50 of 50.
- The first full check finds one setup fixture with no handle. The fixture now gives its players preset handles. The full check then passes.
- `git diff --check` passes.
- This ticket changes no page. Page size and browser checks do not apply.
- Integration tip `ba1d5a5d` merges without conflict and brings the ticket 06 review fixes. The full `npm test` after the merge passes: 140 files; 2,207 tests; 8 skip; 50 of 50 document-art checks.
- One earlier full check reaches the 5-second limit in the unchanged Strong-computer test. Its 18 checks pass alone. The final full check above passes.

Open items: none in this ticket. Ticket 10 adds the tool bindings.
