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
- `npm test`, `npm run plugin:build`, `npm run plugin:smoke` pass.

## Notes

- Explorer note C §6.5, §7, §8; note A §5. The refusal: `src/match/worker.ts` ("Private card data unsupported").
