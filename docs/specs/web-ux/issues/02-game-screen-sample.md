# Rendered sample of the new game screen

Status: ready-for-agent

Owner, 2026-10-08: "yes, do both." The sample follows the picks of the [review](../review.md): the agreed changes 1–3, 9, 10, 16 and 17, the [proposed game screen](../review.md#4-the-proposed-game-screen), W2 C (phone bar, desktop quiet toolbar), W10 B (type and buttons) and W11 B (last move).

## Plan

A static page in `docs/specs/web-ux/sample/` with the real painted board (captured from the app) and the new controls around it. Five sizes: 1440×900, 1280×720, 820×1180, 390×844, 844×390. Four states: your move; a piece selected with its card; a review of an earlier move; a powers game. A capture script renders each state at each size, plus one contact sheet per state.

## Verification

- [ ] No sideways scroll and every control inside the screen, at each size and state.
- [ ] On touch sizes (820×1180, 390×844, 844×390) every control is at least 44 px.
- [ ] Hint and Undo stay at the same place in all four states (0 px move).
- [ ] At 390×844 the squares are at least 45 px; at 820×1180 the board is at least 736 px wide; at 844×390 the board fills the height.
- [ ] Cinzel only at 18 px and larger; body text 16 px; three button kinds plus an icon button.
- [ ] The owner's yes on the sample.
