# Keep the move history open when a turn arrives

Status: in progress. Parent: U07 and U09.

## Plan and acceptance

The shared board closes its sheets on a changed position. This also closes the read-only Moves sheet when a turn arrives from another host. The player loses the history they were reading.

1. Add a failing regression to the existing solo cross-host check. Open Moves before a remote turn. Require the sheet to stay open, show the accepted moves and keep its Close control focused.
2. Keep Moves open only for an update to the same playing game. Update its content in place. Preserve its scroll position. Other position-dependent sheets, game switches and result transitions must keep their existing close behavior.
3. Check a long move list at phone and desktop widths. Run the focused source checks and compiled web/embedded journeys. Reuse existing mechanics and archive evidence if the release hashes stay unchanged.
4. Publish the checked artifact to staging only. Verify one cross-host update with the actual Moves sheet open, and close only the disposable game used for that check.

No new timer, store, rules, art, service, schema or production change is needed. The second-account gate does not block this work.
