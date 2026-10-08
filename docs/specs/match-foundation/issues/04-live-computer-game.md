# Test a computer game in ChatGPT

Status: resolved

## Scope and plan

The owner asks on October 8, 2026: "test playing against the computer for now". Use the connected test account and one game in the real ChatGPT host.

1. Ask the private plugin to create one computer game and show its board.
2. Play legal moves and verify computer replies, turn changes and saved state.
3. Reload or reopen the game and verify that play can continue from the saved position.

## Acceptance

- The real host loads the board through the signed-in plugin.
- Player moves and computer replies change the authoritative game state.
- Reopening preserves the position and permits continued play.
- Report actual host results separately from local tests. Two-player testing stays outside this check.

## Live results

The check runs on October 8, 2026 in the real ChatGPT host with the connected test account. One game is created through King Down private test.

- The board loads and shows White to move at move 1.
- White plays e2-e4 and d2-d4 through the displayed legal move buttons. Each move changes the turn to Black. The Computer move button produces a reply and returns the turn to White.
- A full chat reload first shows the initial move-1 snapshot. The board Reload button restores move 3 and the same visible position. No saved moves are lost.
- White then plays c2-c4. The computer replies. The board shows White to move at move 4.
- Computer replies require the Computer move button in this host UI.

The requested live smoke check is complete. It does not cover a full game, all powers, or two-player play. Automatic state refresh on chat reopen fails; issue 05 records that defect.

Test chat: https://chatgpt.com/c/6ac75478-8988-83eb-81a1-96d5040d8320
