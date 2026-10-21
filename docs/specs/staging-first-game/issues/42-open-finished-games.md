# Open finished games from Profile

Status: complete in staging. Parent: U07.

## Plan and acceptance

Profile shows finished games as inert rows. Players cannot select a result to inspect its board. The existing result screen and authorized game selection already provide the required data and controls.

1. Make each finished row a keyboard-accessible button. Keep the existing details, art, list layout and paging.
2. Select the exact finished game through the existing command queue. Keep its result visible even when it already has a rematch. Provide Open rematch for that existing game; do not create another game. Keep automatic continuation when a rematch arrives during live result watching.
3. Extend the existing compiled solo journey in both clients. Select history with the keyboard, inspect its board and moves, preserve its result through background reads, and explicitly open its existing rematch. Check that the saved game and Profile totals do not change. Reuse navigation, retry and teardown checks.
4. Run focused source and compiled checks, then publish the checked artifact to staging. Inspect the same finished game in actual web and ChatGPT when access permits. Preserve active games and reuse unchanged mechanics and archive evidence.

No gameplay, artwork, schema, server or production change is in scope. The second-account gate does not block this work.

## Evidence

Focused source passes 253 tests in nine files, typecheck and 54 art checks. Docs pass 161 checks in thirteen files. The compiled web journey passes in 50.266 seconds on `85d6e3f2`.

The first embedded check passes the existing solo sync and result-focus cases, then stops before history selection: its setup layout hides the page header's Back control. The shared test now selects the visible page-header or setup-table Back control. This is a test navigation correction; application source is unchanged. The first receipt is retained, and a guarded source comparison reuses its passed web check.

The corrected embedded HTTP check passes in 332.585 seconds on `ade6696d`. Both compiled clients select history with Enter, retain the exact result, restore its move list and explicitly open its existing rematch in the same mounted document. The saved revision, board, moves, rematch link and record stay unchanged. Existing sync, recovery, rematch, layout and teardown cases also pass.

The exact artifact passes. Staging preview `dpl_DRGzcyB6yvo9aQhqbc2WcAcNpb5B` serves the staging alias. A normal-TLS read matches the checked index hash. Server, runtime and all eleven archived engines stay unchanged. The accepted 112 mechanics executions carry forward.

Actual web and ChatGPT open the same earlier finished fairy game, `cda54ee6-4abc-8575-8d3d-5bd212dadc67`, through keyboard selection in Profile. Both show its Casual loss, Open rematch, the original board, March and Darkness powers, four cards and the same two moves. Both return to the result. Active-rematch selection is proved by the compiled checks; the reused live rematch was already aborted in ticket 40. No new game or game command is needed. All ten active games and the five-game record stay unchanged.

The attached ChatGPT host still needs one initial Try again. The separate startup, second-account privacy, Codex interruption, physical-phone/network and operator gates remain open. No production change is made. The parent project stores receipts and screenshots at `evidence/staging-finished-games/verification.md`.

The implementation review confirms that the change uses the existing selection authorization, queue epoch guard, result screen and rematch guard. It adds no dependency, game state store, server path, schema or art. The shared runtime document records the history-selection rule.
