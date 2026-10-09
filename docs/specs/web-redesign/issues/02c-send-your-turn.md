# 02c · Send your turn: the press sends a link game

Status: built (the separate W1 review and the owner's sample review wait)
Blocked by: 02b

## Scope

- Owner choices: the turn button in all modes, here online; Online play A, part 1 (the send is the turn button). The rules are in [spec §4.6](../spec.md#46-modes). Decisions D2, D3, D5, D16.
- Demo: `future-online` (`setSend`: "Send your turn"; "Send again").
- Files: `src/main.ts` (`gameLink`, `#share`, `copyAndSay`, the press handler, the link open, `linkSide`); a new pure module for the send state (`src/link-send.ts`) and its test; `tools/verify-turn.mjs` (link cases); new `tools/verify-link-send.mjs` or a part of `verify-turn`; `tools/ux-defects/d9-copy-feedback.mjs`.

## Plan

1. [ ] `gameLink(plies)` writes the first `plies` plies.
2. [ ] In a link game, End turn reads "Send your turn". The press builds one fixed link: the history through the staged turn, plus the pass when the turn is mid-way. It opens the share sheet on a touch device, else it copies.
3. [ ] Only a share that ends with no error, or a copy that succeeds, commits that link: play the pass if needed, set `turnStart`, save, then start the end of a staged end. A cancel or a failure keeps the exact staged state. A failed copy says "Could not copy. Your turn is not sent."
4. [ ] The `busy` guard stops a second press. The game counter (`gen`) drops a late share result after a new game, a link or an account change.
5. [ ] Words: after a share, "Sent. Wait for your friend's link."; after a copy, "Link copied. Paste it to your friend."
6. [ ] After the send: Undo is off; the button reads "Send again" (quiet) and sends `gameLink(turnStart)`. After the end of a link game, "Send again" stays on.
7. [ ] The first send (D5): in a two-player game, "Send the game link" while a turn is staged does the press and the send in one action, then sets `linkSide` to the active side. With nothing staged, it sets `linkSide` to the side of the last handed-over turn, not to `game.pos.turn`.
8. [ ] A staged end in a link game: the label stays "Send your turn"; the end starts only after the send succeeds.
9. [ ] Resign in a link game (D16): the link gets a field `resign` (`w` or `b`). After Resign, the button reads "Send the result" and sends that link; a failure says so and keeps the button. A link with `resign` opens as a game that ended by resignation.

## Verification

- [ ] Unit test of the send state: the plies of the candidate link for a plain turn, a mid-way Haste turn (with `--`), a free mark and a pass, a staged end; the `linkSide` of the first send with and without a staged turn.
- [ ] Link cases in the `turn` check, with a stubbed share and clipboard: a cancelled share keeps the staged turn and Undo; a refused copy keeps it and shows the words; a success hands the turn over and turns Undo off; a double press sends once; a mid-Haste send holds the pass; a staged mate ends only after the send; a new game during an open share drops the late result; "Send again" gives the same link; the first send sets `linkSide` to the sender; the opened link sets the receiver's side; a resignation link opens as ended.
- [ ] `d9-copy-feedback`, `painted-game` (the link flow), `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844 and 1440×900: "Send your turn" ready; "Send again"; a failed copy; the first send from "Send the game link"; "Send the result" after Resign. The owner's yes, with the date, in Comments.

## Risks

- `navigator.share` cannot report delivery: "Sent" means only that the sheet closed with no error.
- An older app opens a link with `resign` as a game that can still be played.

## Does not do

- No Previously (21), no live play, no invite before the first move.

## Comments

W1 build: Send your turn sends one fixed link. Only success hands the turn over.
Keep the busy and game-counter guards. Send again uses the handed-over moves.
Cuts: the first send stays after End turn; no resignation link or Send the result.
Tests cover the candidate moves. Link-game checks cancel, success, double press and the Haste pass.
Checks: link-game passes twice on the final code; all 17 full-suite checks pass.
Samples: Send your turn and Send again render at phone and desktop sizes, with no fault.
The separate W1 review and the owner's sample review wait.
