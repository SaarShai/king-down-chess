# 15 · The game board

Status: resolved
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

## Check point: moves and computer

The held-reply check fails before the optimistic move. The move now applies at once, with the game animation and describeMove words. A final refusal restores the server position, clears the command and reads the board again. A lost reply keeps the move and the same command ID. Replays need a complete LAN list that reaches the server FEN. The Moves sheet lists only known moves.

The automatic-computer check fails before the responder. The responder starts at mount and after each reply. It uses the reply's revision, with at most four calls in a row. The Computer move button is gone. The fake clock checks thinking after one second. One normal computer turn sends one command. The retry check keeps its same-ID assertion and checks revision 1 on the next computer command. Touch and Haste still send one and two player commands.

The final fixture check passes 1 of 1 in 107.1 s. The HTTP and PostgreSQL check passes 1 of 1 in 80.1 s. The older checks pass. The type check passes.

The system Git shim now asks for an Xcode licence. The installed Command Line Tools Git works. Checks use a command-local PATH to that binary. No licence or system setting changes.

These checks cover moves and the computer. The next phase adds cards and the end card.

## Check point: cards

The card Use check fails before the control. Create deals four cards through the page's tool. Both strips show their hand and spent coins. A card reads its name, rule and art in the game sheet. Use arms only that card's moves. Named targets, drops and an enemy piece's card move use the same legal choices. Mirror B spends its own bit. Widget state has no hand data.

The fixture check passes 1 of 1 in 137.1 s. The HTTP and PostgreSQL check passes 1 of 1 in 81.6 s. The type check passes. The older Haste, Archer, Freeze, move, retry and viewport assertions pass.

## Check point: action confirms

The Resign confirm check fails before its code. It passes in the fixture check, 1 of 1 in 115.8 s. The action sheet has Resign, draw choices, Abort and deadline claims. A first-turn expiry says End game. A later expiry says Claim the win. NOT_ALLOWED clears the pending command. A refused action reads the server view again. Full action flows remain in the next check phase.

Haste has the mid-turn words and a Stop here action. Its check keeps the extra-move assertion. The symbol threat check waits for the real paint before it counts the red pixels. It keeps its arrow and pixel assertions.

## Check point: end card and rematch

The rematch helper fails before its code. The unit suite then passes 2,187 tests and 50 art tests, with 121 skipped. The fixture browser check passes 1 of 1 in 107.5 s. The HTTP check passes 1 of 1 in 93.2 s. Both cover Resign, Abort, the draw responses, a later deadline claim, the end card, Your games and both rematch types. A lost rematch reply keeps a visible Retry and the same command ID. The new game uses Resume on the same board. A full finished read fills the outcome. A partial read keeps it.

The end card has no replay tiles. The card uses ending for its reason and describes the final known move. Checkmate has King Down and the fallen king. Human games show the rating and first new badge. The shared poll runner reads while a rematch offer is open. The board uses the shell's runner and its schedule.

The table returns to the board before an empty-position draw. The end scrim leaves the back control accessible. The page keeps one PaintedView. Symbols only uses Off pace: its scene has no painted figures for a travel animation. The same legal LANs and marks still update. The sample-state check catches that replay error before the pace change.

The look check measures all seven states at 360, 390, 400 and 1440 px. Phone and desktop comparisons go in the system temporary folder, kingdown-look/15. Each capture waits for the move and image reads. A reused Open fixture omits its old settings field, so it cannot reset a saved setting. The final runs remain open.

The full ticket-database suite passes 2,300 tests and 50 art tests, with 8 skipped. The fixture check with all sample states passes 1 of 1 in 115.6 s. The Black-mount HTTP check must wait for the new game's reply, so it cannot read the old game's Your move line. Sample captures advance the fake clock through the game's marker timing before they read the pixels.

## Check point: arrivals and end presence

The arrival check deals Salvation through Create. A buddy takes the player's knight. The card returns it to its empty start square. The check fails on the empty-source travel animation. An arrival now syncs at once, and its piece supplies the move icon. Ordinary moves keep their animation. The same check then reaches the end-presence check without a render error.

The end-presence check fails before its fix. A held poll has the same revision and marks the opponent as deleted. Rematch now reads that fresh opponent field. The poll leaves the controls enabled. The check also restores the field and checks the choices again.

GAP: describeMove has no Salvation arrival words. It calls the empty source an empty piece. The page uses the game words, as this brief requires. A repair belongs in move-text.ts, which is outside this ticket. The move icon and the card's read identify the returned piece.

## Result

The board and end routes are complete. The table uses one PaintedView, the game marks, king portraits and handles. Moves show before the reply. A final refusal restores the server position. Retry keeps its command ID. The computer plays after a reply and at mount, with no button. Cards read and arm their legal moves; a returned piece appears at once. Menu actions have confirms. The end card reads the outcome once and resumes a rematch on the same board. The shared poll runner stops on teardown and while the page is hidden.

Checks: npm test on kingdown_mvp15_test passes 2,300 tests and 50 art tests, with 8 skips. All 24 browser checks pass. The final named checks pass 2 of 2: fixture 115.8 s, HTTP and PostgreSQL 94.2 s. They keep the older Haste, Archer and Freeze checks and cover both deadline types, a Black mount, a card arrival, end presence and same-ID rematch retry. The compiled server check passes with 101 art files (72 WebP, 24 SVG, 4 fonts and 1 PNG). The page build is 569,632 bytes; its MCP payload is 571,809 bytes, below 1,000,000.

All seven states fit at 360 x 844, 390 x 844, 400 x 900 and 1440 x 900. The table, bar, context and end card clear the composer and have no sideways scroll. Phone and desktop comparisons are in /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-look/15. The end scrim opens after the final draw, so its background has the final position and fallen king.

Kept differences: the host harness has a Remount control and no native host header or composer; those belong to the host. The page has the required ‹ Play control. It uses 34 px card coins at both strips, as this brief requires. Names, ratings and move data come from each view. A cold mount says Move N. The end has the game reason and final known move, and has no replay tiles, as the owner requires. Symbols only has no travel animation; the shared painted scene has no figure to move in that mode.

Open items outside this ticket: the game needs Salvation arrival words in move-text.ts. The fixture computer log has no LAN list; HTTP verifies replay. A fixed-hand fixture case remains with ticket 10; these checks use a real deal. Ticket 14 can import confirmAbort from board-actions.ts; its seat file is a stub on this base. The integration merge and its checks follow this result.
