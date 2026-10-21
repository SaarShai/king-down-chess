# Keep Find opponent results current

Status: in progress. Parent: U07; preserves U10 policy separation.

## Plan and acceptance

The shared lobby checks only the current screen after its two reads. If a player leaves and returns while the first read waits, that older response can replace a newer list and the cached own games. A late error can also replace current feedback. Reuse the Profile screen's small request-generation pattern rather than adding a request layer.

1. Reproduce a late earlier list and inbox after a second visit has completed. Check both the visible opponents and the own-game shortcut. Also cover an older failure and disposal.
2. Invalidate reads when leaving the lobby and when the runtime stops. Only the latest current request may change the list, cached inbox or status. Preserve handle continuation and the fixed Ranked/Casual policy.
3. Run focused lobby and shared navigation/lifecycle checks. Extend the existing compiled journey with the delayed-response case on web and embedded clients. Reuse the accepted mechanics and archive evidence.
4. Build and deploy only the isolated staging preview. Check exact artifact/source, unchanged engine/archive bytes and actual web/connector reads. Record any unavailable actual-host control separately from compiled evidence.

No rule, artwork, matching policy, database schema, account requirement or production change is part of this ticket.

## Source proof

The old implementation fails four new cases: late Casual and Ranked lists, a late error, and a reply after disposal. The repaired implementation passes all 137 selected lobby, app, poll and lifecycle cases, typecheck and the standard 54 art checks. A separate case covers leaving for handle creation without another list read. Existing policy, own-game reuse and accept-after-handle tests remain intact.

The change adds a request counter and disposal guard to the existing lobby module. Leaving the screen invalidates its read. A stale success cannot replace opponents or cached own games; a stale error cannot replace the current status. No command, matching query or permission changes. The existing compiled web and embedded journeys now hold a real list response, cancel the offered game, return to Find, and check that the older reply cannot restore the cancelled offer.
