# 06 · The game service: options, the setup step and rematch

Status: ready-for-agent
Type: AFK
Size: L
Blocked by: 04, 05

## Scope

- A new migration (after 0009): game kind `random`; status `setup`; columns for the options, the draw, the deal, the level and the setup deadline; per seat: the choice and a ready mark. Runtime role grants.
- `create(options, colour, level, kind)`: validates through ticket 04; the colour default is White for the initiator (spec Q5); a solo game goes to `setup` (the player's own choices) or straight to `playing`.
- `join` (code) and the matchmaking accept (ticket 07) move a game to `setup`. A new `choose` command stores one seat's choice and `ready`. The other seat's choice stays hidden in each view until both are ready. When both are ready, the service builds the setup (ticket 04) and starts the engine match in the same transaction.
- A computer seat chooses at once (ticket 04 defaults).
- Setup deadline: 3 days; the sweep ends a late game with no result (`no_start`) (spec Q27).
- `rematch`: an offer on a finished game; the opponent's accept makes a new game with the same options and swapped colours, seats filled, in `setup`; against the computer it starts at once.
- The view carries the options, the deal and each seat's power (after Ready), so the board can draw the cards and the coins.

## Acceptance

- Database tests (seam 1 through the service): each toggle mix from create to the first move; hidden choices; one `ready` each; the setup sweep; rematch both ways; retries apply once.
- `npm test` with the test database, `npm run plugin:server:check` pass.

## Notes

- Explorer note B §3.2, §5, §10 (risk 1: the fixed setup). Spec "Schema changes".
