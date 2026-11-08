# Muse tool documentation

This file comes from the tool listing of [src/muse/tools.ts](../../../src/muse/tools.ts), through [tools/muse-tool-docs.ts](../../../tools/muse-tool-docs.ts). Do not edit it. After a tool change, run `npm run muse:docs`. The test `tools/muse-tool-docs.docs.test.ts` fails while this file and the listing differ.

The listing is the answer to `tools/list` that each MCP client gets, and so the portal's MCP snapshot.

## Summary

| Tool | Title | Class | Read only | Destructive | Idempotent | Open world | Limit for each account |
|---|---|---|---|---|---|---|---|
| `kingdown_games` | Your games | Read | yes | no | yes | no | none |
| `kingdown_view` | Show a game | Read | yes | no | yes | no | none |
| `kingdown_explain` | Explain a rule | Read | yes | no | yes | no | none |
| `kingdown_new_game` | New game | Write | no | no | yes | no | 60 calls in 60 seconds |
| `kingdown_move` | Play a move | Write | no | no | yes | no | 120 calls in 60 seconds |
| `kingdown_end` | End a game | Write | no | yes | yes | no | none |

The class comes from the read-only hint: a read-only tool is a Read, and each other tool is a Write. No tool is a Sensitive write: no tool sends a message, spends money, or shares data outside King Down. Each tool acts only on the games of the signed-in King Down account. The account comes from the access token, never from a tool field.

## Results

Each result starts with one or two sentences that Muse can speak as they are. Detail lines follow: the board, the choices or a link. `structuredContent` gives the same facts and agrees with the output schema of the tool. No result has a widget or an image.

## Status and retries

Each write tool gives a `result` value:

| `result` | Meaning |
|---|---|
| `played` | Your turn played, and the computer replied in the same call. |
| `computer` | An earlier call stopped before the computer moved. The computer moved now; say your move again. |
| `choices` | The words fit more than one move. The result gives numbered choices with their `move_ids`. Nothing played. |
| `refused` | The words fit no legal move. The result gives the reason and some legal moves. Nothing played. |
| `pending` | The turn has more actions (a king power such as Haste). The result gives the next choices. Nothing played. |
| `changed` | `expected_revision` is not the revision of the game. Nothing changed; the result gives the current state. |
| `ended` | The game ended. |

- `kingdown_move` and `kingdown_end` carry `expected_revision`, the revision of the last result for the game. When it is not the revision of the game, the tool changes nothing and gives the current state (`changed`).
- The server makes the command ID of each write from the game ID, the revision and the actions; `kingdown_new_game` makes it from `request_id`. The game service keeps a receipt for each command ID, so a call that comes again gives the first result. No move plays twice, and no second game starts. Thus each tool has the idempotent hint.
- After a lost reply, send the same call again, or read the game with `kingdown_view` before a new call.

## Errors

A refused call sets `isError`. Its text is one fixed sentence, and its `structuredContent` is `{ "code": "<code>" }`. The text never repeats the input. The text of the game service never goes to Muse; this table gives the sentence for each code of the game service.

| Code | Sentence |
|---|---|
| `STALE_REVISION` | The game changed. Read the game again, then move. |
| `INVALID_MOVE` | This move is not available. Choose another move. |
| `WRONG_TURN` | It is not your turn. |
| `MATCH_TERMINAL` | This game is over. |
| `RATE_LIMITED` | Too many requests. Wait one minute, then try again. |
| `UNAVAILABLE` | The game server is busy. Try again. |
| `NOT_FOUND` | There is no game with this ID. |
| `FORBIDDEN` | You do not have a seat in this game. |
| `INVALID_INPUT` | Invalid input: check the tool fields. |
| `COMMAND_CONFLICT` | This request ID belongs to another request. Use a new request ID. |
| `NOT_ALLOWED` | The game does not allow this now. |
| `MATCH_LIMIT` | This game reached its length limit. |
| `MATCH_INCOMPATIBLE` | This game uses an older version. Play it on the website. |

The connector has more codes, each with its own fixed sentence: `NO_GAME` (no game against the computer), `PERSON_GAME` (the game is against a person; the sentence gives its link), `NOT_STARTED` (the setup of the game is not complete) and `INTERNAL_ERROR` (any other fault; "Could not update the game. Try again."). The server log records the tool name and a fixed error category only.

Before a tool runs, the HTTP edge can refuse the request:

| Status | When | Headers and body |
|---|---|---|
| 401 | No valid King Down access token: a wrong issuer, audience or client, an expired token, or a session that ended. | `WWW-Authenticate: Bearer resource_metadata="https://kingdown.dev/.well-known/oauth-protected-resource/muse/mcp", scope="openid"` |
| 429 | The account has 3 requests in progress. | `Retry-After: 1`, code `RATE_LIMITED` |
| 503 | The server instance has 4 requests in progress, or the sign-in check is not available. | `Retry-After: 1` or `Retry-After: 5` |
| 413 | The body is larger than 128 KiB. | |
| 400 | The body is not JSON, or it is a JSON-RPC batch. | |
| 405 | The method is not POST or OPTIONS. | `Allow: POST, OPTIONS` |

## Rate limits

The server counts each counted call for the account in Postgres (`plugin_tool_tries`) before the tool works, so a refused call also counts. The website uses the same counters for the same actions (`src/api/http.ts`). The reads have no count limit. The limits of the HTTP edge (above) apply to all calls.

| Counter | Tools | Limit for each account |
|---|---|---|
| `kingdown_create` | `kingdown_new_game` | 60 calls in 60 seconds |
| `kingdown_computer` | `kingdown_move` | 120 calls in 60 seconds |

A call over the limit gives code `RATE_LIMITED` and "Too many requests. Wait one minute, then try again."

## Tools

### `kingdown_games`: Your games

Class: Read. Limit for each account: none.

> Lists your unfinished King Down games, your turn first. Each game has its ID, whether it is against the computer or a person, whether it is your turn, the move number, your colour, the computer level and a link to the game on the website. It gives no opponent name.

Side effects: None. It reads the unfinished games of the account.

Input:

None.

Output (`structuredContent`):

| Field | Type | Always given |
|---|---|---|
| `games` | array of objects | yes |
| `games[].game_id` | string | yes |
| `games[].against` | one of `computer`, `person` | yes |
| `games[].colour` | one of `white`, `black` | yes |
| `games[].status` | string | yes |
| `games[].your_turn` | boolean | yes |
| `games[].move` | integer or null | yes |
| `games[].link` | string | yes |
| `games[].level` | string | no |

### `kingdown_view`: Show a game

Class: Read. Limit for each account: none.

> Shows one King Down game. Without game_id, it shows your most urgent game against the computer. A game against the computer gives the status, the last move, the check line, the pieces of each side, a letter grid with its legend, the revision, the FEN, your colour, the number of legal moves and a link. A game against a person gives only its status, the move number and a link.

Side effects: None. It reads one game.

Input:

| Field | Type | Required | Notes |
|---|---|---|---|
| `game_id` | UUID | no | The game, from kingdown_games or an earlier result. Default: your most urgent game against the computer. |

Output (`structuredContent`):

| Field | Type | Always given |
|---|---|---|
| `found` | boolean | yes |
| `game_id` | string | no |
| `against` | one of `computer`, `person` | no |
| `colour` | one of `white`, `black` | no |
| `status` | string | no |
| `your_turn` | boolean | no |
| `move` | integer or null | no |
| `link` | string | no |
| `level` | string | no |
| `revision` | integer | no |
| `fen` | string | no |
| `legal_count` | integer | no |
| `status_line` | string | no |
| `last_move` | string or null | no |
| `check` | string or null | no |
| `white` | string | no |
| `black` | string | no |
| `grid` | string | no |
| `legend` | string | no |
| `ending` | string or null | no |

### `kingdown_explain`: Explain a rule

Class: Read. Limit for each account: none.

> Explains a King Down piece (by name or letter), a square, a king power or a card. Without game_id, it uses your most urgent game against the computer, if any. In a game against the computer, a square names its piece, and your piece also gets the moves it can make now. An unknown topic gives the names of the pieces in play.

Side effects: None. It reads the rules, and the position of a game against the computer.

Input:

| Field | Type | Required | Notes |
|---|---|---|---|
| `topic` | string, 1 to 60 characters | yes | A piece name or letter, a square, a king power or a card. |
| `game_id` | UUID | no | The game, from kingdown_games or an earlier result. Default: your most urgent game against the computer. |

Output (`structuredContent`):

| Field | Type | Always given |
|---|---|---|
| `known` | boolean | yes |
| `pieces` | array of string | no |

### `kingdown_new_game`: New game

Class: Write. Limit for each account: 60 calls in 60 seconds.

> Starts a new King Down game against the computer, with fairy pieces unless classic is true. A new request_id makes a new game; the same request_id on a retry returns the same game. The result gives your colour, the back rank, the computer's first move when it plays White, and the board.

Side effects: It makes one casual game against the computer in the account; the game also shows on kingdown.dev. When you play Black, the computer plays its first move. The same `request_id` gives the same game again, not a second game.

Input:

| Field | Type | Required | Notes |
|---|---|---|---|
| `request_id` | string matching `^[A-Za-z0-9_-]{8,64}$` | yes | A new ID for each new game; the same ID on a retry. |
| `colour` | one of `white`, `black`, `random` | no | Your colour. Default: white. |
| `level` | one of `beginner`, `casual`, `club`, `strong` | no | The computer level. Default: casual. |
| `king_powers` | boolean | no | King powers on, with your default king. Default: false. |
| `classic` | boolean | no | Classic chess pieces only, with no fairy pieces. Default: false. |

Output (`structuredContent`):

| Field | Type | Always given |
|---|---|---|
| `back_rank` | string | yes |
| `computer` | array of string | yes |
| `game_id` | string | yes |
| `against` | one of `computer`, `person` | yes |
| `colour` | one of `white`, `black` | yes |
| `status` | string | yes |
| `your_turn` | boolean | yes |
| `move` | integer or null | yes |
| `link` | string | yes |
| `level` | string | yes |
| `revision` | integer | yes |
| `fen` | string | yes |
| `legal_count` | integer | yes |
| `status_line` | string | yes |
| `last_move` | string or null | yes |
| `check` | string or null | yes |
| `white` | string | yes |
| `black` | string | yes |
| `grid` | string | yes |
| `legend` | string | yes |
| `ending` | string or null | yes |

### `kingdown_move`: Play a move

Class: Write. Limit for each account: 120 calls in 60 seconds.

> Plays your move in a King Down game against the computer, from words (said) or from exact move IDs of earlier choices (move_ids), or both: the IDs first, then the words. Words that fit several moves give numbered choices and play nothing; words that fit none give the reason and some legal moves. A turn with more actions (a power or a card) gives the next choices and plays nothing until it is complete. A complete turn plays, and the computer replies in the same call. When expected_revision is not the game's revision, nothing is played and the current state comes back.

Side effects: It plays your complete turn and the computer's reply in that game; casual games change no rating. Choices, a refusal, an unfinished turn and an old revision play nothing.

Input:

| Field | Type | Required | Notes |
|---|---|---|---|
| `expected_revision` | integer, 0 to 1100 | yes | The revision of the last result for this game. |
| `said` | string, 1 to 200 characters | no | The move in the player's words, for example "knight to f3". |
| `move_ids` | array of (string, 1 to 120 characters), 1 to 4 items | no | Exact move IDs from earlier choices, in order. |
| `game_id` | UUID | yes | The game, from kingdown_games or an earlier result. |

Output (`structuredContent`):

| Field | Type | Always given |
|---|---|---|
| `result` | one of `played`, `computer`, `choices`, `refused`, `pending`, `changed` | yes |
| `you` | array of string | yes |
| `computer` | array of string | yes |
| `reason` | string | no |
| `move_ids` | array of string | no |
| `choices` | array of objects | no |
| `choices[].number` | integer | yes |
| `choices[].words` | string | yes |
| `choices[].move_ids` | array of string | yes |
| `game_id` | string | no |
| `against` | one of `computer`, `person` | no |
| `colour` | one of `white`, `black` | no |
| `status` | string | no |
| `your_turn` | boolean | no |
| `move` | integer or null | no |
| `link` | string | no |
| `level` | string | no |
| `revision` | integer | no |
| `fen` | string | no |
| `legal_count` | integer | no |
| `status_line` | string | no |
| `last_move` | string or null | no |
| `check` | string or null | no |
| `white` | string | no |
| `black` | string | no |
| `grid` | string | no |
| `legend` | string | no |
| `ending` | string or null | no |

### `kingdown_end`: End a game

Class: Write. Limit for each account: none.

> Ends a King Down game against the computer: resign (the computer wins) or abort (no result; only before each side has played a turn). When expected_revision is not the game's revision, nothing changes and the current state comes back.

Side effects: Resign ends the game, and the computer wins. Abort ends the game with no result. A game that ended does not start again. An old revision changes nothing.

Input:

| Field | Type | Required | Notes |
|---|---|---|---|
| `action` | one of `resign`, `abort` | yes | resign: the computer wins. abort: no result, only before each side has played a turn. |
| `expected_revision` | integer, 0 to 1100 | yes | The revision of the last result for this game. |
| `game_id` | UUID | yes | The game, from kingdown_games or an earlier result. |

Output (`structuredContent`):

| Field | Type | Always given |
|---|---|---|
| `result` | one of `ended`, `changed` | yes |
| `game_id` | string | no |
| `against` | one of `computer`, `person` | no |
| `colour` | one of `white`, `black` | no |
| `status` | string | no |
| `your_turn` | boolean | no |
| `move` | integer or null | no |
| `link` | string | no |
| `level` | string | no |
| `revision` | integer | no |
| `fen` | string | no |
| `legal_count` | integer | no |
| `status_line` | string | no |
| `last_move` | string or null | no |
| `check` | string or null | no |
| `white` | string | no |
| `black` | string | no |
| `grid` | string | no |
| `legend` | string | no |
| `ending` | string or null | no |
