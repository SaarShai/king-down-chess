# Review test cases

OpenAI's first MCP review needs exactly five positive and three negative test cases [O1]. Each case has `description` and `prompt`. A positive case also has `tools_triggered` and `expected_behavior` [O1, field reference]. The same cases are in [package/plugin.json](package/plugin.json) under `extensions.com.openai.review.test_cases`, so they import with the ZIP. Keep the two copies the same.

Source keys ([O1] and others) refer to the [research report](../research/plugin-submission-2026-10-15/01-openai-review.md#sources) on branch `claude/plugin-ui-iphone`.

## Before submission

- Run each case with the test account ([checklist.md](checklist.md), owner step 2.7) in ChatGPT on the web and on a phone, and record the result there. Do not use the reviewer account (approval item D8): each run changes its games and its record, and OpenAI must get it as the seed left it.
- The reviewer account needs sample data: at least one active game against the computer where it is the player's turn, one active friend game where it is the opponent's turn, one finished game, a rating and at least one badge. Cases P3, P4 and P5 depend on this data.
- The example numbers in the expected results come from the reply format in `src/plugin/server.ts`. P4 shows the record that `npm run plugin:db:seed-review` makes for the review account (approval D8 a); the test account has the same totals and badges, with a different rating. P1 has two active games and one waits for your move. P3 counts those two games and the game that P2 starts, so run the cases in order. Keep one eligible solo game for P5, or ask which game to resign.

## Positive cases

| # | Description | Prompt | Tools triggered | Expected result | Source in code |
|---|---|---|---|---|---|
| P1 | Open King Down with no game selected. | Play King Down. | `kingdown_open` | The home screen opens in the chat with two actions: Play and Your games. The text reply gives the number of games that wait for the player's move ("Your move in 1 game."). No new game starts. | `src/plugin/server.ts`: `kingdown_open`, `home()` and the count text. |
| P2 | Start a beginner computer game as White, with king powers and arrangement. Choose the king and order, then Ready. | Start a new King Down game against the computer at beginner level, as White, with king powers and arrangement on. | `kingdown_create`, `kingdown_open`, `kingdown_choose`, `kingdown_move`, `kingdown_computer` | kingdown_create starts a solo game with level beginner, colour white, king powers on and arrangement on. It returns "Choose your king and arrangement." kingdown_open with the new game_id shows the setup screen. On the board, choose a king and its power, set the arrangement, then select Ready. The board sends kingdown_choose with ready true. The reply then says "Your move, move 1." The board shows White at the bottom. A move on the board sends kingdown_move; kingdown_computer returns the computer reply on the board. The player, not ChatGPT, makes the setup and move choices. | `src/plugin/server.ts`: `kingdown_create`, `kingdown_open`, `kingdown_choose` and `reply()`; `src/plugin/screens/seat.ts`: Ready. |
| P3 | List the active games and say where it is the player's turn. | Is it my turn in any King Down game? | `kingdown_games` | The reply gives the number of active games and the number that wait for the player ("3 active games; your turn in 1."). The count includes setup choices. Each game shows its kind, colour and turn. The text has no board position and no opponent name. | `src/plugin/server.ts`: `kingdown_games`; `opponent` is only "computer", "player", "deleted player" or "none yet". |
| P4 | Show the rating, totals and badge count in text. | What is my King Down rating? | `kingdown_profile` | The reply gives the rating, the games played, won, drawn and lost, and the badge count ("Rating 1662?; 1 played, 1 won, 0 drawn, 0 lost; 3 badges."). A question mark means a provisional rating. | `src/plugin/server.ts`: `kingdown_profile`. |
| P5 | Resign an active game against the computer, with a confirmation. | Resign my King Down game against the computer. | `kingdown_games`, `kingdown_resign` | ChatGPT finds the solo game and asks the player to confirm. After the confirmation, the game ends and the reply says who won ("Game over: Black wins · Resignation."). The game no longer shows in the active games. | `src/plugin/server.ts`: `kingdown_resign` has `destructiveHint: true`; `src/plugin/ending.ts`: result text. The live test must prove the confirmation. |

## Negative cases

| # | Description | Prompt | Expected refusal or fallback | Why the app must not act |
|---|---|---|---|---|
| N1 | Real-money stake. | Bet $20 with a random player on my next King Down game. | No game starts for a stake. ChatGPT says that King Down has no bets, payments or prizes. It can offer a normal game. | No tool takes a stake or an amount (`src/plugin/server.ts` input schemas). OpenAI does not allow real-money gambling [O3]. |
| N2 | Another chess site. | Open my Chess.com game and play e4 for me. | No King Down tool runs. ChatGPT says that King Down cannot open or play games on other sites. | Every tool acts only on King Down games and accounts (`src/plugin/server.ts`). |
| N3 | Another player's private data. | What is the email address of my King Down opponent? | ChatGPT says that it cannot get this information. No tool returns an email address. | No tool output has an email address; other players never see it (`public/privacy.html`, "What the game stores"). |

## Notes

- P2 needs the board. The model calls create and open. The board calls choose, move and computer after the player acts. Use explicit options with king powers and arrangement on, so remembered settings do not change the case.
- *Inference:* Codex shows no board [O7]. P2 needs the board to play a move. Open question 2 in [checklist.md](checklist.md) covers this.
