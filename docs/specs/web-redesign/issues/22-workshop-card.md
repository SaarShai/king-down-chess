# 22 · The Workshop card

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: none (the Workshop finish tickets 01–13 are resolved; confirm that they are on main first)

## Scope

- Owner choice: Workshop sharing A, card: custom pieces travel as cards. This stays in, outside the sharing park. The Workshop surround stands on the floor from ticket 01.
- Demo: `future-workshop-share` option A (`demo.js` 77–102 the card, 357 the read-only note; renders `card-*`, `received-*`, `share-*`).
- Files: new `src/workshop/card.ts`; `src/workshop/dialog.ts` (the design link view, the Share sheet, the shelf tiles); `src/workshop/art.ts`, `text.ts`, `judge.ts` (reuse); `src/workshop/workshop.css`; `docs/WORKSHOP.md`; `tools/verify-workshop.mjs`, `tools/verify-workshop-cast.mjs`.

## Plan

1. [ ] One card renderer: the figure, the name, a read-only move diagram (move, take and shot marks; slide lines as arrows to the edge; "Forward ↑"; 5×5 or 7×7 by the reach), the move and take sentences, up to 3 rule sentences, the worth word large and "Estimated worth: about N pawns".
2. [ ] The design link view: the card, the line "Read only. Keep a copy to change it. It plays on the test board, not in games.", Keep a copy and Try it, in place of the disabled editor.
3. [ ] The Share sheet: the card on top with "Your friend opens this card. It opens read only.", then Send link (main), Copy link, Copy as text. Make a copy and Delete stay.
4. [ ] Your designs: mini cards (the figure, the name, the worth word).
5. [ ] The editor keeps its own card and its reactions (`.ws-model`, `.ws-fig` stay where a reaction plays).

## Verification

- [ ] `src/workshop/ui.test.ts`: the diagram size and marks; every band word; the pawn words.
- [ ] `workshop` and `workshop-cast` checks: the Share sheet with the card; a design link opens the read-only card; Keep a copy; the mini-card shelf; at 320×568, 390×844, 568×320, 768×1024 and 1280×900 the band word is not cut; the reactions still play.
- [ ] `npm test` (with the docs tests on `WORKSHOP.md`) and `npm run check:browser` pass.
- [ ] Rendered sample at those five sizes: the card read-only, the Share sheet, the shelf. Ask the owner about two parts of the chosen demo that this ticket does not build: "start from a working sample" and the "What changed" line. The owner's yes, with the date, in Comments.

## Risks

- Long band words ("Possibly overpowered") at 320 px.
- The worth is computed on the friend's device; a later judge can give another word.

## Does not do

- No chat preview picture (it needs a server). No "start from a working sample" and no "What changed" line until the owner answers at the sample.

## Comments
