# 24 · Card coins by the king

Status: needs-info (the owner chose the design; the engine and the deal are not ready)
Blocked by: 10; the card deal (TASKS "Card deal", needs-info); an engine rule for a game with kings' powers and cards (needs the owner's yes and a measured run); card art; the Rage look

## Scope

- Owner choice: Card mode C, coins by the king. "In a game with kings' powers and cards, the first coin is the power, and it is bound to the king's icon in the drawing. This agrees with the coin by the portrait for powers." The choice is in scope: the build of the other steps does not deliver it, and the release is not the full chosen redesign until this step ships.
- Demo: `future-card-hand` (option C, coins by the king).
- The engine blockers today: `setRules` refuses a hand beside a spendable king power (`src/rules/rules.ts`), and the position's `used` field holds a count of power uses or, with a hand, the bits of played cards (`src/rules/engine.ts`, `spend`). A power and cards cannot share that field yet.
- Files (when unblocked): `src/ui/coin.ts` (the coin row of ticket 10), `src/powers-ui.ts` (`coinState` for cards), `src/main.ts` (call lines only), `src/style.css`, `tools/verify-powers.mjs` or a new card check.

## Plan

1. [ ] Groundwork with no visible change (can go first): `needsArming` and `offered` for every card tag; `describeMove` words for every card tag; a `usesLeft` that reads a hand's bits.
2. [ ] The coin row by the portrait: the power coin first, bound to the king's icon; then one coin for each card in the hand. A tap reads a coin (D7); "Use" arms it.
3. [ ] States: a spent coin greys; two cards of one kind show two coins; a drawn card adds a coin; the opponent's coin flips when they play a card (the reveal of ticket 10); Undo before the press brings a card back.
4. [ ] The row fits at 375 px with the most coins a hand can hold (`HAND_MAX` 8, plus the power coin).

## Verification

- [ ] `coinState` tests for cards: duplicates, spent, drawn, Undo.
- [ ] A browser check: the power coin first and bound to the portrait; card coins after it; a read of each; a play spends the coin; the opponent's reveal; the full row at 375×667 with no overlap.
- [ ] Rendered sample, 390×844 and 1440×900: a hand of six; a spent card; a full row; the opponent's reveal. The owner's yes, with the date, in Comments.

## Risks

- The card deal and the engine rule can change the hand size or the card set; the row must not assume a count.

## Does not do

- No folded hand (the owner chose the coins), no card art of its own, no card panel.

## Comments
