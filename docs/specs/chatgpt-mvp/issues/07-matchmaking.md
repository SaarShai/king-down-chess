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

Round 2:
1. Prove expiry during the search lock and the game row lock. Use a fresh lobby cutoff and retry an expired candidate.
2. Check that cancel and expiry save no result and no rating change. Add rating assertions when ticket 08 reaches integration.
3. Check accept and find with arrangement and powers off. Save the first move and check the deadline.
4. Check activity from accept and commands. Compare the exact lobby reply at each count threshold.
5. Run the full tests, commit, merge the local integration tip, run the full tests again and push this branch.

Checks: each new test fails or proves the old test gap before the change. Use the ticket 07 test database and runtime role. Keep the page, results and ratings code out of scope.

First build:
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

Round 2 fixes the expiry wait. The lobby uses the query time. Find checks the candidate after the row lock and retries when it expires. Accept uses the same fresh time for its check and write.

- Both lock-wait tests fail with `NOT_ALLOWED` before the fix. Both pass after it.
- A temporary saved draw proves the no-result gap: 11 prior checks pass; the new saved-result check fails. The code is restored. Cancel and expiry save `aborted`, a null result, and an `abort` or `no_start` event.
- A temporary failure to start play leaves 12 checks passing and fails both new accept and find checks. The code is restored. Both paths start play, save the first move, let the opponent resume, and set the 3-day deadline.
- A temporary missing accept activity update leaves 13 checks passing and fails the count check. The code is restored. The exact reply checks activity from accept and a move, excludes duplicate and old activity, and hides the count below 10.
- The final focused `npm test` passes: 14 matchmaking checks; 50 of 50 document-art checks.
- Full `npm test` before the final merge passes: 140 files; 2,212 tests; 8 skip; 50 of 50 document-art checks.
- Checks use `kingdown_mvp07_test` on `127.0.0.1:55432`. Matchmaking uses its own database copy and the runtime role.
- `git diff --check` passes. This ticket changes no page. Page size and browser checks do not apply.

The local integration tip now has ticket 08. The final merge adds the saved-rating and empty-history checks before this branch goes out.
