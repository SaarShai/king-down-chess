# Refresh the saved position when the host reopens a board

Status: resolved

## Plan and checks

Use the replayed host result only to identify the match. Fetch the saved view through kingdown_get before rendering it. Keep manual reload available if that fetch fails. Change the host harness to replay its initial result on remount. Check the saved FEN, revision and displayed move number after remount. Run the plugin browser check and the test suite.

## Reproduction

In the live ChatGPT private plugin, create a computer game. Play two player moves and request two computer replies. The board shows White to move at move 3. Reload the full ChatGPT page.

The board shows the initial move-1 snapshot. Press the board Reload button. The correct move-3 position returns, and play can continue.

## Expected result

The reopened board loads the current saved position before it permits a move. A user must not need to press Reload to replace the old tool-result snapshot.

## Evidence

Observed on October 8, 2026 during issue 04 in https://chatgpt.com/c/6ac75478-8988-83eb-81a1-96d5040d8320. Saved moves remain intact. This issue records observed behavior; the source cause is not yet checked.

## Answer

The host replays the tool result from game creation. The board renders that result, then skips its startup read because a view is already present. The board now uses that result only for its match ID and reads the saved game through kingdown_get. This works whether the result arrives before or after connection. If the first read fails, no stale position becomes playable, and Reload can retry with the host match ID.

The host harness now replays the original result on remount. The browser check verifies the saved FEN, revision and displayed move number, then checks a failed read and manual recovery. `npm run check:browser plugin-ui` and `npm test` pass. The change awaits merge and publication; the live host has not yet received it.
