# Part 01: the reply stays off the page thread

Status: ready-for-human

Spec: [Reply](../spec.md). Blocked by: none.

## Scope and plan

### 1. The worker starts when the game opens (speed audit fix 2, first half)

- `src/interface/play/main.ts` `start()`: when the board can draw (`board.ready()`), the page calls `engine.prepare(game)`. The worker then loads its code while the player chooses a move. It starts after the first frame, so it does not take bandwidth from the board (decision 43).
- `src/game.ts` `Engine.prepare(game)`: starts the worker of this game. It does nothing when the worker of this game exists. For another game it cancels the old worker first, as a search for a new game does.
- Back to home still stops the worker (`engine.cancel()`); Continue starts a new one when the board shows.
- Tests (`src/engine-ready.test.ts`): "prepare starts the worker of the game before its first search, and the search uses that worker". Browser checks `first`, `continue` and `matrix` (design project, `parallel/speed/run/tools/reply-check.mjs`): the worker starts before the first search, at each size of the size matrix.

### 2. The fallback timer starts at "ready" and waits 8 s (speed audit fix 2, second half; opponent R1)

- `src/ai/worker.ts`: when its code has loaded, the worker sends `{ ready: true }`.
- `src/game.ts`, option `waitReady`: the timer of a search starts at that message (at the request when the message came before) and waits the move time plus 8,000 ms. Then the page thread searches, as before. When the worker fails (an `error` event), its search goes to the page thread at once.
- Before, the timer started at the request and waited the move time plus 2,500 ms. On a slow link the worker code took longer than that, so the page thread searched each reply of the game and blocked the page for 0.5 to 0.8 s each time.
- Tests (`src/engine-ready.test.ts`): "waits for the worker's "ready" message, then gives the search the move time plus 8,000 ms", "starts the timer at the request when the worker was ready before it", "gives the search to the page thread at once when the worker fails before it is ready", and the guard "the old engine (no option) still gives up the move time plus 2,500 ms after the request".

### 3. The time-check fault of the slow card replies (opponent F2 and R5)

- Cause: the search reads its clock each 128 nodes. A Beast next to a group of enemy pieces lists each chain of captures as one move. In the audit position (seed 2300005, ply 15) one node of the capture search lists up to 54,590 moves (about 50 ms each), so 128 nodes took about 0.77 s and a Clever reply took 1.4 to 1.7 s against its 800 ms budget.
- `src/ai/search.ts`, option `workClock`: the search counts the moves that it lists. Over 4,096 moves since the last read, the next node reads the clock. The stop rule does not change; the search only sees the deadline sooner.
- `src/game.ts`, option `workClock`: the engine sends `workClock: true` with each search, to the worker and to the page-thread search.
- No other search change: the same nodes, the same order, the same evaluation, the same time budgets. With the option off, the search reads the clock as before.
- Tests (`src/engine-ready.test.ts`): "reads the clock at the next node after a long move list" (a Beast next to the full back two ranks: 64,710 moves), the guard "without the option, reads the clock each 128 nodes only", and "sends workClock with each search when the option is on".

### 4. The two document-drift errors of `npm run balance:check` (opponent F7)

- `docs/RULES.md` sections 1 and 4 changed after their pins in `src/balance/design.ts`: section 1 got the Classic setup (castling, en passant, FEN fields) and the history-limit draw; section 4 got the Freeze and Ice Wall mark that follows its piece and the Strike pawn rule for the first and last rank. Each new line records a dated owner decision and agrees with the code (`classicChess` in `src/rules/rules.ts`, the history draw in `src/match/`, the mark and Strike rules in `src/rules/engine.ts`).
- The document is correct; its two pins were old. The two pins now hold the reviewed text. No rule and no text of the document changes.
- Test: the existing drift case of `src/balance/schema.test.ts` ("has no unreviewed baseline drift", run with `KINGDOWN_BALANCE_DRIFT=1`) and `npm run balance:check`: 2 errors before, 0 after.

### 5. Soak fault 2 (the page did not answer for 60 to 90 s)

- The game (seed 1057, Club, Pieces only, a Beast on each side) did not fail again in two reruns on the build before this part and two on the build after it. The engine's random choices are not seeded, so a rerun plays another game.
- What the stage found on the build before: Back to home stops the worker, and the first search after Continue starts a new one. On slow 4G its code did not load in 3.3 s in 2 of 2 runs, so that search and each later search of the game ran on the page thread. The soak machine ran 4 browsers and other lanes, which slows a load in the same way. On the page thread, a search in a position with long Beast chains can run past its budget for the length of 128 nodes (part 3).
- What this part changes: the new worker starts when the board shows, the timer waits for "ready", and the search reads its clock after long move lists. The page thread searches only when the worker fails. The cause of a stop of 60 to 90 s is not proven.

### Shared module rule

- The old page, the match worker and the tools do not pass `waitReady` or `workClock`. Their engine starts its worker at the first search and keeps the 2,500 ms timer; their search reads the clock each 128 nodes. The guards in `src/engine-ready.test.ts` and the old tests of `src/game.test.ts` pass.
- One change reaches every worker: the `{ ready: true }` message. An engine without `waitReady` reads only messages with the id of its search, so it ignores the message.

## Verification

See the stage report (design project, `parallel/speed/run/report.md`, section "Stage reply") for the logs, the evidence files and the screenshots.

- The browser checks on slow 4G with a 4 times slower processor (Chromium, 390 × 844, reduced motion), before and after, 7 games each (Club Pieces only, Club Pieces only with Back to home and Continue, Clever with powers and cards):
  - Replies that block the page for more than 200 ms: 28 of 28 before, 0 of 28 after. The longest block in a reply: 366 to 827 ms before; after, no task over 50 ms and no frame gap over 100 ms.
  - Searches that went to the page thread: 9 before, 0 after.
  - The first reply: a median of 8.6 to 9.1 s before, 3.3 to 4.0 s after. The check plays its first move 0.5 s after the game opens; the worker code needs 3.1 to 3.3 s on slow 4G, so a player who takes that long gets a reply in the move time.
- Without network throttling (CPU 4×), each reply stays in the worker before and after; the longest task is 57 ms.
- The audit position (seed 2300005, ply 15): Clever 0.83 to 1.69 s before (over 1.38 s in 11 of 14 runs), 0.800 to 0.804 s after (6 runs); Casual 0.70 to 0.71 s and Club 0.80 s after. The largest time between two clock reads: 732 to 797 ms before, 21 to 23 ms after. The depth (2) and the node count (about 48,300) stay the same.
- Strength: the audit's 108 fixed positions at full budget (324 searches), with and without `workClock`: the median depth is the same at each level (Casual 4, Clever 4, Club 5); 276 searches reach the same depth, 45 one ply deeper and 3 one ply shallower; the worst time is 703, 802 and 802 ms with the option and 824, 811 and 808 ms without it.
- `src/engine-ready.test.ts` adds 8 tests. With the two options turned off in the code, 5 fail (the new rules) and 3 pass (the two guards and `prepare`).
- `npm test`, `npm run test:docs`, `npm run balance:check` and `npm run build` pass. No test is removed, skipped or weakened.

## Repair (after two independent checks)

- Fault: in WebKit a reload while the worker code loads failed the worker, and the page sent a false error report. WebKit sends this error just after `beforeunload` and before `pagehide`. With `waitReady`, the engine now does not report a worker error after `beforeunload` or `pagehide` (until `pageshow`). The worker cleanup and the page-thread search stay. Without the option nothing changes. After: no report in 5 reloads during the worker load (before: 4 of 4); a blocked worker file still gives one report and a reply from the page thread in 2.0 s, in Chromium and WebKit.
- Fault: no test failed when the worker's "ready" message, the `workClock` option of the new page or `engine.prepare(game)` was removed. Now a unit test imports `src/ai/worker.ts` with a stand-in `self` and expects `{ ready: true }` first, and two source tests read `src/interface/play/main.ts`.
- Tests (`src/engine-ready.test.ts`): "does not report a worker that fails while the page unloads (WebKit on a reload); the old engine still reports it", "the worker sends its "ready" message when its code has loaded, before any search", "the engine of the new page waits for "ready" and reads the clock after long move lists", "the new page starts the engine worker when the board shows". Each fails with its fix taken out.
- Not changed: a worker whose code request stalls with no error has no time limit (decision 44 starts the timer at "ready"). The lead decides if an outer limit is necessary.

## Known limits

- The Beast's chain list grows very fast with the size of a group of enemy pieces: a Beast next to the full back two ranks lists 64,710 moves (48 ms), a Beast in a 4 × 4 group of pawns 514,669 moves (238 ms), and in a 5 × 4 group the list does not fit in 4 GB. The clock cannot stop inside one list. This is a rule of the pieces, outside this part; the stage report lists it as a carry item.
- On slow 4G the worker code takes about 3.2 s after the board shows. A move in that time waits for the worker.
- The worker is not throttled in the checks (Chromium does not throttle a worker's processor). On a slow phone the search reaches less depth in the same time; that is the level question of decision 46, not this part.
