# Parked features

The web build is lean: it holds the game against the computer, online play and their features. The features below are parked in rounds 1 (2026-10-28) and 3 (2026-10-29). The player cannot open them, and the production bundle does not ship their code. Their source files stay in the tree, so that we can return to them later.

The ticket, [specs/park-lean/spec.md](specs/park-lean/spec.md), holds the owner's request, the plan, the verification and the reviews.

## Round 1 (2026-10-28)

| Feature | What the player no longer sees | Source that stays |
| --- | --- | --- |
| Workshop | The Workshop button on the title (`#title-workshop`), the Workshop row of the menu (`#workshop-btn`), the `?design=` link, and "Bring a design" in New game | `src/workshop/` (with `play-design.ts`, the design-in-a-game code from `new-game.ts`) |
| Lessons | Learn on the title (`#title-learn`), the lesson shelf in the Guide, `#lesson-progress`, `#next-lesson` and Show me | `src/lessons.ts`, `src/lesson-shelf-ui.ts`, `src/lesson-store.ts`; the lesson engine in `src/screen/play.ts` (no entry point; the play tests use it) |
| Tricks and seals | The Tricks row and page, the seal dots, and the seals at the end of a turn | `src/tricks.ts` and its tests |
| Today's army | `#home-today`, the Extra row, the Today option in New game, and "Copy today's result" | `todayDeal` in `src/ui/home.ts`, `shareResultText` in `src/screen/moments.ts` |
| Lab armies | The example armies (`src/try-these.ts`), the Catapult lab, Ogre practice and the Custom army prompt under "More…" in New game | The Catapult piece stays in the engine |
| Card mode | The "Coming: Card mode" row | — |
| The Extra page | Extra, and its This game section (army code and Copy moves). Account moves to the main menu. | `src/clipboard.ts`, `movesText` in `src/screen/links.ts` |
| Online Badges and Collection | The Badges part of the profile, the Collection row and the Collection screen in `/play/` | The server still writes badges to its table. `src/plugin/screens/collection.ts` stays. The badge art stays in `src/plugin/assets/`, but `src/account-game/art.ts` leaves it out of the build. The badge display code is in git at commit `a55859ac` (`src/plugin/screens/profile.ts`). |

### How old data loads (round 1)

- A saved New game setup that names `daily`, `custom`, `ogre`, an example army code or a Workshop design falls back to a Random army (`parseSetup` in `src/new-game.ts`).
- A saved game keeps loading. Its `daily` field stays in the save format.
- A bare `?design=` link opens the page as a plain visit does (title or Home), and the game removes `design` from the address. A game link (`?moves=`), with or without a design, is parked in round 3 (below).
- The online router sends `collection` to the profile.

## Round 3 (2026-10-29)

The owner: "park all of these outside the build. we'll return to them later."

| Feature | What the player no longer sees | Source that stays |
| --- | --- | --- |
| Pass-and-play (two people on one device) | "A friend" in New game (`#mode-two`). A rematch of a two-person game plays against the computer. | Mode `two` in `src/new-game.ts`, the `device` turn mode in `src/turn.ts`. The `?players=human,human` check fixture stays, with no visible link. |
| The serverless game link | "Send the game link" (`#share`) in the menu. A link with `?moves=` opens as a plain visit, says "This version cannot open game links.", and loses its parameters. | `gameUrl` and `gameLink` in `src/screen/links.ts`, the link restore in `src/main.ts` and `src/screen/play.ts`, `src/ui/previously.ts` |
| Key moments | The key-moment search that Review started, and its list in Moves (`#over-moments` stays empty) | `listMoments` in `src/screen/moments.ts`, `keyMoments` in `src/moment.ts` |
| Code typing and code tiles in `/play/` | "Join with a code" in New game, the code field on the Join screen, the six code tiles on the friend screen and the code in the Your games row | `src/plugin/screens/join.ts` keeps the preview and join; the server still makes and checks codes |
| Named invitations and the invitation inbox | Nothing: no screen calls them (`src/parked.test.ts`). Tickets 05 to 07 of [friend invitations](specs/friend-invites/README.md) wait. | The server tables (migration 0022), the routes `GET /api/friends` and `POST /api/invites/:id/decline`, and the plugin tools `kingdown_friends` and `kingdown_decline_invite` |

A friend joins an online game by the invite link only. The friend screen shows and sends the link (`/j#<key>`); the key is the token or the code. The link join path (`/j`, `/g/<id>` and the invite flow) works as before.

### How old data loads

- A remembered New game setup with Mode `two` opens as a game against the computer (with Kings' powers when its box was on).
- A saved two-person game loads and finishes. Its next game is against the computer: Rematch (`rematchPlayers` in `src/new-game.ts`) and New game both seat the computer, and Rematch gives the person Black.
- A saved game from a game link loads as a game against the computer (`parkedLinkPlayers`): the computer plays the friend's side, and the game says "This version cannot send game links. The computer plays your friend's side." It shows no "Send your turn".

## Parked checks

The browser checks `lessons`, `lesson-return`, `workshop` and `workshop-cast` run only by name (`tools/lib/registry.mjs`). They test parked features, so they can fail until the feature returns.

The browser check `link-game` runs only by name (`tools/lib/registry.mjs`). It tests the parked game link, so it can fail until the link returns. The checks that start a two-person game use the `?players=` fixture (`startGame` with `mode: 'two'` in `tools/new-game-ui.mjs`). The design-game steps of `painted-game` moved into `link-game`, because a design game opens only from a game link.

## How to return a feature

Put its entry point back in `index.html` (or `src/plugin/index.html` and `src/plugin/screens/setup.ts`) and its wiring in `src/main.ts` (or `src/ui/menu.ts`), and remove it from this page. `git log -- docs/PARKED.md` names the commit that parked it; its diff shows each removed line.
