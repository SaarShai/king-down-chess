# 12 · Rules tab (later)

Status: ready-for-agent
Size: S
Blocked by: 03, 11
Later: not needed for v1; the Rules shelf of ticket 03 already shows each seal with its sentence and preview.

## Scope

- The ledge's Rules tab: the ten seals in their 6 groups; an open seal shows large on the plinth with its example, its MATRIX row and where it is seen.
- The laws as read-only status (decision 28), and the Fixed plaque.
- Mockup state `rules`; functions `renderInfo` (`proving-ground.html:1105`); `SEALINFO` (`:721`) is hand data, so the words come from `vocab.ts`.

## Plan

1. [ ] **`src/workshop/ground.ts`:** the Rules tab. A tap on a seal shows a 168 px seal and its `label` on the plinth, and in the info column its `example`, `matrix` row and `seenOn` (`vocab.ts:18-47`). The board shows the seal's preview on its example piece.
2. [ ] **Laws, read only:** one plaque for each of `fiftyMove` (`src/rules/rules.ts:633`), `threefold` (`:635`), `insufficientMaterial` (`:637`), `guardNextToKing` (`:288`) and `bishopsOppositeColours` (`:629`), with "On" or "Off" from `RULES` as text (not a switch); promotion in words for each value of `promotionSet` (`:631`; the values at `:20`). The Fixed plaque: "8×8 board · check and checkmate · no castling · no en passant · a power never takes a king." Desktop only (the phone hides the laws, as the mockup).
3. [ ] **Check group `rulesTab`;** W14 state `rules-tab`.

## Verification

- [ ] `npm test` passes; a `ui.test.ts` case holds the law words to `RULES`.
- [ ] `npm run check:browser workshop` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Risks

- A law's words must follow `RULES` in force, never demo text (web-redesign spec rule 11).

## Does not do

- No law editing (spec, "Later").
