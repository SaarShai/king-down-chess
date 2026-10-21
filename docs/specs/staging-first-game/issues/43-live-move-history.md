# Keep the move history open when a turn arrives

Status: complete in staging. Parent: U07 and U09.

## Plan and acceptance

The shared board closes its sheets on a changed position. This also closes the read-only Moves sheet when a turn arrives from another host. The player loses the history they were reading.

1. Add a failing regression to the existing solo cross-host check. Open Moves before a remote turn. Require the sheet to stay open, show the accepted moves and keep its Close control focused.
2. Keep Moves open only for an update to the same playing game. Update its content in place. Preserve its scroll position. Other position-dependent sheets, game switches and result transitions must keep their existing close behavior.
3. Check a long move list at phone and desktop widths. Run the focused source checks and compiled web/embedded journeys. Reuse existing mechanics and archive evidence if the release hashes stay unchanged.
4. Publish the checked artifact to staging only. Verify one cross-host update with the actual Moves sheet open, and close only the disposable game used for that check.

No new timer, store, rules, art, service, schema or production change is needed. The second-account gate does not block this work.

## Evidence

The compiled web regression fails on `7995162b`: a remote turn closes Moves. The shared board now keeps it open only for the same playing game and replaces only its rows. The source checks use a 40-action history at 390 and 1280 px. They verify the new row, the original Close control and focus, scroll, and the close guards for Menu, another game and a result.

The first fix passes direct view routing, but the compiled web check catches lost Close focus during the computer reply. The shared write lock disables ordinary controls. A focused source regression reproduces that cause. Moves Close now uses the existing free-control marker; game commands keep their locks. The failed run is retained, and its unfinished embedded run is not counted as a pass.

Final source `b7a5c82c` passes four selected source tests, typecheck and 54 artwork checks. The compiled web journey passes in 47.6 seconds; the embedded HTTP journey passes in 261.9 seconds. Both verify the remote turn and computer reply with Moves open, then the existing result, rematch and finished-history journeys. The source tree stays clean throughout the final compiled run and release build.

The staging artifact check passes. Deployment `dpl_BUXmzAAJXU6R7ZU79csxwYGMCmCk` serves the staging alias. A normal-TLS read matches the checked index hash. The server, runtime and all eleven archived engines stay unchanged, so the accepted 112 mechanics executions carry forward.

Actual web and ChatGPT verification passes in both directions on disposable casual fairy game `1681b2c7-f909-867e-a4f6-cf3a5c80fc01`. ChatGPT sends b2–b3; the web sheet stays open, gains the move and the paladin reply, and keeps Close focused. The old unsubmitted a2–a3 web draft is discarded. Web then sends March's b3–b5 move; the open ChatGPT sheet gains it, the computer's Ice Wall on f7 and pawn d7–c6. Both hosts show the same five actions without Refresh or reopen.

The normal web Resign flow ends only that fixture. Both hosts show the same Casual resignation, and the result closes ChatGPT's open Moves sheet. The ten prior active game IDs match the baseline. Two connector cleanup attempts with the same command ID return connection failures; the working web flow completes cleanup after its active state is confirmed. No database deletion is used.

The docs pass 161 checks in thirteen files. The attached ChatGPT host still needs one initial Try again. Startup, second-account privacy, Codex interruption, physical-phone/network and operator gates stay open. No production change is made. The parent project stores receipts and screenshots at `evidence/staging-live-moves/verification.md`.

The implementation review confirms one shared board change, the existing poll and lock mechanism, and no new state, dependency or service. The shared runtime document records the rule and the command-lock check.
