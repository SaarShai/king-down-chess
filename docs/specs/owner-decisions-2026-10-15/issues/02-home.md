# Home: Your games (N), pitch line, empty states, fullscreen at once

Status: in-progress

Lane: home. Track: ui. Depends on: 01.

Each part names the owner's pick (approval page, 2026-10-15) and the work that the code map found.

## J10

- Pick: a: 'Your games (3)' when games exist
- Today: not-built. In the preview, app.ts homeGame(), homeActions() and the #home-games handler make the second button 'Play now' when games exist. games-list.ts nextGame() takes the first ready game in inbox order. The hall (index.html #new-game) has no Play now. Nothing is in integration.
- Build: When open games exist, make the second home button 'Your games (N)', which opens the hall at the list. Put Play now in the hall. Make nextGame() and Resume put a game against a person before a computer game, and add tests.

## W2

- Pick: No letter. The owner wrote his own pitch line: 'Chess, the way it was never meant to be played.' The empty states and the piece lesson have no separate pick; they come from the item summary.
- Today: not-built. src/plugin/index.html #home-line; src/plugin/app.ts turnLine(), renderGames() ('No active games.'); src/plugin/screens/lobby.ts readLobby() (no empty state); src/lessons.ts LESSONS (not used by the plugin); src/plugin/screens/board.ts refresh(). The preview (taste/recommended) only changes the 0 line to 'No games need your move.' and hides the empty Your games heading.
- Build: Put the owner's line on the home card and hide the turn line when the count is 0. Show 'No games yet.' with Start in Your games, and 'No open games yet.' with one action in Open games. When a new player selects a fairy piece, show its LESSONS 'done' line in the context row.

## D7

- Pick: a: Fullscreen at once (ChatGPT opens the game fullscreen; no request without a tap)
- Today: not-built. src/plugin/server.ts:45 'openai/ui' preferredDisplayMode 'inline' (same on all taste branches); src/plugin/app.ts connect block lines 252-254, navigate() line 304, fullscreen(); src/plugin/server.test.ts; docs/submission/test-cases.md P1 and package/plugin.json.
- Build: Set preferredDisplayMode to 'fullscreen' in server.ts and in its test. In app.ts, remove the fullscreen() calls that have no tap: at mount (lines 252, 254) and in navigate() (line 304). An inline remount or a chat route keeps the screen in resume, behind the home card. Update test case P1 in both copies, because it names an inline home card with Play and Your games.

## B4

- Pick: a: 'Select' everywhere
- Today: partly. Built: src/plugin/screens/seat.ts:89 ('Select ...'), src/move-text.ts:76 (T6 Firewall line), src/plugin/screens/lobby.ts:36 and games-list.ts (T1 'just opened'). Still 'Tap': src/plugin/screens/board.ts:133 (move hint), src/read.ts:170 and :267, src/context-line.ts:26-28 (power hints). The taste/teach-notes sample adds 'Tap any piece to read its rule.'
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
