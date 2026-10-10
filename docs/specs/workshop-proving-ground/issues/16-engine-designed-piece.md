# 16 · Engine: the designed-piece case (later)

Status: ready-for-agent
Size: M
Blocked by: none
Later: not needed for v1; A works on the Try board with `movesOf`, and a design in real games is a separate owner choice (spec, open decision 1).

## Scope

- One designed piece per game plays by the engine (`REVIEW.md` §6 item 4).
- The design uses the type slot of the Templar (`T` = 15, `src/rules/engine.ts:19`) only while a new rule, `RULES.design`, is set. The Templar is paused and rejected (`docs/MATRIX.md:69-84`), so a game never needs both. With `RULES.design` null, nothing changes.
- One move interpreter: the body of `movesOf` moves into the engine; the Workshop calls it.
- Why the slot and not a type 16: the 4 type bits are full; a fifth bit moves the colour and `SPENT` bits and touches FEN, Zobrist (`SLOTS`, `src/ai/zobrist.ts:39`), the NNUE input (`src/ai/nnue/net.ts:103`), the reserve index and the value tables.

## Plan

1. [ ] **`src/rules/design.ts` (new):** `DesignSpec` (the canonical squares, lines and rules; the types move from `src/workshop/model.ts`, which re-exports them; "moves like" expands when the spec is made). `genDesigned(board, from, mode, out, spec, refused?)`: the body of `movesOf` (`src/workshop/moves.ts:48-134`) with the modes (`attacks`: first-level takes and shots only; `captures`: no quiet moves) and `canCapture` (`engine.ts:406-433`) in place of `takes()`. History Whens read `SPENT` on the byte.
2. [ ] **`src/rules/rules.ts`:** `design: DesignSpec | null` (default null); `parseRule('design=…')`; `setRules` (`:820-832`) refuses a spec that breaks `limit()`. The balance schema holds the rule keys: add a `design` entry to `RULE_DIMENSIONS` (`src/balance/schema.ts:96`), or `src/balance/schema.test.ts:22` and `:109` fail; `sourceContract` (`src/balance/design.ts:301`) reads the new `Rules` field from the source, so `npm run balance:check` must pass too.
3. [ ] **`src/rules/engine.ts`:**
   - `case T` in `genPieceRaw` (`:827`): `if (RULES.design) return genDesigned(...)`.
   - `canCapture` (`:406-433`): a design attacker with an "always" `cannotTake`; a design victim with an "always" `cannotBeTaken`.
   - The shelter seam (`:455-486`): a design victim whose `cannotBeTaken` When reads its square becomes a shelter level; `isAttacked` mirrors it.
   - `isAttacked` (`:1141-1227`): turn off the two Templar terms (`:1161`, `:1217`) while `RULES.design` is set; add a forward test with `genDesigned(..., 'attacks')`.
   - `landed` (`:965-969`): set `SPENT` when a design takes and a rule reads it (`afterFirstCapture`, `firstTake`).
4. [ ] **`src/rules/setup.ts`** `toFen` (`:92`), `fromFen` (`:167`): a letter for a spent design (`H` is the spent guard).
5. [ ] **`src/ai/eval.ts`:** `VAL[T]` and `VALUES[T]` from the judge worth through `setPieceValues({ T })` (`:130`) in the worker after `setRules`; turn off `TEMPLAR_ON_CAPITAL` (`:513`) for a design.
6. [ ] **`src/workshop/moves.ts`:** `movesOf` becomes a thin call of `genDesigned`; `moves.test.ts` keeps it equal to the pool pieces.
7. [ ] **Version 1 limits:** one design per game; `fromMove`, `beforeMove` and `afterCard` are refused with a reason.

## Verification

- [ ] `npm test` passes, with no change in: the balance schema tests (`src/balance/schema.test.ts`) other than the new `design` key; `npm run balance:check` passes; perft 20, 400, 8902 (`src/rules/rules.test.ts:22-28`); `crossCheckAttacks` (`:228-255`); the Templar tests; `src/ai/legality.test.ts`; `src/ai/search.test.ts`; the power and card tests.
- [ ] New tests: with `RULES.design` set to each preset, `genPiece` of `T` equals the pool piece in all three modes on 500 random boards; perft parity with the queen as `T`; `crossCheckAttacks` with seeded random designs; `legality.test.ts` with a design; a design gives mate, and a design that cannot take a king never gives check; a FEN round trip with a spent design.
- [ ] `npm run check:browser plugin-ui` and `plugin-ui-http` pass (by name); the plugin page size before and after (`engine.ts` and `rules.ts` are in the plugin page, web-redesign spec rule 5). Stop and ask at 4,350,000 bytes.
- [ ] No game run without the owner's go.

## Risks

- Low for the shipped game: each new path is behind `RULES.design !== null`. Medium inside design games: the attack mirror, chain branching, the evaluation.

## Does not do

- No UI to play a design (17). No second design slot. No ranged lines.
