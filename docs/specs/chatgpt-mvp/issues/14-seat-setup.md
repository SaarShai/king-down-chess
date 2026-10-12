# 14 · The seat setup step: king and arrangement

Status: resolved
Type: AFK
Size: M
Blocked by: 12

## Scope

- The board in setup mode: the player's back rank with the drawn pieces; tap two pieces to swap; Shuffle; the legality messages (bishops, guard next to the king).
- The king coin (the same sheet as ticket 12) when king powers are on.
- Ready, then "Waiting for the other player" (polling), then the game starts.
- The opponent's rank stays hidden until both are ready.

## Acceptance

- Browser check: arrange and Ready for both personas; an illegal order shows its message and blocks Ready; a computer game starts after the player's Ready.

## Notes

- The board UI part of branch `claude/arrange-mode` (`src/arrange.ts`) is a reference only; it was written for the old `main.ts`.

## Plan and checks

Base: local claude/mvp-12-setup at a2a5c7ca. Ticket 10 and both parts of ticket 11 are present.

1. Test the pure seat model, one case at a time. Check both square maps, legal marks, invalid orders, Shuffle, king clean-up and Ready arguments.
2. Fill the seat stub. Reuse the one painted board, the table styles and ticket 12's king sheet. Keep the other rank empty.
3. Add Ready, stale revision recovery, same-ID retry, the shared poll path, Abort and the full-read board hand-off.
4. Add one seat browser block. Check both seats, solo Black, Cards, remounts, hidden data, safe areas and the two sample states.
5. Run the unit, build, full browser, named plugin and server checks. Record counts and page bytes. Sync the local integration and setup branches, test and push.

Test seams: pure seat functions, Ready through the shared call path, and the page through both existing harness hosts. The disposable database is kingdown_mvp14_test on 127.0.0.1:55432.

The delegated swap choice permits a swap with any other back-rank piece. Marks show only legal swaps. An invalid order shows validateChoice's words and blocks Ready.

The shared client removes game_id from saved pending arguments. It restores the ID from the board on Retry. The pending Choose may hold order. No idle widget field holds a choice or a game ID.

## Model check point

Four red-to-green steps pass. The first full npm test run passes 2,307 tests in 152 files, with 8 skipped. The final focused npm test run passes all 4 seat tests, all 50 art tests and the type check. The remembered friend or random pick uses cleanKing, then validateChoice; solo uses the server choice. Mud with Leap becomes Mud with March when Cards is on. A missing or invalid pick keeps the server's seat default.

## Result

The seat screen uses the one painted board, the game table styles and ticket 12's king sheet. It shows only the player's rank and pawns. It puts the veil on the other half through screenOf. The strips read me and the opponent from page memory. The other portrait stays plain. The days left use setup_deadline_at and server_now.

Swaps keep the draft in page memory. Marks show the legal targets. A player can make an invalid swap and repair it. The validation words block Ready. Shuffle uses defaultChoice. Ready sends one Choose. A stale revision keeps the order, reads the view and sends a new command ID. A lost reply keeps the same ID. A failed full read stays pending. A remount reads the server choice, restores an open king sheet and completes a started game. A legacy view with no options returns to the board.

The widget has only screen, sheet, board_id and pending. The shared client removes game_id from saved pending arguments and restores it from the board on Retry. Only a pending Choose holds order. Model content stays empty. The other choice and command stay hidden before the start and after a setup Abort.

Checks:

- npm test: 2,310 tests pass in 152 files; 8 skip. All 50 art tests and the type check pass. The final focused run passes all 4 seat tests and all 50 art tests.
- npm run check:browser: all 24 pass. Website source files stay unchanged.
- npm run check:browser plugin-ui plugin-ui-http: both pass. Each host checks both seats, the legal marks, illegal Ready, Shuffle, the Cards power limit, the remembered pick, same-ID retry, stale resend, failed full reads, king-sheet remount, legacy saves, hidden data, Abort and the full-read hand-off. The old Haste, Archer and Freeze cases pass.
- Both hosts check 360, 390, 400 and 1440 px. The document and table have no sideways scroll. Controls keep 44 px targets and clear the composer. The veil stays on the board.
- npm run plugin:build and npm run plugin:server:check pass. The server check uses kingdown_mvp14_test on 127.0.0.1:55432. All 101 art files pass: 72 WebP, 1 PNG, 24 SVG and 4 woff2.
- node tools/plugin-ui-build.mjs: 560,769 HTML bytes; 563,193 payload bytes. The server resource has 562,958 JSON bytes. All stay below 1,000,000 bytes.

Look checks: 8 PNG pairs for seat and seat-waiting at 390 x 844 and 1440 x 900 in both hosts. Sample is left; page is right. The folder is /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-look/14, outside Git.

Kept differences:

- Names, the army and the preset picture come from the server. The sample uses fixed data.
- The shared frame has the spaced Play back control. The local host has Remount and a reserved composer area. The reference paints the host header and composer.
- After Ready, the coin locks and its line omits the tap-to-change words. Ready is final in the tool contract.

Gaps and hand-off:

- Ticket 15 is absent from this base. The old Computer move control sends the opening reply in the solo Black check. Ticket 15 owns the automatic reply at the start. Its ticket records this check and the small seat Abort confirm to join with its shared confirm.
- The shared poll runner reads full setup views while FEN is empty. It does not send since_revision there. This ticket adds no poll helper.
- Earlier checks hit the shared move-remount read race and a symbols pixel check. They pass on the final run without a shared-file change. One later HTTP start finds the disposable database absent; the local make and bootstrap steps restore it, and the final HTTP run passes.

Open item for ticket 14: none. Ticket 15's shared board work and a live ChatGPT host check stay outside this ticket.
