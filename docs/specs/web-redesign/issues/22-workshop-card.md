# 22 · The Workshop card

Status: done on claude/wr-b2ux-ws; batch 2 fixes decided by delegation (2026-10-09)
Blocked by: none (the Workshop finish tickets 01–13 are resolved on main)

## Scope

- Owner choice: Workshop sharing A, card: custom pieces travel as cards. This stays in, outside the sharing park. The Workshop surround stands on the floor from ticket 01.
- Demo: `future-workshop-share` option A (`demo.js` 77–102 the card, 357 the read-only note; renders `card-*`, `received-*`, `share-*`).
- Files: new `src/workshop/card.ts`; `src/workshop/dialog.ts` (the design link view, the Share sheet, the shelf tiles); `src/workshop/art.ts`, `text.ts`, `judge.ts` (reuse); `src/workshop/workshop.css`; `docs/WORKSHOP.md`; `tools/verify-workshop.mjs`, `tools/verify-workshop-cast.mjs`.

## Plan

1. [x] Reuse the editor card and its 7×7 grids: the figure, the name, a read-only move diagram (move, take and shot marks; slide lines as arrows to the edge; "Forward ↑"), the move and take sentences, up to 3 rule sentences, the worth word large and the editor’s pawn worth line.
2. [x] The design link view: the card, the line "Read only. Keep a copy to change it. It plays on the test board, not in games.", Keep a copy and Try it, in place of the disabled editor.
3. [x] The Share sheet: the card on top with "Your friend opens this card. It opens read only.", then Send link (main), Copy link, Copy as text. Make a copy and Delete stay.
4. [x] Your designs: mini cards (the figure, the name, the worth word).
5. [x] The editor keeps its own card and its reactions (`.ws-model`, `.ws-fig` stay where a reaction plays).

## Verification

- [x] `src/workshop/ui.test.ts`: the diagram size and marks; every band word; the pawn words.
- [x] `workshop` and `workshop-cast` checks: the Share sheet with the card; a design link opens the read-only card; Keep a copy; the mini-card shelf; at 320×568, 390×844 and 1440×900 the band word is not cut; the reactions still play.
- [x] `npm test` (with the docs tests on `WORKSHOP.md`) and `npm run check:browser` pass.
- [x] Rendered sample at those three sizes: the card read-only, the Share sheet, the shelf. Ask the owner about two parts of the chosen demo that this ticket does not build: "start from a working sample" and the "What changed" line. The sample waits for the owner’s yes.

## Risks

- Long band words ("Possibly overpowered") at 320 px.
- The worth is computed on the friend's device; a later judge can give another word.

## Does not do

- No chat preview picture (it needs a server). No "start from a working sample" and no "What changed" line until the owner answers at the sample.

## Comments

The editor, link view and Share sheet use one card renderer and the same grid marks.
Links have no edit controls. Keep a copy opens the editor. Try it saves nothing.
Shelf tiles show the full worth word. The editor keeps its reactions.
The fast plan cuts a new renderer. The editor’s 7×7 grids and pawn words stay.
Typecheck passes. Tests: 1,445 pass, 13 skip. Scene tests: 50 pass.
Browser checks: all 15 pass. Workshop and cast each pass two repeat runs.
Sample W12: 12 renders, no faults. All three contact sheets pass the visual review.
The capture tool adds W12 and 320 px; the old review keeps its five sizes.
The sample waits for the owner’s yes. The working sample and “What changed” questions stay.

Batch 2 fixes: decided by delegation (2026-10-09).
Shelf names use two lines; copy names stay distinct.
The shelf and New piece share a column; tiles are at least 120 px wide.
Share actions stay in a fixed footer; Close has a framed 44 px target.
Small figures are 72 px; Forward and save text are at least 12.5 px.
Band colours and warning marks match; devices without Share show one Copy link.
Read-only actions stay under the card on wide screens.
Tests: 1,514 pass, 13 skip. Scene tests: 50 pass. Typecheck and build pass.
Browser checks: workshop, workshop-cast and visual-design pass.
W12: 24 renders, zero faults; each render passes the visual check.
