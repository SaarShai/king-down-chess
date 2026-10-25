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

## F-114 — plain game type icons

Status: complete. The owner approves the build. The owner checks the images before merge.

The owner says: "remove all of the artwork for the 3 selections of opponent. \"computer\" - change to \"Artificial\" and create an icon for an electronic brain. keep \"a friend\" text, with an icon of a pawn with a smiley face. \"a random player\" change to \"random\" and create an icon of a dice."

Plan:

1. Save the current build and screens at 1280 and 390 pixels.
2. Add a test for names, icons, sprite symbols and no images. Check that it fails first.
3. Draw three symbols in the existing line style. Change the choices and all checks that use their names.
4. Remove unused art CSS. Keep the Open games and waiting art.
5. Check types, selected tests, browser flows, keyboard focus and both device colour modes.
6. Inspect the images. Record the results. Commit F-114 on this branch.

Acceptance checks:

- The shared choices show Artificial, A friend and Random. Each has one icon and no image.
- Both source sprites have the same three symbols. The account website uses the plugin sprite.
- Each choice has a target of at least 48 by 48 pixels. Selection and keyboard focus stay clear.
- The local game uses the same plain icons for its Artificial and A friend choices. Kings' powers keeps its function and uses the crown icon. It has no Random choice.
- Stored values and game rules stay the same.

## F-115 — Menu name

Status: complete. The owner approves the build.

The owner says: "change \"play\" to \"menu\" wherever the main menu is referred."

Plan: save the current menu and back button screens at both widths. Add a test for the heading, default back label and both board back names. Check that it fails first. Change only names of this screen. Run the affected tests and browser checks. Save the final screens. Commit F-115 after F-114.

Acceptance checks: the heading says Menu. The default back label says ‹ Menu. Both board back names say Back to Menu. Invite help and the empty-board reply also name Menu. Actions and internal names stay the same.

## F-114 checks and result

Logs use `/private/tmp/claude-501/ci87/run38/game-type-icons-files/`.

- The five new checks fail first. They find six images and no new symbols. See `f114-red.log`.
- All 13 owner setup tests pass after the change. See `f114-green.log`.
- All 474 cases in the 15 selected test files have passing results across the recorded runs. The 57 art checks also pass.
- The first selected run has 30 failures in two old test helpers. The helpers now open Game options before use, also after a new screen mount. Motion passes in `focused-f114-retry.log`. All 34 lobby cases pass in `focused-f114-final.log`. The default closed-state test still passes.
- The type check passes. See `typecheck-f114.log`.
- Seven browser checks pass: plugin-ui, web-game, game-screen, new-game, plugin-ui-http, web-game-staging and plugin-ui-http-staging. See `browser-f114.log` and `browser-f114-retry.log`.
- The first plugin check expects 23 symbols. The sprite now has 26. The check now uses the correct count. The run stops by its PID after this cause is clear.
- All 34 icon images pass a visual check. They show both widths, both device colour modes, each selected choice and the two 2x views. See `visual-review.md`.
- The icons use 32 pixels. The smallest target is 110 by 70.47 pixels. Selection, keyboard focus and contrast pass.

Artificial uses the brain symbol. A friend uses the smiling pawn. Random uses the die. Both source sprites have the same definitions. The account website reads the plugin template.
The local game uses the same brain and pawn. Its Kings' powers choice uses the existing crown. It has no Random mode.
The removed art classes have no source user. The Open games fan and the waiting kings keep their art and CSS.
Stored values, game rules and the two protected source files stay the same.
The owner checks the images before merge. CI and independent review remain before merge.

## F-115 checks and result

- The two new tests fail first. They find Play in the heading, back label, both board back names, invite help and empty-board reply. See `f115-red.log`.
- All 367 cases in the ten selected files have passing results across the recorded runs. The 57 art checks also pass.
- The first selected run has one failure in a Cards test from before F-113. The test now opens Game options before use. All 13 cases in that file pass. See `focused-f115.log` and `focused-f115-retry.log`.
- `npx tsc --noEmit -p .` passes. See `typecheck-f115.log`.
- The final browser checks pass: plugin-ui, web-game, game-screen, plugin-ui-http, web-game-staging and plugin-ui-http-staging. See `browser-f115.log`. New-game also passes in the F-114 run.
- The four final Menu images and all choice images pass inspection. The full set has 42 PNG files. See `screenshots.json` and `visual-review.md`.
- The design scan returns 22 findings: 20 existing dynamic image tags and two existing style rules. The source comparison and rendered screens pass. See `design-detect.json` and `design-review.json`.

The shared heading says Menu. The default back button says ‹ Menu. Both board arrows have the name Back to Menu. Friend invite help and the empty-board reply also name Menu.
Play now, Start, Play again and the local title Play action stay the same. Internal screen names, routes and stored values stay the same. The other server text stays the same.
The final code check finds no need for another layer. Native controls keep the same work. Rules and the protocol keep the same values and shape. The two protected source files stay the same.
The owner checks the images before merge. CI and independent review remain before merge. No push, PR, merge or deploy is in this task.
