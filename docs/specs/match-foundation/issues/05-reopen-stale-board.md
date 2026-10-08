# Refresh the saved position when the host reopens a board

Status: open

## Reproduction

In the live ChatGPT private plugin, create a computer game. Play two player moves and request two computer replies. The board shows White to move at move 3. Reload the full ChatGPT page.

The board shows the initial move-1 snapshot. Press the board Reload button. The correct move-3 position returns, and play can continue.

## Expected result

The reopened board loads the current saved position before it permits a move. A user must not need to press Reload to replace the old tool-result snapshot.

## Evidence

Observed on October 8, 2026 during issue 04 in https://chatgpt.com/c/6ac75478-8988-83eb-81a1-96d5040d8320. Saved moves remain intact. This issue records observed behavior; the source cause is not yet checked.
