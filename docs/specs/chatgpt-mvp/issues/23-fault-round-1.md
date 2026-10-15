# Fault round 1

Status: needs-info

The owner requests these five fixes on 2026-10-15. Work stays on `claude/fault-round-1`. Do not push or merge.

## Plan and checks

1. Add a failing test for each fault before its fix. Use the built widget for size and text checks. Use the app harness for dates and read errors.
2. Use the larger bottom reserve. Test phone orientation. Let rule and state rows grow. Keep content in place.
3. Remove seconds from the shared start time. Keep each separator with the next part. Show a read error once, beside Try again.
4. Test 393 × 852 with insets 102/118 and 320 × 568 with insets 63/84. The board is at least 290 px and 170 px. Text fits without a line limit. The bottom gap is 118 px and 96 px.
5. Run the requested plugin tests, build, local browser check, type check and doc checks. Add the host copy to the QA device table. Record results and limits here. Commit with both requested trailers.

## Evidence

The supplied investigation and image pairs are in the owner's scratch folder. The local harness has a 24 px Remount bar. The host-copy tests hide this bar and give the iframe the full viewport height.

## Changes and results

| Fault | Files | Before → after |
| --- | --- | --- |
| 1. Bottom reserve | `app.css`, `screens/lobby.css`, `screens/profile.css`, `tools/lib/plugin-control-bounds.mjs` | Owner gap: 214 → 118 px. Small phone gap: 180 → 96 px. The control check uses the same rule. |
| 2. Phone orientation | `app.css`, `tools/plugin-ui-build.mjs` | Owner seat and board: 247 → 302 px. Small phone seat: 0 → 156 px. Small phone board: 0 → 158 px. The 170 px check still fails. |
| 3. Full rule and state text | `app.css`, `src/ui/table.css` | The context row grows. The fix removes the old status margin and minimum height. All status and note text fits in both host copies. With Accept draw, Decline draw and Abort, the small phone board is 106 px. |
| 4. Start time and separator | `games-list.ts` | Hours, minutes and seconds → hours and minutes. The line test finds 1 trailing separator before the fix and 0 after it. Both game lists use the shared time format. |
| 5. Read error | `screens/board.ts`, `tools/plugin-ui-check.mjs` | 2 copies → 1 copy beside Try again. The status line stays empty during an error. Retry clears the error and restores the turn text. |

Each fix has a test that fails on the old code. The orientation check also uses a 320 × 568 copy with insets 63/180. Its screen is wider than tall. The old query gives a hidden board. The media query keeps the board visible.

The tests use a pool of seven pieces that includes the guard. The seat check reads the full swap instruction and guard hint. The board check reads the full Abort note. The draw check includes both answer buttons. The bottom-gap check also covers a host with no inset.

The baseline is the branch start, `a7edf54a`. A scratch copy builds the tracked source from that commit. Chromium and WebKit give the same before and after sizes. The JSON, logs and PNG files are in `/private/tmp/kingdown-fault-round-1/` (`before.json`, `after.json`, and the matching images).

## Checks

- The requested four-file plugin suite: 80 pass, 2 fail. All app, Profile and lobby tests pass. Both failures are size checks. No time limit changes.
- The new small phone check expects 170 px. It gets 156 px on Seat and 158 px on Board.
- The old size matrix expects 180 px at 320 × 568 with insets 20/0. It gets 173 px on Seat and 176 px on Board. At 375 × 667 with insets 20/0, it expects 230 px and gets 227 px on Board. All matrix control, end-screen and landscape checks pass. Soft size checks let the full matrix finish.
- `npm run plugin:build` passes. The board resource payload is 655,250 JSON bytes in the fixture host.
- `npm run typecheck`, `npm run test:docs` (113 tests), and `git diff --check` pass.
- The QA device table includes both host copies. The installed Playwright device descriptor confirms a 393 × 660 viewport for `iPhone 14 Pro`.
- `node tools/plugin-ui-check.mjs` passes in the local fixture host on port 60884. It checks setup, seat, moves, remounts, error recovery, safe areas and phone input. No page error occurs. It needs no database.

## Open size decision

The full text and the requested 170 px minimum do not fit with the current rows at 320 × 568. The frame is 409 px high. The page header uses 52 px. The table has 357 px. The player and action rows use 132 px. The seat text uses 58.5 px. This leaves 166.5 px of board height, or a 156 px canvas.

The owner must choose a lower size limit or a change to the header, player rows or action layout. The question is open in this session. Keep the 170 px test until the owner decides. Do not mark this ticket done.

I do not check native ChatGPT hosts, a host with a database or the public site. No push, merge or deploy occurs.
