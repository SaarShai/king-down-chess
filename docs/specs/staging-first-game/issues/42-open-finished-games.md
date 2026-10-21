# Open finished games from Profile

Status: in progress. Parent: U07.

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
