# 02c · Send your turn: the press sends a link game

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: 02b

## Scope

- Owner choices: the turn button in all modes, here online; Online play A, part 1 (the send is the turn button). The rules are in [spec §4.6](../spec.md#46-modes). Decisions D2, D3, D5, D16.
- Demo: `future-online` (`setSend`: "Send your turn"; "Send again").
- Files: `src/main.ts` (`gameLink`, `#share`, `copyAndSay`, the press handler, the link open, `linkSide`); the pure candidate moves in `src/turn.ts` and their tests, with `src/turn-controls.ts` for the press; `tools/verify-turn.mjs` (link cases); new `tools/verify-link-send.mjs` or a part of `verify-turn`; `tools/ux-defects/d9-copy-feedback.mjs`.

## Plan

1. [x] `gameLink(lans)` writes the fixed list of moves.
2. [x] In a link game, End turn reads "Send your turn". The press builds one fixed link: the history through the staged turn, plus the pass when the turn is mid-way. It opens the share sheet on a touch device, else it copies.
3. [x] Only a share that ends with no error, or a copy that succeeds, commits that link: play the pass if needed, set `turnStart`, save, then start the end of a staged end. A cancel or a failure keeps the exact staged state. A failed copy says "Could not copy. Your turn is not sent."
4. [x] The `busy` guard stops a second press. The game counter (`gen`) drops a late share result after a new game, a link or an account change.
5. [x] Words: after a share, "Sent. Wait for your friend's link."; after a copy, "Link copied. Paste it to your friend."
6. [x] After the send: Undo is off; the button reads "Send again" (quiet) and sends `gameLink(turnStart)`. After the end of a link game, "Send again" stays on.
7. [ ] Cut by the fast plan: the first send stays after End turn, as today.
8. [x] A staged end in a link game: the label stays "Send your turn"; the end starts only after the send succeeds.
9. [ ] Cut by the fast plan: no resignation link or Send the result.

## Verification

- [x] Unit tests: candidate moves for plain turns, Haste, a free mark, a staged end and Send again.
- [x] M1 link-game: cancel keeps the turn; success hands over; a double press sends once; the Haste link holds the pass. The check passes twice after the merge.
- [x] Unit tests and all 14 named M1 checks pass, including painted-game and the copy-feedback probe in ux-defects.
- [x] Sample W1: Send your turn and Send again at 390×844 and 1440×900; no fault. Both sheets are checked.
- [ ] The owner's yes on the sample.

## Risks

- `navigator.share` cannot report delivery: "Sent" means only that the sheet closed with no error.

## Does not do

- No Previously (21), no live play, no invite before the first move.

## Comments

Send your turn sends one fixed link. Only success hands the turn over; Send again keeps that link.
Cuts: the first send stays after End turn; no resignation link or Send the result.
Tests cover the candidate moves. M1 checks cancel, success, double press and the Haste pass.
All 14 named M1 checks pass. Turn and link-game each pass twice after the merge.
Sample W1 shows both link states at phone and desktop sizes, with no fault. The owner's yes waits.
