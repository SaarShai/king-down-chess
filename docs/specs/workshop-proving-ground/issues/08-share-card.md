# 08 · The card face for sharing

Status: ready-for-agent
Size: M
Blocked by: 07

## Scope

- From mockup B, the card face as the thing a player shares (`REVIEW.md:106`; owner choice "A, Card", `docs/specs/web-redesign/spec.md:43`).
- The Share sheet with the card face.
- A design link opens the card face first, read only, then the board (decision 25).
- The ledge reach popover: a small 7 × 7 diagram over a ledge figure (desktop).
- Sources: `mockups/binder-and-table.html` `pieceCardFront` (`:1226`), `cardDiagram` (`:1193`); `marks.js` `diagram` (`:923`); `proving-ground.html` `showReach` (`:1487`).

## Plan

1. [x] **`src/workshop/marks.ts`:** port `diagram()` (`marks.js:923`), the 7 × 7 reach diagram, with its tiles from `legend.ts`.
2. [x] **`src/workshop/face.ts` (new), pure:** `faceHtml(d, verdict)`: the figure, the name, the diagram, up to 3 seals with their sentences (`ruleText`, `text.ts:91-98`), the worth ("About N pawns") and the band word. No control in the face. The old `card.ts` stays for the old Workshop until ticket 11.
3. [x] **Share sheet** (the top bar's Share; ⋯ on the phone): the face on top with "Your friend opens this card. It opens read only.", then Send link (`navigator.share`), Copy link and Copy as text (`designText`, ticket 07). With no device share, one Copy link (as web-redesign ticket 22). Copy by hand on a refusal (ticket 02).
4. [x] **Link view:** `openDesign(code)` shows the face with "Keep a copy" (saves it, as `keepCopy`, `dialog.ts:688-693`, then opens it on the board) and "Open on the board" (the board, read only; the first edit keeps a copy, as for a pool piece). A bad code keeps the toast of ticket 01.
5. [x] **Reach popover:** hover or focus on a ledge figure shows a 96 px `diagram()` over it (desktop only).
6. [x] **Tests:** `src/workshop/face.test.ts` (new): the diagram marks each square kind; the seals and sentences; the worth and band words; no `<button>`, `<input>` or `<select>` in the face.
7. [x] **Check groups:** `shareSheet` (with and without device share), `linkCard` (link → face → Keep a copy → board → "Yours"; link → Open on the board → first edit → a copy), `reachPopover`.
8. [x] **W14 states:** `share`, `link-card`, `reach-popover`, `phone-share`, `phone-link-card`.

## Verification

- [x] `npm test` passes, with `face.test.ts`.
- [x] `npm run check:browser proving-ground` passes three times.
- [x] W14 renders at 1440 × 900 and 390 × 844, beside B's card face in `binder-and-table.html`.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The worth is computed on the friend's device; a later judge can give another word (as ticket 22).

## Does not do

- No card back. No chat preview picture (it needs a server). No See all grid (15).

## Comments

### 2026-10-10 · built on `claude/proving-ground`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/08-share-card/`):

- `npm test`: exit 0. 115 test files pass (1 skipped); 1,891 tests pass (21 skipped), with the 6 new tests in `face.test.ts` (the diagram: each square kind and a line, "only sometimes" for "steps 2" and "also moves like", the bridges, the icon or the disc, the squares; the face: the name, the figure, a seal and a sentence for each rule, the worth and the band word, no control). Log: `npm-test-2.log`, the run with this ticket text; `npm-test-1.log` is the run before the text (exit 0). `npm-test-0.log` is a run before a fix of the test's sentence order (exit 1, 1 test failed).
- `npm run check:browser proving-ground`: passes three times (54.7 s, 55.1 s, 54.8 s), with the new groups `shareSheet`, `linkCard` and `reachPopover`. Logs: `pg-1.log` to `pg-3.log`, and each run's `check-N.proving-ground.log` ("proving-ground: all groups pass"). The check's own renders: `check-1/share-sheet-1440x900.png`, `share-sheet-390x844.png`, `link-card-1440x900.png`, `link-card-390x844.png` and `reach-popover-1440x900.png`.
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5183/ /private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/08-share-card/w14` makes 84 renders with 0 faults (`w14-capture.log`), with the new states `share`, `phone-share`, `link-card`, `phone-link-card` and `reach-popover`.
- Beside the mockup, at 1440 × 900 and 390 × 844 (the mockup on the left, the W14 render on the right): `side-share-*.png`, `side-phone-share-*.png`, `side-link-card-*.png` and `side-phone-link-card-*.png` (B's `card-paladin` on the desktop and `phone-card` on the phone), and `side-reach-popover-*.png` (A's `open` with the pointer on the Paladin).
- The old Workshop does not use the changed files (`marks.ts`, `why.ts`), so this ticket does not run its check.

Changes from the ticket, each with its reason:

1. `faceHtml(d, verdict, art)` has a third parameter: the figure's image. The figure comes from `figureOf`, which reads the app's art, so `face.ts` stays pure and its tests give a fixed path.
2. A design from a link is no longer read only on the board. Ticket 01 kept it read only (`editable()`: no brush, no pen, no look row, no rule changes). Plan step 4 says that the first edit keeps a copy, as for a pool piece, so `editable()` and its uses are removed. The `link` group lost one assertion (see the commit's `Removed-check` trailers).
3. The first edit of a link design keeps its name when the shelf does not have it, else it gets the next free number ("Rook Rider 2"). This is the rule of Make a copy (ticket 07, change 7).
4. The diagram draws "steps 2" (the Pawn's second square) and the squares and lines of "also moves like" as "only sometimes" (stitched), as `designPattern` in mockup B (`binder-and-table.html:776`) does. A painted square stays as it is.
5. Each seal has the full sentence of `ruleText`, as the ticket says. Mockup B's card has short words ("passes its own pieces"). The pill words are underlined in gold ink, as in the mockup.
6. The sheet titles are "Share this piece" and "A shared piece". The link sheet's note is "It opens read only. Keep a copy to change it." The ticket names no title.
7. On the phone (under 1000 px), the face has the diagram on the left and the name and the figure on the right, as B's `phone-card`. There the name wraps to two lines.
8. A sheet with a face is as tall as the screen less 16 px on each side, and its buttons stay at its foot, on a footer with a line. So the buttons are in view at 390 × 844 with 3 rules.
9. The band word is in ink, also for a "too weak" or "overpowered" band. The word gives the warning (decision 13); red on a card face looked like an error.
10. Each button of the Share sheet closes the sheet first, and the focus goes back to Share (on the phone, to ⋯). Send link: a cancel on the device does nothing; a device share that fails copies the link. Esc and × on the link sheet show the design on the board, as "Open on the board".
11. The reach popover also shows for the shelf designs, not only the pool pieces. It is hidden from screen readers (`aria-hidden`), because the slot keeps its name. It hides when the Workshop opens again.
12. W14: `phone-share` is the longest card (My Paladin from Make a copy, 3 rules) on a device with no share, and `phone-link-card` is a link to a piece with 3 rules. Each renders at both sizes, as each W14 state does. The state `link` now clicks "Open on the board".

Open problems:

- The owner has not seen the renders (the last Verification box).
- Mockup B shows the card beside the board in the editor; this build shows the face in a sheet (Share and a link). The renders compare the face only.
- The worth is computed on the friend's device (the Risk above).
- The figure in a face is blank until its image loads.

