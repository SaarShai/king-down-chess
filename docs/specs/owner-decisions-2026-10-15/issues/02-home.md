# Home: Your games (N), pitch line, empty states, fullscreen at once

Status: done

Lane: home. Track: ui. Depends on: 01.

Each part names the owner's pick (approval page, 2026-10-15) and the work that the code map found.

## J10

- Pick: a: 'Your games (3)' when games exist
- At intake: not-built. In the preview, app.ts homeGame(), homeActions() and the #home-games handler make the second button 'Play now' when games exist. games-list.ts nextGame() takes the first ready game in inbox order. The hall (index.html #new-game) has no Play now. Nothing is in integration.
- Build: When open games exist, make the second home button 'Your games (N)', which opens the hall at the list. Put Play now in the hall. Make nextGame() and Resume put a game against a person before a computer game, and add tests.

## W2

- Pick: No letter. The owner wrote his own pitch line: 'Chess, the way it was never meant to be played.' The empty states and the piece lesson have no separate pick; they come from the item summary.
- At intake: not-built. src/plugin/index.html #home-line; src/plugin/app.ts turnLine(), renderGames() ('No active games.'); src/plugin/screens/lobby.ts readLobby() (no empty state); src/lessons.ts LESSONS (not used by the plugin); src/plugin/screens/board.ts refresh(). The preview (taste/recommended) only changes the 0 line to 'No games need your move.' and hides the empty Your games heading.
- Build: Put the owner's line on the home card and hide the turn line when the count is 0. Show 'No games yet.' with Start in Your games, and 'No open games yet.' with one action in Open games. When a new player selects a fairy piece, show its LESSONS 'done' line in the context row.

## D7

- Pick: a: Fullscreen at once (ChatGPT opens the game fullscreen; no request without a tap)
- At intake: not-built. src/plugin/server.ts:45 'openai/ui' preferredDisplayMode 'inline' (same on all taste branches); src/plugin/app.ts connect block lines 252-254, navigate() line 304, fullscreen(); src/plugin/server.test.ts; docs/submission/test-cases.md P1 and package/plugin.json.
- Build: Set preferredDisplayMode to 'fullscreen' in server.ts and in its test. In app.ts, remove the fullscreen() calls that have no tap: at mount (lines 252, 254) and in navigate() (line 304). An inline remount or a chat route keeps the screen in resume, behind the home card. Update test case P1 in both copies, because it names an inline home card with Play and Your games.

## B4

- Pick: a: 'Select' everywhere
- At intake: partly. Built: src/plugin/screens/seat.ts:89 ('Select ...'), src/move-text.ts:76 (T6 Firewall line), src/plugin/screens/lobby.ts:36 and games-list.ts (T1 'just opened'). Still 'Tap': src/plugin/screens/board.ts:133 (move hint), src/read.ts:170 and :267, src/context-line.ts:26-28 (power hints). The taste/teach-notes sample adds 'Tap any piece to read its rule.'
- Build: Change the remaining 'Tap' words to 'Select' in those lines and their tests. read.ts and context-line.ts also serve the website. If J8 a merges, its first note must also say 'Select'.

## Done when

- Each part above works as its Build line says, with a test for each behaviour.
- npm test passes; the plugin-ui browser check passes on the M1.
- Two independent reviewers find no open fault.

## Plan and checks

1. Add the game count and hall action. Prefer a person in Resume and Next game.
2. Add the pitch line, empty lists and fairy-piece lesson text.
3. Let the host open fullscreen. Keep inline routes behind the home card until a tap.
4. Use Select in the shared hints. Update both P1 copies.
5. Add tests for each part. Run the type check, unit tests and M1 browser checks.
6. Get two independent reviews. Fix each confirmed fault before completion.

Checks: `npx tsc --noEmit`, `npm test`, M1 `plugin-ui` and `plugin-ui-http`.
The owner approves the picks and asks for this build in the task message.

## Comments

### Build

- J10: Your games shows the open-game count and opens the hall at the list. The hall has Play now. Resume and Next game prefer a person within the ready games.
- W2: The home card has the owner's exact pitch. It hides a zero turn count. Empty lists show the requested text and a start action. A beginner sees the selected fairy piece's LESSONS done text.
- D7: The resource asks the host to open fullscreen. Mount and route changes send no display request. Inline routes stay behind home and survive a remount. P1 in both copies describes the fullscreen hall.
- B4: Shared piece and power hints use Select. The first fairy-piece note uses Select too.

Taste choices: The hall keeps its existing order and controls. Start in the empty games list uses the same quick setup as Play now. Open games keeps Find an opponent as its one action. The existing beginner level selects the first piece lessons. The first host fullscreen entry opens the Play hall.

### Review

Two independent readers review the full change. Both find the fast game reply can lose its route while a fullscreen reply waits. They also find a saved route can reopen after entry, and the Resume label can lag after collapse. The fixes keep the latest route, clear it after entry, keep it after refusal, and refresh the label after collapse. Tests cover each case.

The HTTP check also finds an input fault on a saved Join screen. The field accepts text before its handlers bind, then the mount clears that text. The field now stays disabled until the screen is ready. A test holds the mount read, checks the lock, then enters a valid code and opens its preview. Both readers check this fix and the check helper. They report no open fault.

The final viewport loop also checks Play before the mount ends. Its live control index can point to a different row after the games list changes. Both readers find no product scroll fault hidden by the ready-state wait. The loop now uses the shared remount helper. A held-read test checks all 50 game rows after the mount is ready.

The Name field has the same mount risk as Join. A saved screen can accept text before the settings reply replaces its value. The field now uses the same mount lock. A test holds that reply and checks the field lock. It then checks the saved name and a new name. Both readers check the final diff and report no open fault.

The full test run also finds an early size read in the 200% zoom test. Board ready means the art has loaded. A separate resize callback sets the visible canvas size after the screen opens. The test now polls for the same 192 px floor within its existing limit. Both readers check the test-only diff. They find no hidden layout fault and no open fault. The control and move checks stay in place.

### Checks

- Checked code and tests: b961d01f8ff2b03ddae25ebe6ea6417c07ae61fd. The final `npx tsc --noEmit` passes on the M1. The local type check passes too.
- The full M1 `npm test` passes with VITEST_MAX_WORKERS=2: 166 files, 2,583 tests and 8 skipped tests. All 50 drawing tests pass. The run takes 513.68 s and keeps every time limit. Log: `/tmp/kd-od-home-checks/kd-od-home-size-verify-tests.log`.
- All four M1 browser checks pass: plugin-ui (223.0 s), plugin-ui-http (290.9 s), powers (5.5 s) and verb-marks (2.0 s). The HTTP check uses the real MCP server and PostgreSQL. It passes the saved-screen and viewport cases. These checks use product head 07e1a580c2df667bf1ea429dbb3d7689cf401aa0. Only the zoom test changes after that head. Log: `/tmp/kd-od-home-checks/kd-od-home-final-check-checks.log`.
- The focused M1 size file passes all 28 tests, plus 50 drawing tests. It checks the 192 px floor, reachable controls and a board move at 200% zoom. Log: `/tmp/kd-od-home-checks/kd-od-home-size-verify-focused.log`.
- The earlier source run passes on this Mac with the local test database: 113 files, 1,584 tests and 8 skipped tests, plus 50 drawing tests. The Join and lobby file passes 23 tests. The final menu file passes 11 tests. Each focused run also passes all 50 drawing tests.
- The Name test fails at its lock assertion before the fix and passes after the fix. The full run first reads a zero-width canvas in the zoom test. The same size and move checks pass after they wait for the resize callback. Both readers report no open fault in these fixes.
- An early full run reaches three existing timing limits. The repeat uses two workers and keeps each limit. A later run loses its shared SSH database link. The lane now owns a link with keepalive and no shared control socket: M1 port 55438 reaches the same Mac test database at port 55432. A database probe fails before that link starts and passes after it starts.
- Earlier M1 groups also use this Mac's test lock. That extra lock is not needed: all database test files use their own databases. The named browser checks use the M1 lock. Their HTTP check uses test actors in the base test database.
- The phone sample at 390 px shows the full pitch and hides the zero count. The live ChatGPT host is not checked because the owner bars sign-in.
- The final `npm run test:docs` passes: 8 files and 114 tests. Log: `/tmp/kd-od-home-doc-check.log`.

### Review repair plan

1. Check each Review A and Review B finding against the code. Record each result here.
2. Add tests for fixed board size, Home routes, game counts, start locks, server game choice and Select text. Check the spec against D7.
3. Fix each confirmed fault at its source. Keep the saved hall route for host expansion.
4. Run `npm test` on this Mac with the local test database. Run focused browser test files and `plugin-ui` and `plugin-ui-http` on the M1. Keep all time limits.
5. Check the final diff and commit on this branch.

Pass criteria: each confirmed fault has a regression test. Tests and both browser checks pass. Each review finding has a result and evidence. The live host stays unchecked because sign-in is barred.

### Review repair results

The code confirms each finding. A4 and B5 name the same word fault.

- A1: The long lesson grows the context row. The phone context text now uses a fixed two-line slot. All rules shows the full lesson. Tests compare canvas width, height and position at 320 and 393 px.
- A2: A saved Play route makes both Home actions open the hall. Home now uses Play now or the next ready person game for its first action. The saved hall route still serves host expansion. Tests cover collapse, an inline chat route, empty games and a ready person game.
- A3: The hall and empty-list start actions stay on while Retry waits. Both start controls now use the setup lock in both render paths. The lost-Create test checks all three controls.
- A4 and B5: The website supplies turn text and move help that still say Tap. Both use Select. Turn tests check all modes and the real context function. The website browser checks read the rendered turn text.
- A5: The server takes the first inbox game. The server and browser now share the person-first choice. Tests cover both kingdown_open with next and kingdown_resume without a game ID. The server keeps the first inbox game when no game needs the player.
- A6: The overview and Q25 still require an inline card first. Both now record D7 a. The two related user stories match it. A doc test checks both spec sections.
- B1: A saved game route suppresses routing from the new status. Mount now routes saved game screens from the fresh server read. A test ends the game between collapse and inline remount, then checks that Resume opens the result.
- B2: A new Home result clears the queue but keeps Resume. Home now clears both. A test sends Profile then Home and checks that Play now starts a game.
- B3: Create marks the list dirty, but Home does not read it. Home now refreshes a dirty list. A test creates a game, collapses and checks Your games (1) and its row.
- B4: Only the initial connection opens the hall on first fullscreen entry. Host context now handles the first fullscreen notice too. A test delays that notice until mount ends, then checks that a later explicit Home return stays on Home.

### Review repair checks

- First repair code: `9063d72f`. The final check record also covers the linked Home start case below.
- This Mac: `KINGDOWN_TEST_FILE='src/**/*.test.ts' npm test` passes with the required local test database. All 113 files pass: 1,586 tests pass and 8 skip. All 50 drawing tests pass. The run takes 101.70 s.
- The source probes use the new tests with the old code. Both server-choice tests fail. Six turn-text tests fail. The display-spec test fails. The full source run and the doc run pass with the fixes.
- M1: the new Home tests with the old product code fail in all eight fault cases. The old board code fails both size tests: 218 to 184 px at 320 px, and 384 to 371 px at 393 px. No other test in either file fails.
- M1 with the fixes: all 81 app tests pass in 151.82 s. All 39 board tests pass in 70.76 s. Each file also passes all 50 drawing tests. The remount test waits for a fresh server read. The size test waits for the resize callback before each comparison.
- The doc check passes: 8 files and 115 tests.
- Logs on this Mac: `/tmp/kd-od-home-repair/`. M1 log prefix: `/tmp/kd-od-home-repair-`.
- The fixture and website browser checks use the M1 check lock. The lane has its own database link through M1 port 55438. Its database probe passes. The first groups also use the Mac test lock. The final group uses only the M1 lock; the database test files use separate databases.
- No test or check time limit changes. The live ChatGPT host stays unchecked because sign-in is barred.

### Linked Home start case

A final code check finds that A2 and A3 need one more joint check. After a lost hall start, collapse saves Play. Home then offers Play now, but the old action lock leaves that button on. The start guard sends no second Create, so that action has no result.

The app now owns one action update. Setup render calls that update. The update locks Home Play now while a start waits for Retry. Resume and Choose a game keep their normal rules.

The new test fails at the disabled-button check with the first repair code. With the fix, this Mac passes all 113 source files: 1,586 tests pass and 8 skip in 97.82 s. The single app file passes all 82 tests in 138.24 s. Both runs also pass all 50 drawing tests. Logs: `unit-final.log`, `app-final.log` and `red-home-start.log` in `/tmp/kd-od-home-repair/`.

The first four named browser checks use one M1 group. That group takes both locks and waits for other browser checks to end. The final group needs only the M1 lock. Earlier queued attempts end before any named check starts.

### Route recovery checks

The first named M1 group uses `507e3c49`. Both website checks pass: turn takes 12.695 s, and their-turn takes 6.473 s. No website source changes after that run. The two plugin checks stop at `tools/plugin-ui-check.mjs:661`. A remount opens the board before the saved seat recovers a lost Ready reply. The pending Choose command then blocks the computer.

The read now keeps a pending command with its saved screen. A terminal result still opens its result card. A new test checks a lost seat Ready as Black. It checks the same command ID after remount and the computer's first move. The result test also checks a lost resign reply.

A second route check covers Profile to Home before the first fullscreen notice. The hall flag now tracks that Home request. Both a route and a chat result cancel the default hall entry. The original late first notice still opens the hall when Home has no explicit request.

All three new route probes fail with `507e3c49`. With the fixes, this Mac passes all 113 source files: 1,586 tests pass and 8 skip in 98.37 s. The single app file passes all 86 tests in 145.32 s. Both runs also pass all 50 drawing tests. Logs: `red-routes.log`, `unit-routes.log` and `app-routes.log` in `/tmp/kd-od-home-repair/`. The first named check logs are in `browser-first/` there.

The next M1 group runs plugin-ui and plugin-ui-http. The two website checks already pass. The group keeps every time limit.

### Viewport check states

The second named M1 group uses `7dbd9dbd`. Both plugin checks pass the lost seat Ready case. Both then stop in the viewport loop at the saved Friend page. The sample has a playing solo game, so the new fresh-status rule opens its board. This is a check fixture fault, not a new product fault.

The viewport loop now shares the valid status cases with the route loop. A saved Friend sample reads a waiting friend game. The other game pages also read a matching state. No size or control check changes. The app test also checks that a saved Friend route opens the board when the game is already in play.

The second group logs are in `/tmp/kd-od-home-repair/browser-second/`. No runtime code changes after `7dbd9dbd` for this check repair.

The updated app file passes all 87 cases in 150.50 s. The same `npm test` run passes the type check and all 50 drawing tests. Log: `/tmp/kd-od-home-repair/app-viewport.log`. The final named group uses `e730396d`.

The final queue uses only the M1 lock. All 11 database test files use `ownTestDatabase`, which adds a suffix to the base test database name. The extra Mac lock delays other lanes and gives this browser run no database isolation. The queued shell ends by its verified PID before any named check starts. The new shell keeps the owner's exact M1 lock loop and the active-check guard.

The final `npm run test:docs` passes all 8 files and 115 tests in 1.79 s. Log: `/tmp/kd-od-home-repair/docs-final.log`.

### Final review repair evidence

- Checked code and tests: `e730396d40c2fb4e7dc271d27fc9fc60f4d8a69f`. The final commit changes only this ticket after that head.
- M1 `plugin-ui` passes in 220.474 s. M1 `plugin-ui-http` passes in 284.637 s. Both pass the lost Ready and saved-screen viewport cases. The named group and SSH return 0. No test or check limit changes.
- The website `turn` and `their-turn` checks pass in the first group. No website source changes after those passes. The later diff changes only the plugin app, its tests, its check helper and this ticket.
- Local `npm test` passes all 113 source files: 1,586 tests pass and 8 skip. The app file passes all 87 cases. The M1 board file passes all 39 cases. Each run also passes all 50 drawing tests. The type check passes.
- The doc check after the final result record passes all 8 files and 115 tests in 1.99 s. Log: `/tmp/kd-od-home-repair/docs-record.log`.
- The own database link closes after the HTTP check returns 0.
- Final browser logs and `run.json`: `/tmp/kd-od-home-repair/browser-final/`. The checked M1 output folder is `kd-od-home-s2lc6U`.
- The live ChatGPT host stays unchecked because sign-in is barred.
