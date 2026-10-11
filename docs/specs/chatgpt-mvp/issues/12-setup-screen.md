# 12 · The setup screen

Status: ready-for-agent
Type: AFK
Size: M
Blocked by: 11

## Scope

- The five toggles with their visibility rules (Arrangement shows only with Fairy on; Classic in the same place with Fairy off), the one-line texts, the defaults and the remembered last choices (spec Q7, Q26).
- The pieces "all" sheet (locks at 7), the cards "all" sheet (locks at 4).
- The king coin and its sheet (six kings, then two powers; only always-on powers with Cards on); the coin shows the chosen king's emblem.
- Colour (White, Black, Random) and, against the computer, the level.
- Start calls `kingdown_create` (computer, friend) or `kingdown_find` (random).

## Acceptance

- Browser check: each toggle mix starts a game whose view matches the choices; the locks; the cards-on power filter; remembered choices after a remount.

## Notes

- Reuse the web New-game data model and texts (`src/new-game.ts` `Pick`, `powerOptions`, `POWER_NAME`) where they fit; the page must not import web-only modules (explorer note D §4).
