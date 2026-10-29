# Parked features

The web build is lean: it holds the game against the computer, online play and their features. The player cannot open a parked feature. Its source files stay in the tree, so that we can return to it later.

## Round 3 (2026-10-29)

The owner: "park all of these outside the build. we'll return to them later."

| Feature | What the player no longer sees | Source that stays |
| --- | --- | --- |
| Pass-and-play (two people on one device) | "A friend" in New game (`#mode-two`) | Mode `two` in `src/new-game.ts`, the `device` turn mode in `src/turn.ts`. The `?players=human,human` check fixture stays, with no visible link. |
| The serverless game link | "Send the game link" (`#share`) in the menu. A link with `?moves=` opens as a plain visit, says "This version cannot open game links.", and loses its parameters. | `gameUrl` and `gameLink` in `src/screen/links.ts`, the link restore in `src/main.ts` and `src/screen/play.ts`, `src/ui/previously.ts` |
| Key moments | The key-moment search that Review started, and its list in Moves (`#over-moments` stays empty) | `listMoments` in `src/screen/moments.ts`, `keyMoments` in `src/moment.ts` |
| Code typing and code tiles in `/play/` | "Join with a code" in New game, the code field on the Join screen, the six code tiles on the friend screen and the code in the Your games row | `src/plugin/screens/join.ts` keeps the preview and join; the server still makes and checks codes |
| Named invitations and the invitation inbox | Nothing: no screen calls them (`src/parked.test.ts`). Tickets 05 to 07 of [friend invitations](specs/friend-invites/README.md) wait. | The server tables (migration 0022), the routes `GET /api/friends` and `POST /api/invites/:id/decline`, and the plugin tools `kingdown_friends` and `kingdown_decline_invite` |

A friend joins an online game by the invite link only. The friend screen shows and sends the link (`/j#<key>`); the key is the token or the code. The link join path (`/j`, `/g/<id>` and the invite flow) works as before.

## How old data loads

- A remembered New game setup with Mode `two` opens as a game against the computer (with Kings' powers when its box was on).
- A saved two-person game loads and finishes. Its next game from New game is against the computer.
- A saved game from a game link loads and finishes. Its turn still makes a link, which this version does not open.

## Parked checks

The browser check `link-game` runs only by name (`tools/lib/registry.mjs`). It tests the parked game link, so it can fail until the link returns. The checks that start a two-person game use the `?players=` fixture (`startGame` with `mode: 'two'` in `tools/new-game-ui.mjs`).

## How to return a feature

Put its entry point back (`index.html`, `src/plugin/index.html`, `src/plugin/screens/setup.ts` or `src/main.ts`), and remove it from this page. `git log -- docs/PARKED.md` names the commit that parked it; its diff shows each removed line.
