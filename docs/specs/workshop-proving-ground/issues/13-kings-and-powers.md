# 13 · Kings tab and powers (later)

Status: ready-for-agent
Size: M
Blocked by: 06, 11
Later: not needed for v1; a designed piece cannot use a power until ticket 16, so this is a preview on pool pieces only.

## Scope

- The ledge's Kings tab: six kings; an open king shows his two powers as coins with their words.
- Try with gets the King socket: seat a king, arm one power, see and play its marks on an unchanged pool piece (decision 31).
- Echo: a power that adds nothing shows "=".
- Mockup states `kings`, `rook-leap`, `frost-power`, `echo`; functions `kingWalk` (`proving-ground.html:1879`), `tapPower` (`:1889`).

## Plan

1. [ ] **`src/workshop/powers.ts` (new), in the Workshop chunk** (not in `rules.ts`, so the plugin page does not change):
   - `withRules(over, fn)`: copy `RULES` (`src/rules/rules.ts:761`), `setRules(over)` (`:820`), run `fn`, then `Object.assign(RULES, copy)` in `finally`, in one turn (decision 32).
   - `powerMarks(pos, king, power)`: in `withRules({ ...POWERS_BALANCED, kings: [{ king, power }, null] }, …)`, `legalMoves(pos)` (`engine.ts:1862`) filtered by `m.power === POWER_TAG[power]` (`src/powers-ui.ts:109-112`). An always-on power has no tagged move: its marks are the diff of the moves with and without it (the method of `why.ts`). No diff is an echo.
2. [ ] **`src/workshop/ground.ts`:**
   - Kings tab: the six `KINGS` (`rules.ts:154`) with their art (`public/ui/kings/`); the open king: "<NAME> KING", the figure on the plinth, and in the info column his two powers, each with the game coin (`src/ui/coin.ts:5`) and `powerText` (`powers-ui.ts:17`). No mini boards (decision 29).
   - King socket in the tray: "SEAT A KING" with the six kings; the king stands on b1 (as the scenes). The socket shows his two coins with notches (`coinState`, `powers-ui.ts:163`; `usesLeft`, `:196`). A tap arms one power (one power per king). Power marks have the power edge colour and the emblem stamp. A tap on a power mark plays it with `makeMove` and spends a notch; with none left, "No <Power> uses left." Freeze shows frost with a turn count (`Position.marks`).
   - On a copy or a new piece, the socket says "Powers work on the pool pieces for now." with `aria-disabled`.
   - Echo: the coin shows "=" and "<Power> adds nothing to the <Piece>. No mark changes."
3. [ ] **Tests:** `src/workshop/powers.test.ts` (new): `RULES` is the same before and after `withRules`, also when `fn` throws; the `rook-leap` marks equal G22 (`scenes.js:367`); Leap on the Paladin is an echo; Freeze on the `frost-power` board.
4. [ ] **Check group `kings`;** W14 states `kings`, `rook-leap`, `frost-power`, `echo`.

## Verification

- [ ] `npm test` passes, with `powers.test.ts`.
- [ ] `npm run check:browser workshop powers` passes (`workshop` three times).
- [ ] W14 renders at 1440 × 900 and 390 × 844; the owner sees them before the merge.

## Risks

- The open game shares `RULES`; each preview must put it back in the same turn.

## Does not do

- No powers on designed pieces (16). No "Also changed by" row (spec, "Later").
