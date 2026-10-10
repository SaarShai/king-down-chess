# 09 · Short landscape

Status: ready-for-agent
Size: S
Blocked by: 03, 06, 07 (the side sheets hold 03's shelf and sentence card, 05's Why tag and 06's tray)

## Scope

- A layout for a phone held sideways: landscape and at most 500 px high (decision 23). Mockup A has none; today's Workshop has an approved one (`docs/specs/workshop-finish/issues/08-landscape-phone-layout.md`).
- Decided by delegation (owner, 2026-10-09): the board on the left at full height; one column on the right with the plinth strip (seals as buttons), the brush row and the tray; the ledge opens as a sheet from a "Pieces" button; the Why tag, the shelf and the sentence card open as side sheets.

## Plan

1. [ ] **`src/workshop/ground.css`:** `@media (orientation: landscape) and (max-height: 500px)` with the grid above. The board side is the screen height minus the top bar; squares stay 24 px or more.
2. [ ] **`src/workshop/ground.ts`:** the "Pieces" button opens the ledge sheet in this layout; the layout follows a turn of the device with no loss of state.
3. [ ] **Check groups:** `layouts` adds 568 × 320 and 844 × 390 (`noSidewaysScroll`, `insideViewport`, `textNotCut`, `minTarget`: 44 px, and 24 px for squares, nubs and knots); `turnRefits` (portrait to landscape and back keeps the open design, the brush, an open tag and an open shelf).
4. [ ] **W14:** the states `open-pawn`, `paint`, `stamp-preview` (the shelf as a side sheet), `why-d7` and `tray` also at `landscape` (844 × 390).

## Verification

- [ ] `npm test` passes.
- [ ] `npm run check:browser proving-ground` passes three times.
- [ ] W14 renders at 844 × 390, 1440 × 900 and 390 × 844.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- At 568 × 320 the board is about 270 px; the nubs need their 24 px hit areas.

## Does not do

- No change to the wide and narrow layouts.
