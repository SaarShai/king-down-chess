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

1. [x] **Art:** convert the 11 jpg of `mockups/assets/cards/` (about 980 KB) to webp with `sharp` (already in devDependencies) into `public/ui/cards/`. Record the command and the sizes in this ticket. No new dependency.
2. [x] **`src/workshop/powers.ts`:** `cardMarks(pos, card)`: in `withRules({ hands: [[card], []] }, …)` with no spendable king power (`setRules` refuses both, `rules.ts:823-827`), `legalMoves(pos)` with the card's tag.
3. [x] **`src/workshop/ground.ts`:**
   - Cards tab: the fan; the "+N" stack spreads on a tap and "‹ Back" closes it; B forms show inside their parent (`VARIANTS`, `proving-ground.html:676`). An open card: its art, title, `cardText` (`src/powers-ui.ts:72`) and the LAB ribbon on the plinth.
   - The card slot in the tray: "LAY A LAB CARD" with the six cards; the effect on the board; Take back removes the card.
4. [x] **Tests:** `powers.test.ts`: Freeze on the `freeze-card` board (`scenes.js` `freeze`, G22 `:368`).
5. [x] **Check group `labCards`;** W14 states `cards`, `freeze-card`, `card-salvation`.

## Verification

- [x] `npm test` passes, with a test that holds `public/ui/cards` to the 11 webp (as `src/workshop/figures.test.ts` does for `public/ui/workshop`).
- [x] `npm run check:browser workshop` passes three times.
- [x] The precache size before and after (`vite.config.ts:38-51`) in this ticket.
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Risks

- The service worker precaches the new art; check its size.

## Does not do

- No cards on designed pieces (16). No card facts table (spec, "Later").

## Comments

### 2026-10-11 · built on `claude/pg-kings`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/14-cards/`):

- Art: `node -e` with `sharp(src).webp({ quality: 80 }).toFile('public/ui/cards/<name>.webp')` for each jpg of `mockups/assets/cards/`. 11 files, 974,173 bytes of jpg to 370,356 bytes of webp (back 50,914; freeze 54,796; icewall 43,644; leap 15,212; march 40,908; mimic 27,094; rescue 21,368; sacrifice 11,546; salvation 10,146; skylift 46,788; vault 47,940). No new dependency.
- `npm test`: exit 0; 116 test files pass, 1 skipped (`logs/npm-test-1.log`). `powers.test.ts` has the Freeze card on the freeze-card board, the Leap card on the Rook, and the test that holds `public/ui/cards` to the 11 webp.
- `npm run check:browser workshop`: passes three times in a row after the last change (`logs/check-9.log`, `logs/check-10.log`, `logs/check-11.log`), with the new group `labCards`. `logs/check-1.log` to `logs/check-8.log` are the runs before the fixes: a sideways scroll at 320 px (the tabs), a 40 px card slot beside the note and beside a seated king, and three faults in the new check itself.
- Precache (`vite build`, then the `PRECACHE` list of `dist/sw.js`, summed): before, 171 files, 8,038,061 bytes (7.67 MB); after, 182 files, 8,424,317 bytes (8.03 MB). The 11 card pictures and the larger Workshop chunk add 386,256 bytes.
- W14: `SAMPLE=W14` with only the states `cards`, `freeze-card`, `card-salvation` (and `kings`, `frost-power`, `tray` again for the changed tray): 13 renders, 0 with a fault (`logs/w14-3.log`, renders in `w14/`).
- Beside the mockup at 1440 × 900 and 390 × 844 (the mockup on the left): `side-cards-1440.png`, `side-cards-390.png`, `side-freeze-card-1440.png`, `side-freeze-card-390.png`, `side-card-salvation-1440.png`, `side-card-salvation-390.png`.

Changes from the ticket, each with its reason:

1. `cardMarks(pos, from, card)` has the parameter `from`, as `powerMarks` does: it keeps the moves of the open piece, and for Freeze and Ice Wall a mark on any piece. `powers.ts` also has `cardRules` (the words of a card read them) and `playCard` (`makeMove` in `withRules`), so that `ground.ts` does not touch `RULES`. The card rules are the defaults with the hand (the ticket's `withRules({ hands: [[card], []] }, …)`), so Freeze is "as your move", as the mockup's words say.
2. The deck is the mockup's (`CARDS` less `VARIANTS`): 25 cards, 10 with art in the fan and 15 in the stack. The words are `cardText` with the web's "take" for "capture" (as `powerText`'s webWords), so `src/powers-ui.ts` (a plugin module) does not change.
3. A card's picks are runes (`runeRing`, marks.js:557-571, ported to `marks.ts` as the scene effect `rune`), barred on the king that the card may not pick; a tap on the barred king says "Not the king." While an open card is laid and not played, the piece's own marks step back (the mockup's `dim`); so do they just after a Freeze or Ice Wall card, which is the turn's move. Frost and runes stay clear when marks step back or a rule is isolated.
4. Opening any card on a pool piece lays it in the slot and turns the plaque burgundy, as the mockup's `openCard` does. Only the six cards of decision 30 have picks; the other cards say "No test board for this card yet." (the mockup's toast, here in the right column).
5. One power or one card at a time (card mode plays kings with no spendable power, `setRules`): an armed power takes the card away, and a laid card lets the armed power go. The seated king stays on the board.
6. Take back is in the tray after a card is played (the mockup's `takeback`, :1389), and in the Why tag as before. It gives the card back. The die and the broom give a fresh card too: a new board is a new test.
7. On a copy or a new piece the card slot has `aria-disabled` and its tap says "Cards work on the pool pieces for now." The note under the King socket keeps its words.
8. The tray's tokens wrap and never shrink: a seated king (figure and two coins) and the card slot do not fit one row of the right column, so the slot goes to a second row. The copy's note goes under the tokens.
9. On the phone the ledge tabs share the row (`flex: 1`, the mockup's phone CSS :517-518): four tabs with "Cards LAB" did not fit 320 px.
10. The open card's coin of its king is the game's coin, as in ticket 13; a tap on it opens that king in the Kings tab.
11. The mockup's stopped threat with the card stamp waits for the "Also changed by" work (spec, "Later"), as in ticket 13. W14 `cards` and `freeze-card` use the Paladin's own example board, so they have no threat arrows; the mockup uses a hand board.
12. `docs/WORKSHOP.md` gets a "Cards (LAB)" bullet, and its check and test lines name the new parts.

Open problems:

- The owner has not seen the renders (the last Verification box).
- No Rules tab here: ticket 12. The tabs list in `renderLedge` and the phone tab CSS are the merge points; at 320 px five tabs may not fit.
