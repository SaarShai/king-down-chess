# A game with cards plays under the balanced readings

Type: task
Status: ready-for-human

Owner decision 188 (2026-11-22, "Yes, one reading"): one rule reading for cards in all games.

## Change

- `src/match/worker.ts` `create`: a setup with a hand or a powered king gets `POWERS_BALANCED`. Before, only a powered king did.
- `src/online/launch.ts` `fresh` (the solo hand-over): the same rule.
- `src/match/service.ts` `newGame`: `readings` is `POWERS_BALANCED` when the options have cards or king powers. A game with no options has no hand (`createSchema`, `src/match/protocol.ts`), so `start` does not change. `category` does not change; no code reads it.
- `tools/fixtures/shared-mechanics.ts`: the card rows Freeze, Ice Wall, Strike, Haste and "Cards × powers off" now hold the balanced readings. The card render tests build their rules as the worker does.
- The solo page (`rulesOf`, `src/interface/play/saved.ts`) already gives the balanced readings to each game type but `pieces`.

## Engine identity

The change gives the match worker a new identity, `e97592e3`. `npm run plugin:archive:runtime` published `engines/e97592e3….mjs` and its fixture save. A game saved under `e58d7d37` keeps its engine: `loadMatch` runs it on `engines/e58d7d37….mjs` with its printed readings. A setup pinned to `e58d7d37` before the release starts on that bundle (`createPinnedMatch`), so its stored `readings: null` stays true. The release `engines` stage must see both pairs.

## Evidence

`src/match/one-reading.test.ts`: a new cards-only match has the balanced flags (red before the change); the solo page, the worker and the hand-over give equal flags for the four game types; a cards-only save made on `e58d7d37` (`src/match/fixtures/cards-only-e58d7d37.save.json`: Freeze ends the turn, then a pawn's Strike captures) loads, replays and continues with its printed flags, and the current worker refuses it with `MATCH_INCOMPATIBLE`.
