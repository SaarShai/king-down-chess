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

1. [ ] **`src/workshop/marks.ts`:** port `diagram()` (`marks.js:923`), the 7 × 7 reach diagram, with its tiles from `legend.ts`.
2. [ ] **`src/workshop/face.ts` (new), pure:** `faceHtml(d, verdict)`: the figure, the name, the diagram, up to 3 seals with their sentences (`ruleText`, `text.ts:91-98`), the worth ("About N pawns") and the band word. No control in the face. The old `card.ts` stays for the old Workshop until ticket 11.
3. [ ] **Share sheet** (the top bar's Share; ⋯ on the phone): the face on top with "Your friend opens this card. It opens read only.", then Send link (`navigator.share`), Copy link and Copy as text (`designText`, ticket 07). With no device share, one Copy link (as web-redesign ticket 22). Copy by hand on a refusal (ticket 02).
4. [ ] **Link view:** `openDesign(code)` shows the face with "Keep a copy" (saves it, as `keepCopy`, `dialog.ts:688-693`, then opens it on the board) and "Open on the board" (the board, read only; the first edit keeps a copy, as for a pool piece). A bad code keeps the toast of ticket 01.
5. [ ] **Reach popover:** hover or focus on a ledge figure shows a 96 px `diagram()` over it (desktop only).
6. [ ] **Tests:** `src/workshop/face.test.ts` (new): the diagram marks each square kind; the seals and sentences; the worth and band words; no `<button>`, `<input>` or `<select>` in the face.
7. [ ] **Check groups:** `shareSheet` (with and without device share), `linkCard` (link → face → Keep a copy → board → "Yours"; link → Open on the board → first edit → a copy), `reachPopover`.
8. [ ] **W14 states:** `share`, `link-card`, `reach-popover`, `phone-share`, `phone-link-card`.

## Verification

- [ ] `npm test` passes, with `face.test.ts`.
- [ ] `npm run check:browser proving-ground` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844, beside B's card face in `binder-and-table.html`.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The worth is computed on the friend's device; a later judge can give another word (as ticket 22).

## Does not do

- No card back. No chat preview picture (it needs a server). No See all grid (15).
