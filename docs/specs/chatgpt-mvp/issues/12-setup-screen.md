# 12 · The setup screen

Status: claimed
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

## Plan and checks

Base: local claude/chatgpt-mvp at 1a2b0ecc. The ticket 10 merge and both ticket 11 parts are present.

1. Test the pure setup model one case at a time. Check defaults, old settings, hidden toggles, pool locks, card locks, power limits and start arguments.
2. Fill the setup stub. Reuse game styles and art. Export the king sheet for ticket 14. Save last_setup before Start. Use the shared Start and route functions.
3. Add setup checks in one browser block. Check real views, remount, lost Start replies, locks and all controls at 360, 390, 400 and 1440 px. Compare the five sample states at phone and desktop size.
4. Run npm test, all browser checks, both named plugin checks and plugin:server:check. Record page bytes. Commit, merge the current local integration tip, test again and push.

Test seams: the public pure setup model and the app page through the shared harness. Checks use the disposable kingdown_mvp12_test database on 127.0.0.1:55432. Shared page and server files stay read only, except the setup section and the setup check blocks.

Ticket 10 keeps the initiator's king only in last_setup.king. Create and Find do not take a king. Choose is refused while waiting. The seat screen uses last_setup to prefill it.

## Model check point

Four red-to-green steps cover the defaults, old saved choices, toggle and pool limits, and the card-safe king and solo choice. npm test passes 2,298 tests in 151 files, with 8 skipped. The art tests and type check pass. The app check starts with the empty setup stub.
