# 21 · Link games: Previously

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 02c, 11 (`storyLine`), 14 (the end)

## Scope

- Owner choice: Online play A, Previously: the friend's move plays once, with one line and See again. Part 1 (the press sends the link) is in ticket 02c.
- Demo: `future-online` option A (`online.js` 255–302; renders `previously-*`). Advisors: show calm, separate states.
- Files: `src/main.ts` (the link open, start-up order, `showPly`, the open-link question; call lines only); a pure helper for the friend's last turn and its test; `src/move-text.ts` (`storyLine` from ticket 11); `index.html`; `src/style.css`; new `tools/verify-link-game.mjs`; `tools/verify-painted-game.mjs` (the link flow); `tools/ux-defects/d9-copy-feedback.mjs`.

## Plan

1. [ ] A pure helper finds the friend's last turn in an opened link: the plies at the end by the side that is not this device's side (a Haste, a free mark and a move, Rage and Rally play whole).
2. [ ] When a link brings new plies: draw the board before the friend's turn; after any open-link question and when the board is ready, wait 300 ms, then play those plies once with their sounds, under the same guards as review.
3. [ ] The context line (rank 14 of spec §4.9): "Previously" with the friend's turn in one sentence ("Their archer shot your knight."), your last move above it in a quiet line, and See again (plays the turn once more; the board takes no move during it).
4. [ ] Motion Off and reduced motion: no replay, the same line, no See again. The first link (no move of yours yet): only the friend's line. A link that cannot be read in full: no replay; the error line in the context line, in place of `alert()`.
5. [ ] A link that ends the game: the friend's last turn plays once (Previously), then the end of ticket 14 (a loss ends quietly, D8). A link with a resignation (D16) opens as ended, with the line "Your friend laid their king down."
6. [ ] The open-link sheet replaces the browser `confirm()` when a link would replace a different saved game. It names both games and asks once.
7. [ ] The states of a link turn use the words of [spec §4.9](../spec.md#49-the-context-line): ready, sent, copied, and a failed send. Add no other state words.
8. [ ] A reload after the open does not replay (the link leaves the address, as today).

## Verification

- [ ] Unit test of the helper: a plain move; a Haste turn; a free mark and a move; Rage; Rally; the first link.
- [ ] New check `link-game`: open a friend's link: the turn plays once, the line shows, See again replays, Undo cannot take back the friend's ply; with Motion Off the line shows with no replay; a link that ends the game plays the final turn once, then the quiet end; a resignation link opens as ended; a link over a different saved game asks in the sheet, with no `confirm()`.
- [ ] `painted-game`, `ux-defects`, `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample: one phone video of an opened link; stills at 390×844 and 1440×900 of Previously, of a final link and of the open-link sheet. The owner's yes, with the date, in Comments.

## Risks

- The account can replace the game during the replay; the replay stops on any game change.
- Two devices on different app versions: the link carries the preset and the kings, not the full rules.

## Does not do

- No live play, no Online, Away or Reconnecting states, no four words, no invite before the first move, no chat preview picture.

## Comments
