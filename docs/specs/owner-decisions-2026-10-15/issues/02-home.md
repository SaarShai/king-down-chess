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
- M1 checks hold this Mac's test lock and the M1 check lock. This keeps concurrent runs out of the shared test database. A local parent holds the test lock while it waits for SSH; SSH alone closes that lock handle.
- The phone sample at 390 px shows the full pitch and hides the zero count. The live ChatGPT host is not checked because the owner bars sign-in.
- The final `npm run test:docs` passes: 8 files and 114 tests. Log: `/tmp/kd-od-home-doc-check.log`.
