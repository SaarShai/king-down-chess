# 04 · The game setup module

Status: resolved
Type: AFK
Size: M
Blocked by: none (it names the classic flag of ticket 03 as an option field; ticket 05 maps it)

## Scope

A new pure module, the core of the toggles (spec "Modules: Game setup"). No database, no UI.

- `Options`: `fairy`, `pool` (piece kinds), `arrangement`, `classic`, `cards`, `cardPool` (card names), `kingPowers`. A schema (zod) and `validate(options)`: the rules in spec Q7, Q19, Q20 (at least 7 pool letters with the counts of `POOL`; no K or P; at most one G and one S; at least 4 cards from the 21 of Q20; Classic only with Fairy off; Arrangement only with Fairy on). `DEFAULT_OPTIONS` = spec Q26.
- `draw(options, rng)`: the army (7 pool pieces + the king, through `randomBackRank`, the same for both sides; with Fairy off and Classic off the pool is `QRRBBNN`; with Classic, `RNBQKBNR`) and the deal (4 cards, the same for both, or none).
- `seatChoicesNeeded(options)`: `{ king: boolean, order: boolean }`.
- `validateChoice(options, draw, choice)`: an order with the same 8 letters, one king, bishops on opposite colours, the guard next to the king (port `arrangementError` and `randomArrangement` from branch `claude/arrange-mode`, `src/rules/setup.ts`, and add the guard check); a king with one of its two powers; with cards, only the always-on powers.
- `defaultChoice(options, draw, seat, rng, computer)`: Spirit/Mercy for White, Shadow/Darkness for Black (powers on), the drawn order (or a random legal order for a computer).
- `buildSetup(options, draw, [white, black])`: the match setup: `backRank` when the orders are equal, else a canonical FEN; the `kings` string (`none` when powers are off); the classic flag; the hands.

## Acceptance

- Unit tests (seam 2) cover each rule above, the same draw for both sides, seeded draws, and a built setup that `createMatch` accepts for each toggle mix (with ticket 05 merged, add the cards and classic mixes).
- `npm test` passes.

## Notes

- Explorer note C (§2, §4, §5, §6, §11). Kings: `KINGS`, `PLAIN_KINGS`, `parseKings` in `src/rules/rules.ts`; pool: `POOL`, `CLASSIC_CHESS`, `randomBackRank` in `src/rules/setup.ts`.

## Result

- `src/match/setup.ts` (pure, no zod; the page may import it): `Options`, `DEFAULT_OPTIONS`, `POOL_KINDS`, `DEAL_CARDS`, `ALWAYS_ON`, `validate`, `draw`, `seatChoicesNeeded`, `validateChoice`, `defaultChoice`, `buildSetup`.
- `src/match/setup-schema.ts` (server): `optionsSchema` (it runs `validate`) and `choiceSchema`.
- The arrangement check (ported from `claude/arrange-mode`, with the guard check added) lives in `setup.ts`, not in `src/rules/`. So the engine hash and the saved matches do not change.
- `buildSetup` returns `{ match, classic, hand }`. `match` is a `MatchSetup` (`backRank` or a canonical FEN, and `kings`, `none,none` with powers off) that `createMatch` accepts today. `MatchSetup` has no field for the classic flag or the hand yet: ticket 05 maps `classic` and `hand` into it.
- Checks: `npm test` passes, 2025 tests (25 new in `src/match/setup.test.ts`, seam 2), 56 skipped.
- Open item: with ticket 05 merged, add the cards and classic mixes to the `createMatch` test with their fields in `match`.
