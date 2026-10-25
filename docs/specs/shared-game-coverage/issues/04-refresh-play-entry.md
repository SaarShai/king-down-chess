# Refresh the game list on deliberate Play entry

Status: complete in staging

## Evidence and cause

An existing actual ChatGPT app shows four cached games after the player creates a new game on the website. Returning from its board to Menu and waiting does not show the new game. Menu → Refresh the board → Menu does show it. That workaround is not closure.

`acceptGames` marks the list clean. `enter({ screen: 'play' })` reads again only when that local dirty flag is true; external creation never sets it. The regular board poll reads its selected game, not the account list. A nonquiet board refresh separately reads games, which explains the observed workaround.

## Plan and verification

- Add an actual source UI board → Menu case after external creation. Stage a real pawn move first and check that both its draft and the accepted game state stay unchanged.
- Refresh on deliberate Play entry through the existing read/cancellation path. Keep cached rows visible while the read runs. Add no poller, receipt, game mutation or draft reset.
- Retain route/disposal/account-lifetime invalidation and existing error/retry behavior. Run focused red before the product correction and affected source checks after it, once the parent grants the lane.
- Obtain independent read review and record source evidence. The parent owns compiled and actual-host acceptance. Do not count a data refresh as a fresh app-resource load.

## Outcome

The product change marks the list dirty only when navigation enters Play from another screen outside a mount. Hall keeps its existing dirty check and read/cancellation path. Cached rows remain visible during the read. Mount completion does not add another list read. The change adds no poller or game command.

- True red: `KINGDOWN_TEST_FILE='{src/account-game/hall.test.ts,tools/plugin-app.test.ts}' KINGDOWN_TEST_NAME='refreshes a clean cached list|held Play-entry refresh|finds a game created elsewhere' npm test` fails all four selected cases; 161 cases are filtered. The actual source UI cannot find the externally created game after Back, while its real pawn draft is staged. Log: `/tmp/kingdown-play-entry-red.log`. The Hall-only probes are removed after the correction moves to the actual navigation boundary.
- The first broad check finds eight failures (157 pass). A baseline run with the original Hall code passes seven of those eight; the Freeze continuation case still fails. The initial unconditional Hall refresh adds a read after mount and can clear a failed-read notice. The final correction keeps that mount path unchanged. Logs: `/tmp/kingdown-play-entry-green.log`, `/tmp/kingdown-play-entry-baseline-eight.log`.
- Test-only corrections retain the existing Retry assertions: the harness action-failure flag skips the added list read, so the intended action still fails. The existing Freeze test waits for accepted staging to close the choice sheet and for the existing board readiness signal, instead of reading a draft before remote preview completes.
- Targeted green: the eight prior failures plus the new actual UI case pass (9 selected, 153 filtered), with typecheck and all 54 art checks. Log: `/tmp/kingdown-play-entry-targeted-green.log`.
- Full affected rerun: 159 pass, three fail (242.54 s). One saved-route test reads the host view after only the early screen switch. Two keyboard tests press before remote preview unlocks the board. The three tests now wait for the existing `aria-busy="false"` and no-animation signals at those boundaries; all original status and choice assertions remain. Log: `/tmp/kingdown-play-entry-final-green.log`.
- Final focused green: `KINGDOWN_TEST_FILE='{src/account-game/hall.test.ts,tools/plugin-app.test.ts}' KINGDOWN_TEST_NAME='restores a saved .* route to the board|keeps two failed polls silent|clears a failed read when Your games|finds a game created elsewhere' npm test` passes five cases; 157 are filtered (15.46 s), with typecheck and all 54 art checks. Log: `/tmp/kingdown-play-entry-ready-green.log`.
- Independent read review clears the final runtime boundary, harness correction and all readiness waits, with no should-fix. The cumulative 159/3 result is not a full pass: the parent's mandatory combined source run must close it after integration. The parent owns compiled and actual-host acceptance; this source change does not reload a host resource.

## Current artifact acceptance

Staging `d92991cb` passes the actual native ChatGPT journey. Its Menu list first has eight games. Open `1ccbc2a2-71f6-8b47-a4db-aede1260beed` and stage b2–b3. Create `94ab950c-b385-801d-beff-82e5410b7521` on web. Back to Menu reads nine games and shows the new game without Refresh. Reopen the original game: b2–b3 and enabled End turn remain. Undo clears only the test draft; the accepted history stays at five actions and a scoped database read confirms revision 6. The full 4,521-test gate supersedes the earlier cumulative source warning above. Screenshots and the live receipt are in the outer current U05 report. No further product change is needed.
