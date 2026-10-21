# Keep result controls stable during background reads

Status: in progress. Parent: U07 and U09.

## Plan and acceptance

The shared result screen replaces its controls on each background read. Ticket 40 makes these reads run during solo results too. Check whether an unchanged read removes keyboard focus before changing the code.

1. Add a compiled regression to the existing solo cross-host journey. Focus a result control, wait for a background read, and require that the same control keeps focus. Check See the board and return to the result too.
2. If the check fails, keep unchanged result content mounted in the shared screen. Real changes to rematch choices, recovery locks, results and player blocking must still update. Preserve navigation and teardown guards.
3. Run focused source checks and the compiled web and embedded journeys. Reuse their existing rematch, error and recovery checks. Publish the checked artifact to staging only and check the result controls in the actual hosts where access permits.
4. Reuse the accepted mechanics and archive evidence if their bytes stay unchanged. Record the exact source, checks, deployment and remaining gates.

The second-account gate does not block this work. No gameplay, artwork, account schema or production change is in scope.

## Evidence

The new compiled web check fails on `279368d4`: an unchanged result poll removes the focused Play again button. The check waits for the actual HTTP read and then checks the original DOM control. The patch keeps result content mounted until its visible data changes. It reapplies the result's read/queue lock without replacing buttons. New game reads current setup data when clicked.

Focused source, compiled clients and staging acceptance are pending.
