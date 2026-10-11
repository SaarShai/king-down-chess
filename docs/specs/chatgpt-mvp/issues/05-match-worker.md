# 05 · Match worker: the open card deal, Classic and the computer levels

Status: ready-for-agent
Type: AFK
Size: M
Blocked by: 03

## Scope

- Accept a public mirror deal in the match setup (the same hand for both sides; no piles). The snapshot keeps the hands and the played-card state. Keep the refusal for any other hand or pile.
- Accept the classic flag of ticket 03; the FEN input check accepts castling and en-passant fields when it is on.
- `chooseMove` takes a level (`beginner`, `casual`, `club`, `strong`) and applies the website's skill settings (`src/ai/skill.ts`: time cap, temperature, random-move chance), with all searches under the 30-second function limit.
- The computer plays cards in card games (the search supports it).
- Saves and replay keep working; a new engine bundle goes into `engines/`.

## Acceptance

- Worker tests: a card game plays a card and replays from its save; the hand shows in the snapshot; a private hand is still refused; a classic game castles and replays; each level returns a legal move within its cap.
- With the classic flag on, the worker accepts a canonical FEN with castling rights and an en-passant square (`… w KQkq -`, `… b - e3`); with it off, it still refuses them (that test exists in `src/match/match.test.ts`). With a Mercy king, a classic game plays `O-O` through the worker and through `chooseMove`, and a reload replays it (review of ticket 03, findings 1 and 4).
- Ticket 04's toggle-mix test (`src/match/setup.test.ts`, "builds a game the match module starts for each toggle mix") passes the cards mix and the classic mix to `createMatch` with `buildSetup`'s `hand` and `classic` in the match setup, and asserts that the snapshot shows the hand and that the classic game can castle (review of ticket 04, finding 2).
- `npm test`, `npm run plugin:build`, `npm run plugin:smoke` pass.

## Notes

- Explorer note C §6.5, §7, §8; note A §5. The refusal: `src/match/worker.ts` ("Private card data unsupported").
