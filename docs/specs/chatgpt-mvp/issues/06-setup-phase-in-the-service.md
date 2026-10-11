# 06 · The game service: options, the setup step and rematch

Status: claimed
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

## Plan

1. Add migration 0010 and runtime grants. Check a repeat apply and a restricted role.
2. Store options, the draw, the deal and the level at create. Keep games with no options on their old path.
3. Add the setup step and choose command. Start the match in the Ready transaction. Check hidden choices, races and retries.
4. End setup after 3 days with no result. Check the sweep and a late command.
5. Add rematch offers and accept or decline. Check swapped seats and retries.
6. Add setup and power data to the view. Check each toggle mix through the first move.

Each step starts with one failing database test through GameService. Run `npm test` with ticket 06's test database. Run `npm run plugin:server:check` before resolve. Merge the current integration tip and run `npm test` again before push.
