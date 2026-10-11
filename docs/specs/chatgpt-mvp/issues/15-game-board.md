# 15 · The game board

Status: ready-for-agent
Type: AFK
Size: L
Blocked by: 11

## Scope

- Optimistic moves: the move shows at once; a rejection rolls it back with a message (spec, agent decisions).
- The computer replies on its own after the player's move (no Computer move button).
- Cards: both hands as simple faces (spec Q22), spent cards marked, play a card on the player's turn through the move choices; the power coin with its uses.
- Actions: Resign, Offer draw / Accept / Decline, Abort (before each side's first move), Claim (after a missed deadline), each with a confirm.
- The end card: the result and the reason, Rematch, Back to Play.
- Polling by the schedule of research part 01 §6.5 for games between people.
- The opponent's handle and picture above the board.

## Acceptance

- `check:browser plugin-ui` and `plugin-ui-http` extended: optimistic move and rollback; the computer reply; a card played; each action; the end card and rematch; the existing Haste, Archer and Freeze checks still pass.
