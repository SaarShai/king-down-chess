# 15 · The game board

Status: in-progress
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

## Plan and checks

Base: local claude/chatgpt-mvp at 1a2b0ecc. The 06, 07, 08, 10 and 11 merges are present. Ticket 11 has both Part 2 results.

1. Test the board helpers: card use, legal LAN apply and replay, abort and deadline actions, strip words. Use one red test, then its code, for each part.
2. Build the table and strips. Use the one board, the game marks and the game words.
3. Show a move before its reply. Restore the server position on a refusal. Run the computer after each reply and on mount.
4. Add card reads and Use, the action confirms, the end card and Rematch.
5. Use the shared poll runner. Read a finished game once for its outcome. Resume a rematch on the same board.
6. Extend the board browser checks. Check each sample state at 390 x 844, 400 x 900, 1440 x 900 and 360 px. Save sample comparisons in the system temporary folder.
7. Run npm test, all browser checks, both named plugin checks, the build and the server check. Merge the local integration tip, run npm test and push this branch.

Test seams: the pure board helpers named in the brief and the app page (spec Seam 4). The browser uses the fixture and HTTP MCP with kingdown_mvp15_test on 127.0.0.1:55432. Checks cover the shown move before a held reply, rollback, automatic computer turns, cards, actions, Rematch, polling, safe bounds and the shared art.

The approved sample sets the strips: each portrait shows that side's king; each name shows the handle. The errata set Abort from abort_open only. A first-turn claim ends with no result. Outcome comes from a full read. A deleted opponent has no Rematch. Card checks use the page's create tool and its dealt hand.

## Check point: helpers

The Abort and deadline, legal LAN apply, LAN replay and open-hand checks each fail before their code. They pass after it. The first two full database suites pass 2,295 and 2,296 tests. Each also passes 50 art tests. The replay, card and strip cycles use the unit suite. They pass 2,184, 2,185 and 2,186 tests, with 121 skipped. Each passes 50 art tests. The final suite also uses the ticket database.

GAP: the fixture's computer log has no LAN list. The board syncs that reply without a guessed animation. The HTTP check verifies the computer LAN replay. A fixed-hand fixture case stays with ticket 10; the card action check uses create with cards on.

## Check point: table

The table check fails before the build. The table, strips, context words, king coins and marks are in place. The one board stays in board-view.ts. The strips show the side's king and handle. A full read sets the rating; a command or since poll keeps it. Widget state uses a sheet ID, with no card or king name.

The old checks use the visible context, move line and Menu controls. The Haste, Archer and Freeze assertions stay. Freeze reads its coin, presses Use, then selects the named move. A server read blocks input but keeps the shown marks.

The fixture browser check passes 1 of 1 in 103.4 s. The HTTP and PostgreSQL browser check passes 1 of 1 in 75.3 s, on kingdown_mvp15_test. Both cover 360, 390, 400 and 1440 px, remounts, lost-reply retry, each piece and king, symbols, threats and the older assertions. The type check passes.
