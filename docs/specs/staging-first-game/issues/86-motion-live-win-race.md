# 86 — Trace the live-win input timeout

Status: resolved
Type: task

## Scope

Trace `mate()` in `tools/plugin-motion.test.ts`. Keep all work on this branch.
Do not push.

## Plan and checks

1. Read both named CI logs. Record each result and its time.
2. Trace pointer input, selection, move preview, and Send state.
3. Hold one message to make the old test fail without a delay.
4. Fix the cause at the correct layer. Keep a repeatable check.
5. Run the required browser tests and TypeScript check. Commit the work.

The live-win cases must pass 10 times in Chromium and 5 times in WebKit.
The full motion file must pass once in each browser. If product code changes,
run all board and UI test files in Chromium and the plugin-ui browser check.
Every test uses the specified local test database and the shared test lock.

## CI evidence

The named logs do not show the reported live-win timeout.

- Job `120828457095`, run `40079010554`, commit `583a5f54`: both live-win
  cases pass. Normal motion takes 9,324 ms. Reduced motion takes 3,437 ms.
  The file report time is `2026-10-24T08:54:44.1000096Z`.
  All 257 test files pass. The job then fails at
  `tools/plugin-protocol-check.ts:87:68`: expected `daily`, actual `undefined`.
  The assertion time is `2026-10-24T08:57:24.4173670Z`.
- Job `120862299715`, run `40090602354`, commit `7ed05cb5`: both live-win
  cases pass. Normal motion takes 9,196 ms. Reduced motion takes 4,116 ms.
  The reduced-motion report time is `2026-10-24T11:49:12.6466667Z`.
  Two turn-highlight cases fail. The normal-motion case expects `strip-them`
  and gets `strip-me`. The reduced-motion case times out after 15,000 ms
  at `#choices button[title="Rd3-d4"]`, line 147. The failure report times
  are `2026-10-24T11:54:11.0645814Z` and `2026-10-24T11:54:11.0796208Z`.

Read command for each job: `gh api repos/SaarShai/king-down-chess/actions/jobs/<id>/logs`.
The raw logs stay in the task output folder, outside the repository.

## Input path

- `PaintedView.onDown()` stores the pressed square. `onUp()` calls
  `onSquareClick` for a tap. A drag calls `onDragSelect` first.
  `pastTap()` checks distance: 6 px for a mouse, 12 px for touch or pen.
  It has no time window between two taps.
- During a move animation or king fall, the document pointer handler consumes
  the press and stops the animation. The press does not select a square.
  A cancelled pointer, a second pointer, a non-left button, or a press outside
  the board does not give a normal square tap.
- `bindBoard()` calls `select()`. During an animation it stops the animation
  and returns. With no view or position, `select()` returns.
- `canPlay()` requires an available game, a playing status, a ready action,
  and a turn that does not wait for Send. It also requires all locks to clear.
  The locks cover connection, mount, write, retained command, stale read,
  animation, preview request, and missing server preview for a remote engine.
- A first own-piece tap sets `selected`. A legal target tap calls `choose()`.
  A local move calls `stageMove()` at once. A remote move first requests a
  server preview. `stageMove()` adds a draft step and starts its animation.
  `turnControls()` enables Send when the draft is ready, the board screen is
  active, no sheet is open, and all locks clear.

## Selection changes and blocks

- A tap on the selected square or on an unmarked empty square clears it.
  A tap on another own piece selects that piece. An enemy-piece tap reads it.
- A staged move, Undo, Escape, or arming a card or king power clears it.
- A failed read marks the board stale. The next refresh clears the selection.
- `draw()` clears it for a new game, revision, position, status, or engine ID.
  It rejects an older revision of the same game. An unchanged view keeps it.
  A poll that changes only time, opponent data, or available actions does not
  clear it. A screen or lock refresh alone does not clear it.
- Page teardown discards board state. A pointer cancellation discards the
  current press but does not clear an earlier selection.
- A pending move preview blocks play. Its result can change the local position.
  A superseded preview cannot publish its result because the generation,
  account, game, revision, and engine checks must all pass.
- The end-screen time guard covers result actions. It does not cover the two
  board taps before checkmate.

`#board[aria-busy="false"]` checks artwork only. The `board.ready()` promise
sets it once. It does not check game reads, mounts, or preview requests.

## Controlled probes

Command for both old-code runs:
`KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts KINGDOWN_TEST_NAME='probe live win' npm test`.
Both runs use the required database setting and wait for the shared lock.

1. Hold the first `kingdown_preview` reply with the existing host hook.
   Wait for the held call, artwork, and `Your move`. Tap a1 and a8. Release
   the reply. Assert that Send is enabled. The assertion fails: `aria-disabled`
   is `true`, not `false`. The case takes 1,015 ms. No delay controls the order.
2. Add an enabled-Refresh wait to prove that the mount ends before the taps.
   The same probe fails in 865 ms. There are zero choice buttons before the
   taps and after a1. The a1 tap reads `White Queen.`. After the reply arrives,
   `settled()` completes, but Send stays disabled. A late mount does not cause
   this controlled failure.
3. In the second run, wait for readiness, select a1, and check that `Qa1-a8`
   is an available choice. Send an equal view through `harnessShow()`. Wait
   for readiness again. The choice remains. Tap a8. Send becomes enabled.
   This control passes with the old product code.

The first run reports one failed case and 19 skipped cases. The second reports
one failed case, one passed case, and 19 skipped cases. The failures are
intentional probe results. TypeScript passes in both runs. The task output
folder holds both probe source files, patches, and logs. The final test file
does not contain the temporary probes or their logs.

## Cause and change

This is a test readiness fault. The compiled page and the source fixture use
different engine IDs. The page correctly requests the server's legal moves.
`restorePreview()` starts that request. While it waits, `canPlay()` is false,
but artwork and `Your move` can already be ready. The old helper treats those
two states as permission to send board input. The a1 tap reads the queen;
it does not accept a move selection. The a8 tap thus cannot stage `Qa1-a8`.
Releasing the reply cannot restore a selection that the board never accepts.

An equal view does not clear the accepted selection in the control. The
reported selection-clear theory does not explain the controlled failure.
The named CI jobs also do not establish that theory or the reported timeout.
The probe establishes a local path to the same disabled-Send state.

`mate()` now calls the existing `settled(page, frame)` helper before a1.
It checks host calls, frame message delivery, mount completion, and board
animation state. No test retry, sleep, or larger configured limit is added.
The comment at the wait records the artwork/preview distinction for later
test changes. Product code stays unchanged.

The test file now uses the existing browser launcher. It honors
`PLAYABLE_BROWSER`; before this change, every run starts Chromium.
The default for this file remains Chromium.

## Full-file check follow-up

The first full Chromium run reports 18 passed cases and one failed case.
Both live-win cases pass. The loss case times out after 15,000 ms at
`#moves-line`. The open end dialog intercepts the click after See the board.
This path does not call `mate()`.

The loss test sends a second finished-game fixture result and then acts on
the first visible result card. It does not wait for all reads from that
result. It now calls the same `settled()` helper before See the board.
The direct loss-motion assertions stay before that wait. Thus, the wait
cannot hide an unwanted loss animation by letting it finish first.


## Final checks

Every test uses:
`PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_firstgame_test`.
Every test waits for the shared lock. No lock is removed. The final sequence
holds the same lock across all 17 runs. All commands run in the foreground.
The tool returns a session for long commands; the session ends before the
next phase starts.

Full-file command:
`PLAYABLE_BROWSER=<browser> KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test`.

Focused command:
`PLAYABLE_BROWSER=<browser> KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts KINGDOWN_TEST_NAME='live win' npm test`.

Each successful run also passes the package's TypeScript and artwork checks.
The table time includes `npm test`; it excludes the shared-lock wait.
The first row is the failed run before the loss-case wait.

| Run | Scope | Result | Motion cases | Seconds |
| --- | --- | --- | --- | ---: |
| motion-full-chromium | Full file | Fail; loss case | 18 passed; 1 failed | 45.688 |
| motion-full-chromium | Full file | Pass | 19 passed | 36.272 |
| motion-full-webkit | Full file | Pass | 19 passed | 41.705 |
| live-win-chromium-01 | Focused | Pass | 2 passed; 17 skipped | 7.743 |
| live-win-chromium-02 | Focused | Pass | 2 passed; 17 skipped | 7.662 |
| live-win-chromium-03 | Focused | Pass | 2 passed; 17 skipped | 7.687 |
| live-win-chromium-04 | Focused | Pass | 2 passed; 17 skipped | 7.621 |
| live-win-chromium-05 | Focused | Pass | 2 passed; 17 skipped | 7.614 |
| live-win-chromium-06 | Focused | Pass | 2 passed; 17 skipped | 7.660 |
| live-win-chromium-07 | Focused | Pass | 2 passed; 17 skipped | 7.646 |
| live-win-chromium-08 | Focused | Pass | 2 passed; 17 skipped | 7.676 |
| live-win-chromium-09 | Focused | Pass | 2 passed; 17 skipped | 7.648 |
| live-win-chromium-10 | Focused | Pass | 2 passed; 17 skipped | 7.685 |
| live-win-webkit-01 | Focused | Pass | 2 passed; 17 skipped | 7.690 |
| live-win-webkit-02 | Focused | Pass | 2 passed; 17 skipped | 7.533 |
| live-win-webkit-03 | Focused | Pass | 2 passed; 17 skipped | 7.603 |
| live-win-webkit-04 | Focused | Pass | 2 passed; 17 skipped | 7.591 |
| live-win-webkit-05 | Focused | Pass | 2 passed; 17 skipped | 7.606 |

- `npx tsc --noEmit -p .`: pass, exit 0.
- `git diff --check`: pass.
- Product code does not change. The conditional board and UI test files and
  `npm run check:browser plugin-ui` are not required.
- These focused runs are not a full repository test run.

## Review

The final test change uses the existing wait and browser launcher. It adds
no helper, dependency, product behavior, sleep, test retry, or time limit.
The wait precedes the live move. The loss-motion assertions precede the
loss-case wait. The temporary probe code is absent from the final change.
The work stays on `staging/motion-race`. No push occurs.
