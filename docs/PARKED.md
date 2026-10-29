# Parked features

The web build is lean: it holds the game against the computer, online play and their features. The features below are parked on 2026-10-28. The player cannot open them, and the production bundle does not ship their code. Their source files stay in the tree, so that we can return to them later.

## What is parked

| Feature | What the player no longer sees | Source that stays |
| --- | --- | --- |
| Workshop | The Workshop button on the title (`#title-workshop`), the Workshop row of the menu (`#workshop-btn`), the `?design=` link, and "Bring a design" in New game | `src/workshop/` (with `play-design.ts`, the design-in-a-game code from `new-game.ts`) |
| Lessons | Learn on the title (`#title-learn`), the lesson shelf in the Guide, `#lesson-progress`, `#next-lesson` and Show me | `src/lessons.ts`, `src/lesson-shelf-ui.ts`, `src/lesson-store.ts`; the lesson engine in `src/screen/play.ts` (no entry point; the play tests use it) |
| Tricks and seals | The Tricks row and page, the seal dots, and the seals at the end of a turn | `src/tricks.ts` and its tests |
| Today's army | `#home-today`, the Extra row, the Today option in New game, and "Copy today's result" | `todayDeal` in `src/ui/home.ts`, `shareResultText` in `src/screen/moments.ts` |
| Lab armies | The example armies (`src/try-these.ts`), the Catapult lab, Ogre practice and the Custom army prompt under "More…" in New game | The Catapult piece stays in the engine |
| Card mode | The "Coming: Card mode" row | — |
| The Extra page | Extra, and its This game section (army code and Copy moves). Account moves to the main menu. | `src/clipboard.ts`, `movesText` in `src/screen/links.ts` |
| Online Badges and Collection | The Badges part of the profile, the Collection row and the Collection screen in `/play/` | The server still writes badges to its table. `src/plugin/screens/collection.ts` stays. The badge display code is in git at commit `a55859ac` (`src/plugin/screens/profile.ts`). |

## How old data loads

- A saved New game setup that names `daily`, `custom`, `ogre`, an example army code or a Workshop design falls back to a Random army (`parseSetup` in `src/new-game.ts`).
- A saved game keeps loading. Its `daily` field stays in the save format.
- A game link that holds a design still loads its game. A bare `?design=` link opens the title, and the game removes `design` from the address.
- The online router sends `collection` to the profile.

## Parked checks

The browser checks `lessons`, `lesson-return`, `workshop` and `workshop-cast` run only by name (`tools/lib/registry.mjs`). They test parked features, so they can fail until the feature returns.

## How to return a feature

Put its entry point back in `index.html` and its wiring in `src/main.ts` (or `src/ui/menu.ts`), and remove it from this page. `git log -- docs/PARKED.md` names the commit that parked it; its diff shows each removed line.
