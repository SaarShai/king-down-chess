# 04 — Main menu and New game

Status: resolved
Type: task

## Owner words

- F-109: "profile and settings, in the main menu, need to swap locations, and remove their secondary text."
- F-110: "\"you play\" white/black/random - remove random. does not need a whole section. rather, remove that section and have the white/black choice as a small toggle below \"THE GAME\""
- F-111: "remove the section in the attached." The image shows both kings and the King powers are off line.
- F-112: "\"computer level\" - text should just say \"level\". should just have 3 levels - casual, clever, club. should be a slider rather than buttons, with only 3 stopping positions along it."
- F-113: "\"your games\" and \"new games\" should be more visually differentiated. \"new game\" should be collapsed by default below the 3 types of games."

The owner approves these changes. The owner sees the samples before merge.

## Level map

- Casual uses `beginner`.
- Clever uses `casual`.
- Club uses `club`.
- The menu has no Strong choice. An old Strong draft opens at Club for the next game. Existing games keep `strong`.

The release plan selects this map. Both New game screens use it. The engine values stay the same.
An old Random draft opens as White. The server still accepts Random for old games and invites. Ranked keeps its automatic colour.

## Plan

1. Save the base screens at 1280 and 390 pixels.
2. Add checks for the five changes. Run them before the code change.
3. Change the shared hall and both New game screens. Keep the server values.
4. Run the type check, selected tests and all affected browser checks.
5. Inspect all screen samples. Record the results and commit the change.

## Acceptance checks

- Settings comes before Profile. Both rows have one line.
- White and Black sit below The game. A saved Random choice loads as White.
- The King powers switch works without the old panel.
- The range has three stops, an accessible value and a 48 pixel target.
- Game types and Start stay in view when the options are closed.
- The options stay open during changes on the screen.
- Old games, invites and levels still load.

## Checks and result

Logs use `/private/tmp/claude-501/ci87/run38/new-game-files/`.

- The base is `a89a9381a73c0744574bdd27bb2b8c96a6e773c6` from `origin/staging/first-game`.
- The eight new checks fail against the base build. See `red-tests.log`.
- `npx tsc --noEmit -p .` passes. See `typecheck.log`.
- `npm test` with 13 selected files passes: 473 tests. Its 57 art checks also pass. See `focused-complete.log`.
- The owner setup file passes again after its cache moves to a test folder: 8 tests and 57 art checks. See `owner-followup.log`.
- Browser checks pass for game-screen, new-game, cursor-adoption, lesson-return, painted-game and qa.
- All 11 browser checks pass across the recorded runs: plugin-ui, web-game, game-screen, new-game, cursor-adoption, lesson-return, painted-game, qa, plugin-ui-http, web-game-staging and plugin-ui-http-staging.
- The browser scripts open Game options when a check needs a control inside it. The default-state check still requires a closed part.
- `browser-passes.json` gives each passing result and its log. Earlier logs keep the old selector failures and the missing database setting.
- The 38 final PNG files cover both builds at 1280 and 390 pixels. Each image passes a visual check. See `screenshots.json`.
- The local test database is ready. It uses the loopback address in the setup guide.

## Result

- F-109: Settings comes before Profile in the shared hall. Each row has one line. Names and targets stay the same.
- F-110: The shared setup has only White and Black below The game. The local game moves its two choices to the same place.
- F-111: The shared setup has no kings-off panel or its CSS. King powers stays. The local game has no such panel before this change.
- F-112: Both screens use the same native Level control and level map. Each has three stops, keyboard arrows, accessible value text and a 48 pixel input.
- F-113: New game has one frame and its own heading style. The game list stays on the page. Game types and Start stay available with closed options. Options keep their state during edits.

The shared level names also appear in game rows, board strips, seat setup and the profile.
The local game keeps its game types and Army part. This task changes only its colour and Level controls.

## Review

The code check uses the native controls and one shared level map. It finds no need for another control layer.
The server schemas still accept Random and all four old level values. The tests check this.
The owner checks the final images before merge. Independent review and CI remain before merge.
The full test suite does not run on this Mac, as the task requires.
No push, PR, merge or deploy is in this task.
