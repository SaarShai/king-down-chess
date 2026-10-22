# Wait for a settled frame in the plugin browser checks

Status: resolved on branch `staging/lane-settle` (from `staging/integrate` `4d1e1a15`); not merged, not deployed.

## What

The embedded WebKit check `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http` finds one race in each run under CPU load, and each race has the same form. A step waits for one element or for `#reload` to be on (`idleBoard`), then reads, measures or focuses nodes. A reply or a draw that is still due then draws those nodes again with new nodes (`replaceChildren`, `innerHTML`, new buttons with the same id). So the node is detached between the locator resolve and the read. Tickets 72, 73 and 75 fixed three of these races, each by hand. Ticket 75 recorded the next one: `FAIL plugin-ui-http 219.5 s AssertionError [ERR_ASSERTION]: A spent coin can have keyboard focus`, at `tools/plugin-ui-check.mjs:2207` on the ticket 75 tree (the spent card coin after the card move), with the calls `kingdown_games`, `kingdown_get`, `kingdown_games`, `kingdown_get`, `kingdown_move`, `kingdown_computer` and the status 'Your move.'. These are check faults, not product faults.

## Why

The check blocks the staging release. A check is not weakened to make it pass: the fix removes the cause, and the rule lives in one place.

## Scope

- New `tools/lib/plugin-settled.mjs`: `settled(page, frame)`, the one wait for a settled frame.
- `tools/plugin-ui-check.mjs`: `idleBoard()` uses `settled`; the waits of tickets 73 and 75; the audited sites below. The old host-only `settled()` keeps its meaning under a new name, `callsDone()`.
- `tools/lib/card-detail-check.mjs`, `tools/lib/plugin-cards-check.mjs`: audited sites.
- `docs/specs/gui-previews-2026-10-19/capture.mjs`: the `seed()` wait of ticket 72.
- This ticket file.
- No assertion and no time limit changes. No retry loop. No commit has a `Removed-check:` trailer.

## Acceptance

- The race is made to happen with a temporary hold, and the hook is then removed.
- `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http` passes 3 of 3 alone, and 5 of 5 under CPU load.
- `npm run check:browser plugin-ui plugin-ui-http gui-board-preview` (default browser) passes.
- `npm run typecheck`, `npm run test:docs`, `KINGDOWN_TEST_FILE=tools/check.test.ts npm test` and the full `npm test` pass.

## Result

### Cause (a race in the check)

Ticket 75's guess is partly right. The step does not race the computer reply itself: the computer turn is a write, so `#reload` stays off until the reply is drawn. It races two draws that the reply leaves due after `#reload` comes on:

- The computer plays a card. `strips()` (`src/plugin/screens/board.ts`) sees a newly spent card, gives it the `is-spending` moment, and calls `setTimeout(strips, 300)`. That later call draws both strips again with new coin buttons.
- The computer move animates. At the end of the animation, `refresh()` runs `strips()` again.

The step then waits for `harnessView.turn === harnessView.seat`, which the host sets before the frame has the reply, then `idleBoard()` and `boardBox()`. `boardBox()` waits for the animation end, but not for the spend timer. If the spend timer comes after the animation end (the order is not fixed, and CPU load moves it), the timer draws the strips between `spentCoin.focus()` and the `:focus-visible` read. The read then meets the detached coin and gives `false`.

Evidence (temporary probes, now removed). Each probe held the computer reply (`holdNext = 'kingdown_computer'`), released it 1.5 s later, logged the coins that left `#game-table` with a `MutationObserver`, and marked each step with the time since the observer started:

- Old wait, first run: `idle@2510 reload=false spending=1 animating=true`; the first card coin was then drawn again at `2719` and `2794`; `boardBox@2831`, `focused@2839`, `read@2844`. Opponent coins after the step: `["card-b-0:always","card-b-1:always","card-b-2:used","card-b-3:always"]` (the computer spent a card). (`reload=false` means `#reload` is not disabled.) So `idleBoard` returns while two draws are due.
- Old wait, second run: the probe took a handle of the coin when `idleBoard` returned (`idle@2443 reload=false spending=1 animating=true`), focused it (`{"connected":true,"keyboard":true}`), waited for the due draws (coin drawn again at `2637` and `2727`), and read the same handle again: `{"connected":false,"keyboard":false}`. That is the `false` of the failure.
- New wait, the same hold, released 1.5 s after the move: `move-seen@394`, `settled-after-move@2213 reload=false spending=0 animating=false`, `turn-wait@2222`, `settled@2230`, `focused`, `read@2268`, `PROBE fixed true`, and `ok plugin-ui-http 281.5 s`. The wait after the move now covers the whole computer turn and its due draws.

### What "settled" means, and the helper

`settled(page, frame)` in `tools/lib/plugin-settled.mjs` waits until each of these is true in one pass:

1. No tool call is in flight at the host, but the ones a check holds on purpose: `harnessInflight === harnessHeld`.
2. No `harnessNextView` waits for its board read.
3. The frame has every reply that the host sent. The host decrements its count before it posts the reply, so the count alone has a gap. The helper posts a fence to the frame (the frame shim sends a `fence` message back) and waits for the echo. `postMessage` keeps the order, so the frame has handled each earlier reply, and a call that the frame starts in reply (the games read after a board read, `src/account-game/runtime.ts`, `await games(job)`) is at the host before the echo.
4. The mount and each write have ended: `#reload` is on.
5. No draw is due: no `.coin.is-spending`, and the visible `#board` does not have `data-animating="true"`.
6. A second fence (a timer that the frame set before, such as the computer turn after a move, runs first), and the host call count did not change over the pass. Else the pass runs again, up to `30 s × STEP`.

`idleBoard()` now calls `settled`. A held call does not block it (rule 1 counts held calls out), so the steps that act while a call is held still work, as before, where `idleBoard` already needed `#reload` on. The old host-only wait (`settled()` in the check) stays for the steps that wait while a held call keeps a mount open; it has the new name `callsDone()`, so the name `settled` has one meaning.

The three hand fixes now use the helper:

- Ticket 72, `capture.mjs` `seed()`: `settled(p, f)` replaces the `harnessNextView`, count and `#reload` waits.
- Ticket 73, the coin focus step: `settled(focusHost.page, focusHost.frame)` replaces the same three waits.
- Ticket 75, the Profile step: the wait for this visit's `kingdown_profile` call stays (the helper cannot know that a read is about to start), and `settled` replaces the 'Loading profile…' wait.

### Audit

Rule: a read in one `locator.evaluate` on a node that no draw replaces is safe. A risk needs (a) a node that a due reply or draw replaces, and (b) a read in more than one protocol call (`evaluateAll`, `boundingBox`, `focus` then a read, `elementHandle`), or a read of the old node.

`tools/plugin-ui-check.mjs` (line numbers on `2d185ed2`):

| Site | Verdict |
| --- | --- |
| 133 `boardBox()`, 1964, 2654 `#board canvas` boxes | Safe: the canvas is never replaced (`bindBoard` moves it). |
| 164 `controlsInView` (callers 553 `setupFits`, 1172 `fits`) | Fixed through its callers: `setupMount` now ends with `settled` (the setup grid is drawn again on each store pass); `fits` calls `idleBoard`. |
| 190 `checkFocus`, 196 `checkMenuContent`, 1269 settings labels, 1270 `checkSegments` | Safe: static HTML. |
| 193 `checkFlatRows` Play menu rows, 1124 seat menu rows | Safe (ticket 75): the rows stay; a seat redraw does not make an open menu again. |
| 371 `images()` decode | Safe: `decode()` of a detached image still ends. |
| 419-421 Profile open rows, 447 history ids, badges | Fixed: `settled` after this visit's read starts. |
| 539 `setupMount` (and 606 setup buttons, 613-618 king picker) | Fixed: `settled` after `#setup-start` is on; `setupSync` draws the card grid again after the mount's Play read. |
| 597 `checkCardChoices` | Fixed in its module (below). |
| 883 games rows after a held read | Safe: `callsDone()` after the release, and the step reads `dataset.gameId`, which a detached row keeps. |
| 930-941 `seatFits` (`.veil`, seat buttons) | Safe: the seat buttons are static, and `.veil` is made once for each seat visit. |
| 1104 `#board-menu`, 1514 `mutual`, 1527 `#page-back`, 2070 `#board` focus | Safe: static nodes. |
| 1146 presets | Safe: made once at module load. |
| 1203-1207 saved game rows after `openPlay` | Fixed: `settled` after `openPlay`; the rows of the last visit show first, then the Play read draws them again. |
| 1318 `sheetLabelsFit` | Safe: the sheet is made by the click, and the last wait before each call is settled. |
| 1429-1440 friend invite row and its screenshot | Fixed: `settled` after `openPlay`, for the same reason. |
| 2141 `checkOwnerPicks` | Fixed: its `show()` calls the `idleBoard` that it gets. |
| 2143 `measureCardCoins` | Safe: it runs after a settled `show()`, and nothing is due on the page. |
| 2160-2168 coin focus at 390 × 844 | Fixed: `settled` (ticket 73's wait). |
| 2202-2203 move choices | Safe: the click makes the list; only a new view clears it, and no call is due. |
| 2205-2211 spent coin focus | Fixed: `idleBoard()` is `settled` (the cause above). |
| 2363 `zoomBoardFits` coin rows | Safe: each caller follows a settled wait and local clicks only. |
| 2547 `#strip-them .player-name` box | Safe: the swap preview follows `seedBoard` (settled) and local taps. |
| 2598-2603 `zoomHallFits` game rows | Fixed: `settled` first; New game opens Play, and its read draws the rows again. |
| 3380 Cancel focus (G1) | Safe: after `seedBoard` (settled) and local clicks. |
| 2484, 2531, 3048 `iframe` boxes; 2496 touch action; 2950 screen list | Safe: host or static nodes. |
| The other 70 `idleBoard()` callers | Fixed by the stronger `idleBoard`. |

The modules:

| Site | Verdict |
| --- | --- |
| `card-detail-check.mjs` after each `harnessShow` | Fixed: it waited only for `#board[aria-busy="false"]` (the pattern of ticket 72), then opened card sheets that the end of the mount closes. Now `settled` follows. |
| `plugin-cards-check.mjs` `checkCardChoices` grid boxes | Fixed through `setupMount`. |
| `plugin-cards-check.mjs` after the host refresh | Fixed: `settled` after the old card leaves, so the focus and draft reads come after the mount. |
| `plugin-cards-check.mjs` `measureCardCoins` | Safe (above). |
| `plugin-coin-focus-check.mjs` | Safe once its caller is settled: `boundingBox`, focus and the screenshots meet stable coins. |
| `plugin-k-picks-check.mjs` `show()` | Fixed through the `idleBoard` it gets; the strip reads are single `evaluate` calls on the strips. |
| `plugin-android-check.mjs` `show()` | Safe: it waits for the board read, then `#reload` on, with the page hidden (no poll) and reduced motion (no spend moment). |
| `plugin-shell-check.mjs` | Safe: it reads static bar buttons and containers, with reduced motion. |
| `plugin-tablet-check.mjs`, `plugin-widget-state-check.mjs` | Safe in themselves; the callers above own the wait. |

### Green runs

Each browser run sets `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_lane_settle_test` (made with `npm run plugin:db:init-test`: `Disposable PostgreSQL schema ready (migrations 0001-0018); every migration is repeatable`). The load runs start 16 `yes > /dev/null` processes (this Mac has 16 cores) 20 s before each run and stop them by their PIDs after it.

Each run tests the tree of `2d185ed2`. Each passing log has `Profile and collection` and the four `Coin focus at 390 × 844` lines.

- `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http`, alone, 3 runs: `ok plugin-ui-http 274.9 s`, `284.2 s`, `277.0 s`; each `check: all 1 passed`.
- The same, under CPU load, 5 runs: `ok plugin-ui-http 339.5 s` (load averages 26.12 20.84 14.63), `339.7 s` (23.78 24.03 18.48), `338.7 s` (23.84 24.10 20.44), `354.8 s` (23.89 23.72 21.54), `342.3 s` (23.83 23.65 22.23); each `check: all 1 passed`.
- `npm run check:browser plugin-ui plugin-ui-http gui-board-preview` (default browser): `ok plugin-ui 238.0 s`, `ok plugin-ui-http 252.0 s`, `ok gui-board-preview 165.7 s`, `check: all 3 passed`.
- `npm test` (full, with the lane database): `Test Files  256 passed (256)`, `Tests  4767 passed | 8 skipped (4775)`, and the node tests `pass 50`, `fail 0`.
- `KINGDOWN_TEST_FILE=tools/check.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs` (with this ticket file): `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

### Runs that failed

- One probe run (not a check fault, not this tree): `FAIL plugin-ui-http 184.9 s TypeError: widget.waitForFunction is not a function`. The first draft of the helper used `Locator.contentFrame()`, which gives a `FrameLocator`; the helper now uses `elementHandle().contentFrame()`.
- One probe run on the fixed tree: `FAIL plugin-ui-http 297.3 s Error: assertNoErrors: 1 unexpected error(s): console.error: King Down connection failed SdkError: Request timed out`. The probe held the computer reply and released it only after a later wait, but the wait after the move now waits for that reply, so the hold stayed until the SDK request timed out. The next probe released the hold after the move and passed.
- No other failure. No run showed a new race.

## Review fix

An independent review approved the change with four low findings. Each one is fixed. Commits `d109b981`, `41a09dcc` and `9702841b`; no assertion changes, so no `Removed-check:` trailer.

1. **The widget-write drop window (`setupMount`).** Fixed. The step does not need the drop during the settle: the drop keeps the mount from writing over the injected `screen: 'play'` state, and the old code turned it off when `#setup-start` was on, so writes after that point were kept before ticket 76 too. `setupMount` now sets `harnessDropWidgetWrites = false` first, then calls `settled`.
2. **The fence limit on the page clock.** Fixed. The 1000 ms limit of each round trip is now a Node timer (`Promise.race`), so a paused page clock cannot stop it. The page side has no timer. A late echo removes its own listener and resolves a promise that nobody reads, and a lost echo leaves only a listener that ignores every other id.
3. **The inner waits used the page default timeout.** Fixed. Each inner wait gets `{ timeout: Math.max(1, end - Date.now()) }`. At the limit the helper throws one error that names the condition that did not hold (`host idle`, `fence answers`, `frame timers`, `frame (#reload on, no spending coin, no animating board, no ceremony)` or `call count`), its state and the last pass. The last pass is necessary: an inner wait can time out because a looping pass used the time first.
4. **The comment and the end draws.** Fixed. `data-toppling` is set only by `kingDown()` (`src/plugin/screens/board.ts`). The ceremony's own `setTimeout(skip, 1130)` always clears it, and `skipBoardCeremony()` clears it at once on a screen change, a new game or teardown. So the frame condition now waits for no `data-toppling`. The end routing (`setTimeout(…, 0)` in `draw()`) cannot be seen from the screen alone: a finished game can stay on the board screen (See the board). So the helper now does a frame timer turn: it sets `setTimeout(…, 0)` in the frame and waits for it. HTML runs the timers of one window with an equal or shorter timeout in the order they were set, so the end routing and the computer turn after a move (`scheduleComputer`, also 0 ms) run first. The old second fence assumed a timer-before-message order, which the spec does not give. The second fence stays, so each call that the frame starts is at the host before the count check. The comment now says what the helper covers and what it does not: other timers longer than 0 ms (the poll, the deadline, the thinking line), and a read that the frame has not started yet.

Two fix runs failed, and each failure is fixed in the next commit:

- `d109b981`, alone, 2 runs: `FAIL plugin-ui-http 38.2 s frame.waitForFunction: EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' or 'trusted-types-eval' is not an allowed source of script in the following Content Security Polic...` (and `36.9 s`, the same line). The frame CSP refuses a string expression. `41a09dcc` uses one function with a `report` argument.
- `41a09dcc`, alone, 2 runs: `FAIL plugin-ui-http 169.0 s Error: settled: frame (#reload on, no spending coin, no animating board, no ceremony) did not hold in 30 s: {"reload":true,"spending":0,"animating":false,"toppling":false,"ok":true}` (and `172.9 s`, the same line), from `fits` → `lookAt` at `tools/plugin-ui-check.mjs:1751`, which is in the `page.clock.pauseAt` block. A paused clock runs no frame timer, so the timer turn never answered, and each pass failed until the limit. The review was right that `idleBoard` runs under the paused clock. `9702841b`: when the frame's `Date.now()` does not move, no frame timer can run before the check moves the clock, so the timer condition holds.

Runs on `9702841b` (lane database as above):

- `PLAYABLE_BROWSER=webkit npm run check:browser plugin-ui-http`, alone, 2 runs: `ok plugin-ui-http 325.9 s`, `ok plugin-ui-http 317.2 s`; each `check: all 1 passed`, with `Profile and collection` and the four `Coin focus at 390 × 844` lines.
- The same, under CPU load (16 `yes > /dev/null` processes on 16 cores, started 20 s before each run and stopped by their PIDs after it), 3 runs: `ok plugin-ui-http 375.1 s` (load averages 22.99 20.20 16.00), `379.4 s` (43.67 29.45 21.62), `372.9 s` (34.82 35.91 28.04); each `check: all 1 passed`.
- `npm run check:browser plugin-ui gui-board-preview` (default browser): `ok plugin-ui 258.9 s`, `ok gui-board-preview 274.2 s`, `check: all 2 passed`.
- `KINGDOWN_TEST_FILE=tools/check.test.ts npm test`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`.
- `npm run typecheck`: `tsc --noEmit` exits 0.
- `npm run test:docs` (with this section): `Test Files  13 passed (13)`, `Tests  166 passed (166)`.

The WebKit run alone is about 40 s longer than before (275-284 s before, 317-326 s now): each pass now has a frame timer turn, and each settled call under the paused clock waits one 1 s round trip.
