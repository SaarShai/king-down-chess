# 14 · The end: the Ceremony

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 02c, 03, 07, 11

## Scope

- Owner choice: the end of a game, B, the Ceremony (our pick of its form): the final blow again at half speed, the king falls, "King Down" settles in, three tiles rise. Decisions D3 (the end starts on the press, or on a send that succeeds) and D8 (which games).
- Demo: `feat-king-down` option B (`end.js`: `runCeremony` 326–368, `renderResult` 183–216, `tileList` 219–232; `end.css`). Its notes: "A loss and a draw always end quietly."
- Files: `src/main.ts` (`result`, `showOver`, `listMoments`, the result close; call lines only); `index.html` (`#over` becomes a result pane); `src/render/PaintedView.ts` (a speed option on `animateMove`); `docs/2d-first-pieces/board/scene.mjs` and `scene.d.mts` (`setSpotlight`); a new pure `ceremonyPlan` and its test; a pure timing module beside `scene.mjs` (spec rule 8); `src/style.css` (the dialog king fall goes); new `tools/verify-end.mjs`; `tools/verify-game-screen.mjs` (the end state); `verify-king-effects.mjs`, `verify-painted-game.mjs`, `qa.mjs`, `tools/ux-defects/` d1, d4, d9, d10.

## Plan

1. [ ] The result leaves the modal. On desktop it sits in a pane beside the board. On a phone it takes the rows under the board (the one exception to spec rule 9): the board keeps its place, and the pane holds the result, the tiles, Rematch, Review, New game and Menu. It never covers the fallen king. The second king fall of the dialog goes.
2. [ ] `ceremonyPlan(result, mode, history)` (pure). It plays for your win against the computer, any mate on one device, and your win in a link game after the send succeeds (D8). A loss, a draw and Resign end quietly: the king lies down (no fall for a draw), and the result and Rematch show at once. For the sample, the plan can also give a loss the Ceremony.
3. [ ] The final blow is the last ply of the winner's turn that changes a square: a trailing pass is skipped (a Haste turn that ends with `--`; a free mark and a pass). A mark that moves no figure shows its cause line. The spotlight takes its attackers from `checkersOf` (ticket 07), so a discovered check and a double check light the real checkers.
4. [ ] The sequence, from the press (or the computer's last move): a 120 ms stop; the board before the blow; a spotlight on the attackers and the king (the other figures at 45 %, 240 ms); the blow again at half speed with no sound and no time cap; the king falls (650 ms); the cause line (ticket 07); 560 ms; the capture sound; "King Down" settles in (480 ms, scale and opacity only); three tiles rise (150 ms apart).
5. [ ] The tiles, "Moves to look at again": the final blow and up to two special moves of this game (the winner's first), with no search. A tile opens Review at that move (ticket 11). The key-moment search stays in Review only.
6. [ ] Skip and focus: during the sequence the focus is on the result pane; a tap on the board, Esc, Space or Enter skips to the end frame. At the end frame the focus moves to Rematch, and a live region says the result once ("King Down. White wins by checkmate."). Rematch works by pointer from the first frame. A hidden tab jumps to the end frame. Motion Off and reduced motion show the end frame.
7. [ ] The game counter (`gen`) guards every wait of the sequence: Rematch, a skip, a new game or an account change never draws an old end over a new game.
8. [ ] A staged end: the sequence starts only on the press (or the send in a link game), once. Undo before the press removes the end, and a reload restores it as staged (ticket 02b).
9. [ ] A king capture: the blow replays; the king is gone, so no fall; the words show.
10. [ ] "Copy today's result" (`#share-result`) moves into the result pane with its id, words and copy path (sharing is parked).

## Verification

- [ ] `ceremonyPlan` test: which games play it (a win, a loss, a draw, Resign, one device, a link game); the final blow for a Haste mate that ends with a pass, a mark and a pass, a discovered check, a double check, Strike and a king capture; the tile pick; a short game gives fewer tiles.
- [ ] Node test of the timing module: half speed for a long Beast chain and an Ogre action, with no cap.
- [ ] New check `end`: the king falls once; the words; three tiles; a tile opens Review; Enter during the sequence skips and does not start a Rematch; the focus is on Rematch at the end frame; Rematch by pointer from the first frame; each skip key; Motion Off shows the end frame; the draw, loss and Resign paths stay quiet; the result never covers the king; a staged mate plays once on the press and not after Undo; Rematch during the sequence leaves no old end on the new game.
- [ ] `game-screen` check: the end state on a phone keeps the board box in place.
- [ ] The updated checks, `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size. The plugin session knows before the pull request.
- [ ] Rendered sample: one phone video of a mate by an Archer shot and one by a Beast chain; a loss both ways (quiet, and with the Ceremony); stills of the end frame and of a loss at 390×844 and 1440×900. Ask the owner: "Does a loss also get the Ceremony?" (D8). The owner's yes, with the date, in Comments.

## Risks

- The sequence is longer than the earlier motion rule (2.6 s), and a long Beast chain at half speed adds more. The owner chose the Ceremony; the skip and Rematch from the first frame keep control with the player.
- A mate by a power move (Strike) must replay the power move.

## Does not do

- No Retry (ticket 23), no new sharing, no crowns.

## Comments

Phase 2 build: the final blow plays at half speed; one king falls; words and tiles show.
The beats start after the press. The tiles open Review at their ply.
Key-moment search starts from Review. A new game clears its data.
Skip, Off and reduced motion show the end frame. Rematch works from the first frame.
D8 plays your win or any mate on one device. A loss, draw and Resign stay quiet.
Cut: the result pane, spotlight and new plan and timing modules. Keep today's dialog.
`npm test`: 1512 passed, 13 skipped; 50 motion tests pass. Type check passes.
Checks pass: turn, end, painted-game, playable-clay, plugin-ui, plugin-ui-http, w6-parts.
The plugin page stays at 4,292,611 bytes. Sample W6: five renders, one phone video, no fault.
Separate review, the full browser suite and the owner's sample review remain.
