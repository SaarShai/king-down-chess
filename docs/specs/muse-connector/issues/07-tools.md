# Choose the tools and their classes

Type: grilling
Status: resolved
Blocked by: 03, 06
Parent: [Muse connector map](../map.md)
Labels: wayfinder:grilling

## Question

Which tools does version 1 offer, in which Muse class, and how are writes safe to retry?

## Answer

Six tools, decided 2026-11-08. The full contract is in [spec.md](../spec.md).

| Tool | Class | Does |
|---|---|---|
| `kingdown_games` | Read | Your unfinished games, your turn first |
| `kingdown_view` | Read | One game: status, piece lists, letter grid (computer games); status and link (games against a person) |
| `kingdown_explain` | Read | Rules of a piece, power or card; what a piece can do now |
| `kingdown_new_game` | Write | Start a game against the computer |
| `kingdown_move` | Write | Match the words to a legal move, play it, play the computer's reply |
| `kingdown_end` | Write (destructive) | Resign or abort a game against the computer |

- Every write takes `expected_revision`. A mismatch plays nothing and reports the current state, so a retry after a lost reply never plays twice. Command IDs derive from the game, the revision and the actions; `kingdown_new_game` takes a `request_id`.
- No write is a sensitive write: no money, no message, no publication. Meta's review sets the final class.
- Descriptions are factual. No "use this when" text.
- Games against a person: status and link only in version 1 ([ticket 14](14-person-games.md)).
