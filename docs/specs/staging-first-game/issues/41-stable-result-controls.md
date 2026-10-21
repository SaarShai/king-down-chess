# Keep result controls stable during background reads

Status: complete in staging. Parent: U07 and U09.

## Plan and acceptance

The shared result screen replaces its controls on each background read. Ticket 40 makes these reads run during solo results too. Check whether an unchanged read removes keyboard focus before changing the code.

1. Add a compiled regression to the existing solo cross-host journey. Focus a result control, wait for a background read, and require that the same control keeps focus. Check See the board and return to the result too.
2. If the check fails, keep unchanged result content mounted in the shared screen. Real changes to rematch choices, recovery locks, results and player blocking must still update. Preserve navigation and teardown guards.
3. Run focused source checks and the compiled web and embedded journeys. Reuse their existing rematch, error and recovery checks. Publish the checked artifact to staging only and check the result controls in the actual hosts where access permits.
4. Reuse the accepted mechanics and archive evidence if their bytes stay unchanged. Record the exact source, checks, deployment and remaining gates.

The second-account gate does not block this work. No gameplay, artwork, account schema or production change is in scope.

## Evidence

The new compiled web check fails on `279368d4`: an unchanged result poll removes the focused Play again button. The check waits for the actual HTTP read and then checks the original DOM control. The patch keeps result content mounted until its visible data changes. It reapplies the result's read/queue lock without replacing buttons. New game reads current setup data when clicked.

Focused source passes 253 tests in nine files, typecheck and 54 art checks. Docs pass 161 checks in thirteen files. Web passes in 50.263 seconds on `fefa2524`; final embedded passes in 271.7 seconds on `a56fafa2`. The source-diff guard reuses web after only embedded-test and ticket edits. No application change follows the source pass.

The first patched web run passes the result-button check, then fails the board check because the test targets a menu hidden by the result layout. The corrected test focuses the visible board and asserts that focus is set before it starts the poll. This is a fixture correction; no second product defect is inferred from that failure.

On `fefa2524`, web passes in 50.3 seconds and embedded passes the new focus and solo-sync checks. A new recovery assertion then fails: it wrongly treats a retained result-details request as a stale game read. The captured state has pending kingdown_get, which intentionally permits a queued rematch. The check now preserves that contract and separately injects three failed background reads to require the stale-game lock and its recovery. Application source is unchanged.

The exact artifact passes. Staging preview `dpl_6Djs1XyNKb8gKPnG4SCyJmbUMRYg` serves the staging alias, with an index hash that matches the checked output. Server, runtime and all eleven engine archives are unchanged. The accepted 112 mechanics executions remain valid.

Actual ChatGPT finishes disposable game `19539637-05fe-82b9-a99a-ab42653e9664`; the open web game receives its result without Refresh. Play again keeps focus while visible for 24.133 seconds in ChatGPT and 27.981 seconds on web. The finished board keeps focus for 12.824 and 16.154 seconds respectively. Both return to the result. These live observations complement the compiled checks that wait for a completed poll and test the original DOM control. Both disposable games are finished; the original ten active game IDs remain. Full receipts and screenshots are in the parent project at `evidence/staging-result-controls/verification.md`.

The shared content key follows the existing board update pattern. No dependency, service or new state store is added. A review of its inputs covers result text, art, outcome, rematch and block changes, fresh New game choices, read/queue locks, navigation and teardown.

The attached ChatGPT host still requires one initial Try again. That separate first-open failure, second-account privacy, Codex interruption, physical-phone/network and operator gates remain open. Production is unchanged.
