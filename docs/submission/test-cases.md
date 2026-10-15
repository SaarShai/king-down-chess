# Review test cases

OpenAI's first MCP review needs exactly five positive and three negative test cases [O1]. Each case has `description` and `prompt`. A positive case also has `tools_triggered` and `expected_behavior` [O1, field reference]. The same cases are in [package/plugin.json](package/plugin.json) under `extensions.com.openai.review.test_cases`, so they import with the ZIP. Keep the two copies the same.

Source keys ([O1] and others) refer to the [research report](../research/plugin-submission-2026-10-15/01-openai-review.md#sources) on branch `claude/plugin-ui-iphone`.

## Before submission

- Run each case with the reviewer account (approval item D8) in ChatGPT on the web and on a phone. Record the result in [checklist.md](checklist.md).
- The reviewer account needs sample data: at least one active game against the computer where it is the player's turn, one finished game, a rating and at least one badge. Cases P3, P4 and P5 depend on this data.
- The example numbers in the expected results ("2 active games; your turn in 1") come from the reply format in `src/plugin/server.ts`. Replace them with the real numbers of the seeded account.

## Positive cases

| # | Description | Prompt | Tools triggered | Expected result | Source in code |
|---|---|---|---|---|---|
| P1 | Open King Down with no game selected. | Play King Down. | `kingdown_open` | The home screen opens in the chat with two actions: Play and Your games. The text reply gives the number of games that wait for the player's move ("Your move in 1 games."). No new game starts. | `server.ts:95–108`: with no `game_id`, the tool returns `home()`; the text is `Your move in ${count} games.` |
| P2 | Start a new game against the computer, beginner level, as White. | Start a new King Down game against the computer at beginner level. I want to play White. | `kingdown_create`, `kingdown_open` | `kingdown_create` starts a solo game. The reply says "Your move, move 1." `kingdown_open` with the new `game_id` shows the board, White at the bottom. A move on the board gets the computer's reply on the board. | `server.ts:109–114` (create), `63–75` (reply text). Only `kingdown_open` carries the board resource (`server.ts:54–56`). |
| P3 | List the active games and say where it is the player's turn. | Is it my turn in any King Down game? | `kingdown_games` | The reply gives the number of active games and the number that wait for the player ("2 active games; your turn in 1."). Each game shows its kind, colour and turn. The text has no board position and no opponent name. | `server.ts:123–130`; `opponent` is only "computer", "player", "deleted player" or "none yet". |
| P4 | Show the rating, totals and badge count in text. | What is my King Down rating? | `kingdown_profile` | The reply gives the rating, the games played, won, drawn and lost, and the badge count ("Rating 1500?; 3 played, 1 won, 1 drawn, 1 lost; 2 badges."). A question mark means a provisional rating. | `server.ts:179–183`. |
| P5 | Resign an active game against the computer, with a confirmation. | Resign my King Down game against the computer. | `kingdown_games`, `kingdown_resign` | ChatGPT finds the solo game and asks the player to confirm. After the confirmation, the game ends and the reply says who won ("Game over: Black wins · Resignation."). The game no longer shows in the active games. | `server.ts:154` (`destructiveHint: true`, so ChatGPT asks first); `src/plugin/ending.ts` (result text). |

## Negative cases

| # | Description | Prompt | Expected refusal or fallback | Why the app must not act |
|---|---|---|---|---|
| N1 | Real-money stake. | Bet $20 with a random player on my next King Down game. | No game starts for a stake. ChatGPT says that King Down has no bets, payments or prizes. It can offer a normal game. | No tool takes a stake or an amount (`server.ts` input schemas). OpenAI does not allow real-money gambling [O3]. |
| N2 | Another chess site. | Open my Chess.com game and play e4 for me. | No King Down tool runs. ChatGPT says that King Down cannot open or play games on other sites. | Every tool acts only on King Down accounts (`openWorldHint: false`, `server.ts:55`). |
| N3 | Another player's private data. | What is the email address of my King Down opponent? | ChatGPT says that it cannot get this information. No tool returns an email address. | No tool output has an email address; other players never see it (`public/privacy.html`, "What the game stores"). |

## Notes

- *Inference:* P2 can also run as one `kingdown_create` call if ChatGPT does not open the board. Check this in the live test; if the board does not open, change the expected tools to the real sequence.
- *Inference:* Codex shows no board [O7]. P2 needs the board to play a move. Open question 2 in [checklist.md](checklist.md) covers this.
