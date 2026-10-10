# 14 · LAB cards tab (later)

Status: ready-for-agent
Size: M
Blocked by: 13
Later: not needed for v1; card mode is lab only, and the card deal is still open (`TASKS.md`, "Card deal").

## Scope

- The ledge's Cards tab with the LAB label: a fan of the cards with art, a "+N" stack for the others; an open card shows large on the plinth.
- Try with gets the card slot: lay Freeze, IceWall, Leap, March, Mimic or Vault on an unchanged pool piece (decisions 30 and 31). The plaque turns burgundy: "LAB card".
- Card art: Rescue uses the hands art, Salvation the graveyard art (owner, 2026-10-10, `REVIEW.md:122`).
- Mockup states `cards`, `freeze-card`, `card-salvation`, `card-rescue`; function `layCard` (`proving-ground.html:1908`).

## Plan

1. [ ] **Art:** convert the 11 jpg of `mockups/assets/cards/` (about 980 KB) to webp with `sharp` (already in devDependencies) into `public/ui/cards/`. Record the command and the sizes in this ticket. No new dependency.
2. [ ] **`src/workshop/powers.ts`:** `cardMarks(pos, card)`: in `withRules({ hands: [[card], []] }, …)` with no spendable king power (`setRules` refuses both, `rules.ts:823-827`), `legalMoves(pos)` with the card's tag.
3. [ ] **`src/workshop/ground.ts`:**
   - Cards tab: the fan; the "+N" stack spreads on a tap and "‹ Back" closes it; B forms show inside their parent (`VARIANTS`, `proving-ground.html:676`). An open card: its art, title, `cardText` (`src/powers-ui.ts:72`) and the LAB ribbon on the plinth.
   - The card slot in the tray: "LAY A LAB CARD" with the six cards; the effect on the board; Take back removes the card.
4. [ ] **Tests:** `powers.test.ts`: Freeze on the `freeze-card` board (`scenes.js` `freeze`, G22 `:368`).
5. [ ] **Check group `labCards`;** W14 states `cards`, `freeze-card`, `card-salvation`.

## Verification

- [ ] `npm test` passes, with a test that holds `public/ui/cards` to the 11 webp (as `src/workshop/figures.test.ts` does for `public/ui/workshop`).
- [ ] `npm run check:browser workshop` passes three times.
- [ ] The precache size before and after (`vite.config.ts:38-51`) in this ticket.
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Risks

- The service worker precaches the new art; check its size.

## Does not do

- No cards on designed pieces (16). No card facts table (spec, "Later").
