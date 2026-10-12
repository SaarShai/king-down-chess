# 14 · The seat setup step: king and arrangement

Status: claimed
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
