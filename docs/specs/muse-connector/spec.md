# Muse connector spec

Status: ready-for-human
Map: [Muse connector map](map.md)

King Down in Meta Muse: a user links a kingdown.dev account, then plays games against the computer by text or voice and sees the turn status of all games, in chat. This spec is the contract of version 1. The reasons are in the map's tickets.

## Module map

| Module | Interface | Job |
|---|---|---|
| `src/muse/tools.ts` | `createMuseServer({ games, actorId, publicOrigin })` | The six tools over a `MuseGames` port. Deep: matching, turn assembly, the computer's reply, retries and words sit behind one call per tool. |
| `src/muse/match-words.ts` | `matchMove(rules, fen, legal, said)`, `moveChoices(...)` | Words to one legal move, a short list, or a refusal with a reason. Closed grammar over the legal list. |
| `src/muse/board-words.ts` | `boardWords`, `moveWords`, `checkWords`, `backRankWords`, `explainWords` | Position to speakable and visible text. |
| `src/muse/position.ts` | `board(rules, fen, legal)` | A view's rules and FEN as a position with its legal moves. |
| `src/muse/http.ts` | `createMuseHandler({ games, publicOrigin, auth, localDev })` | The HTTP edge: guards, bearer check, metadata, the v2 MCP handler. |
| `tools/plugin-server.mjs` | the one server function | Routes `/muse/*` when `MUSE_CONNECTOR` is on; adapts `GameService` to `MuseGames` with surface `muse`. |

The port is the seam: `GameService` is the production adapter and `fixtureService()` (`tools/plugin-protocol-fixture.ts`, real engine, no database) is the test and dev adapter.

## Tools

Every result starts with one or two sentences that Muse can speak unchanged (under 30 words), then detail lines, plus `structuredContent` that matches the tool's output schema. Errors set `isError`, give a fixed sentence and a `code`, and never repeat the input.

| Tool | Class | Annotations (read-only, destructive, idempotent, open-world) | Input | Result |
|---|---|---|---|---|
| `kingdown_games` | Read | T, F, T, F | none | Unfinished games, your turn first: against computer or person, your turn, move number, colour, level, link. No opponent handle. |
| `kingdown_view` | Read | T, F, T, F | `game_id?` (default: the most urgent computer game) | Computer game: status, last moves, check line, piece lists, grid, legend, revision, FEN, link. Person game: status and link only. |
| `kingdown_explain` | Read | T, F, T, F | `topic`, `game_id?` | The rule of a piece, square, power or card; in a computer game on your turn, what that piece can do now. |
| `kingdown_new_game` | Write | F, F, T, F | `request_id`, `colour?`, `level?` (default casual), `king_powers?`, `classic?` | A new game against the computer: back rank, colour, the computer's first move when it is White, the board. |
| `kingdown_move` | Write | F, F, T, F | `game_id`, `expected_revision`, `said?`, `move_ids?` | One fit: plays it and the computer's reply, then the new board. Several: numbered choices, nothing played. None: the reason and options. Unfinished turn: the actions so far and the next choices, nothing played. |
| `kingdown_end` | Write | F, T, T, F | `game_id`, `action` (`resign`, `abort`), `expected_revision` | The ending sentence. Computer games only. |

Retry rule: a write with an `expected_revision` that is not the game's revision plays nothing and returns the current state. Command IDs derive from the game ID, the revision and the actions (`kingdown_new_game`: from `request_id`), so the match service's receipts make a resent command give the first result.

## Capability matrix

| Capability | Status |
|---|---|
| MCP 2025-era clients (`initialize`) | Built and tested in process |
| MCP 2026-07-28 clients (per-request envelope) | Built and tested in process |
| Muse's real protocol era, timeouts and size limits | Unverified ([ticket 12](issues/12-custom-test.md)) |
| OAuth sign-in from Muse (static public client, PKCE) | Unverified ([ticket 11](issues/11-staging-oauth.md)) |
| Monospace grid, links, images, widgets in Muse | Unverified; version 1 needs none |
| Voice mode | Unverified; results are written for speech |
| Glasses | Unsupported: Muse is not on glasses yet |
| Moves in games against a person | Not offered ([ticket 14](issues/14-person-games.md)) |
| Read-only option | Open ([ticket 13](issues/13-read-only.md)) |

## Server notes

- Tool limits (`TOOL_LIMITS`, `src/plugin/service.ts`): `kingdown_new_game` counts as `kingdown_create`, and `kingdown_move` as `kingdown_computer`, because each move call can make the computer's turn. Reads are not counted.
- The handler answers JSON (`responseMode: 'json'`). A 2025-era client that accepts `text/event-stream` can get its reply as one SSE event; both are valid Streamable HTTP.
- One deploy serves the ChatGPT plugin or the Muse connector: they share `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS`, and the audience hook gives each client one resource.

## Limits of version 1

- Games against the computer only for writes; no ranked, no cards, no undo (as on the ChatGPT app), no invitations.
- King powers on or off with the default king; no spoken setup step.
- Per-instance admission slots are in memory; the per-user tool limits are in Postgres (`plugin_tool_tries`).
