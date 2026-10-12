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
- The end card (owner, 2026-10-11: the approved sample wins): the result and the reason, the rating change and any new badge, Rematch, Your games. No "Moves to look at again" tiles (no replay in the MVP).
- Polling by the schedule of research part 01 §6.5 for games between people; at the board, every 3 s while it is the opponent's turn and the opponent was seen in the last 2 minutes (owner, 2026-10-11).
- The strips (owner, 2026-10-11: the approved sample wins): each side's king portrait and handle, as the sample and the web game show; the opponent's rating.

## Acceptance

- `check:browser plugin-ui` and `plugin-ui-http` extended: optimistic move and rollback; the computer reply; a card played; each action; the end card and rematch; the existing Haste, Archer and Freeze checks still pass.

## Seat hand-off

Ticket 14 starts from ticket 12, before this board build. Its Ready path reads the full view, restores the board handlers and calls routeView. Check the automatic computer reply when Ready starts a solo game with the player as Black. The seat has a small Abort confirm until this ticket supplies its shared confirm. Both screens use the table styles; keep one active set of table IDs when the builds join.
