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


## Effects merge and turn-highlight plan

1. Merge `origin/staging/first-game` into this branch. Keep the shared browser
   launcher. Check both loss-case board actions against pending fixture reads.
2. Read all three CI logs. Trace the move sheet and effects changes. Use a held
   host reply to repeat the fault with no sleep. Prove that the old code fails.
3. Fix the cause in the product or test. Add a regression check when needed.
4. Run the full motion file three times in Chromium and twice in WebKit. Run
   the turn-highlight cases ten times in Chromium and five times in WebKit.
   Three Chromium runs use the CPU canvas setting.
5. If product code changes, run the board and UI files once in Chromium and
   the plugin-ui, effects-game, and motion-concepts browser checks. Run the
   full test suite and TypeScript. Record all results and commit. Do not push.

All tests use the specified database and shared lock. No lock is removed.
Commands run in the foreground. The final report lists each check result.


## Effects merge resolution

The fetched effects head is `dc921442`. The only conflict is the Playwright
import in `tools/plugin-motion.test.ts`. The resolved import uses the four
types `Browser`, `FrameLocator`, `Locator`, and `Page`. The test keeps `launch()`
from `tools/lib/checks.mjs`. No direct Chromium launcher remains.

The effects tests add a first See the board action and an end-result reopen
to the loss case. Both board actions can follow fixture reads. The first now
uses `settled()` too. All immediate loss-motion checks stay before this wait.
The earlier live-win and second loss-action waits stay in place.

## Turn-highlight CI evidence

Read command: `gh api repos/SaarShai/king-down-chess/actions/jobs/<id>/logs`.
Raw logs are in the task output folder.

| Job | Commit | Reduced-motion case | Failure report time (UTC) |
| --- | --- | --- | --- |
| 120882822303 | 3e64b566 | 18,969 ms; move-list timeout | 13:30:34.9090065 |
| 120882825596 | edee2889 | 20,147 ms; move-list timeout | 13:37:16.9519654 |
| 120862299715 | 7ed05cb5 | 23,256 ms; move-list timeout | 11:54:11.0796208 |

All three wait 15,000 ms for `#choices button[title="Rd3-d4"]`. None records
the loop pass. The log time alone cannot prove which of the two successful
sends or the failed send reaches the timeout. Job 120862299715 also reports
`strip-me` where the normal-motion test expects `strip-them`; that case takes
7,696 ms. Its failure report time is 11:54:11.0645814 UTC.

## Choices path and cause

The Menu action calls `choices()` only when `canPlay()` is true. `choices()`
replaces the buttons in `#choices`. The Menu then opens that same element in
the move sheet. A remote engine uses `restorePreview()` and `requestPreview()`
to read legal moves. While this read is pending, `canPlay()` is false. The Menu
can still open the empty move sheet.

The preview reply sets `serverDraft` and calls `refresh()`. That function
updates `moves`, marks, status, and strips. The old code does not fill the open
move list. A later equal view also cannot fill it. Waiting 15 seconds cannot
repair the empty list. This is a product fault.

The diff from `b9435fb5` to `dc921442` adds sheet motion and changes its size
measurement. It also adds strip and send motion. It does not add a later
move-list update. The effects head exposes the timing gap; the missing update
is already present in the old choices path.

## Controlled checks and repair

`preview-before.log` records the new regression test with the old product
code. It uses `holdNext = 'kingdown_preview'`. It opens Choose a move while
the reply is held, releases the reply, and calls `settled()`. The open sheet
still has zero `Rd3-d4` buttons. Both motion modes fail on pass 1, in 943 ms
and 618 ms. No sleep controls this order. The final test repeats the sequence
for three fixture positions in each motion mode and stages the move each time.

`refresh()` now updates an open full move list from the current legal moves.
It leaves an equal list in place to keep focus. Piece, card, power, and
promotion lists keep their existing scope. A changed view closes the move
sheet through the existing draw path.

`send-before.log` records a second controlled check. A held `kingdown_move`
reply lets the old host-turn and status waits pass while the frame still
shows `strip-me`. That old assertion fails in 1,287 ms. This is a test gap.
A first repair with a full settled wait also fails: the computer has already
answered. `handoff-state.log` shows pass 1, revision 2, turn 0, the saved rook
move, the computer reply, and no error in both motion modes.

The final handoff test waits for fixture reads before it opens Menu. It holds
`kingdown_computer` before the server runs it. Arrival at that hold proves that
the frame has the successful send reply. The test checks the handoff, releases
the computer call, and waits for settled state before the next fixture. The
last pass still checks a failed send. Temporary probes stay outside the repo.
No new sleep, retry, time limit, helper, or dependency is added.


## Full-file merge follow-up

The first new full-file run reports 24 passed cases and three failed cases.
Two failures come from an added focus check after a new host result. That
result can move focus. The extra check tests a separate behavior and is
removed. The regression still checks the open move list after a held reply.

The third failure is in the normal-motion spent-card test. It opens Menu
before the board move ends; the first press stops that move, so the expected
Close button is hidden. The test now uses `settled()` before card selection
and after all press-motion assertions, before it opens Menu again. This
keeps the immediate motion checks and uses the existing board state wait.
The failed run takes 77.323 seconds. Its log remains in the task folder.

The CI `strip-me` mismatch alone cannot show whether its assertion runs
before the send reply or after the computer reply. Both orders are proved
with controlled checks. The final test holds the computer call, so it checks
the state between these two events.


## Move-list scope correction

The first 20 required motion runs pass. The board and UI run then reports
211 passed cases and three failed Escape cases. It takes 97.534 seconds.
The new refresh uses the cleared selection to identify a full list. That
condition also matches a piece, power, or card list after Escape. The refresh
can fill that list before the sheet closes. These existing tests prove the
scope error.

The repair now records whether Menu opens the full list. Closing any board
sheet clears that flag. Escape also clears the flag before the board refresh.
It keeps the original refresh and focus-restore order. The later-preview
update thus keeps the original list scope. All
required checks repeat after this correction. Earlier logs remain in the
task output folder.


The next board and UI run reports 213 passed cases and one failed case in
95.573 seconds. The All rules Escape case loses board focus when the sheet
closes before the cleared selection hides its opener. The final correction
keeps the original refresh-before-close order. It clears the full-list flag
before that refresh instead. The existing focus test checks this path.


## Final effects checks

All final tests use the required database and shared lock. No lock is
removed. The sequence holds the lock across the tests and browser checks.
Commands run in the foreground. A tool session stays active until the
command ends. The table times exclude the shared-lock wait.

- Board and UI files in Chromium: all 6 files and 214 cases pass; 98.298 s.
  Command: `KINGDOWN_TEST_FILE='tools/plugin-{board,ui}*.test.ts' npm test`.
- Browser command: `npm run check:browser plugin-ui effects-game motion-concepts`.
  All three print `ok`; the command takes 483.401 s. The individual times
  are 268.0 s, 124.2 s, and 88.5 s.
- Full `npm test` in Chromium: 267 files pass; 5,007 cases pass and 8 cases
  are skipped. All 56 artwork cases pass. The command takes 403.462 s.
- `npx tsc --noEmit -p .`: pass, exit 0; 1.147 s.

The final motion repeats follow these checks on the same product and test
code. The task folder keeps all logs and the source hashes.


## Final motion repeats

Full-file command: `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test`.
The focused command also sets `KINGDOWN_TEST_NAME='turn highlight'`. Each
row sets `PLAYABLE_BROWSER` to its named browser. Chromium focused runs
01 to 03 set `PLAYABLE_CPU_CANVAS=1`. All WebKit runs also set that value.
Every successful test command also passes TypeScript and all 56 artwork cases.

| Run | Result | Motion cases | Seconds |
| --- | --- | --- | ---: |
| motion-full-chromium-01 | Pass | 27 passed | 66.996 |
| motion-full-chromium-02 | Pass | 27 passed | 67.198 |
| motion-full-chromium-03 | Pass | 27 passed | 67.483 |
| motion-full-webkit-01 | Pass | 27 passed | 94.838 |
| motion-full-webkit-02 | Pass | 27 passed | 96.321 |
| turn-highlight-chromium-01 | Pass | 4 passed; 23 skipped | 18.252 |
| turn-highlight-chromium-02 | Pass | 4 passed; 23 skipped | 18.161 |
| turn-highlight-chromium-03 | Pass | 4 passed; 23 skipped | 19.007 |
| turn-highlight-chromium-04 | Pass | 4 passed; 23 skipped | 18.998 |
| turn-highlight-chromium-05 | Pass | 4 passed; 23 skipped | 21.624 |
| turn-highlight-chromium-06 | Pass | 4 passed; 23 skipped | 17.771 |
| turn-highlight-chromium-07 | Pass | 4 passed; 23 skipped | 17.735 |
| turn-highlight-chromium-08 | Pass | 4 passed; 23 skipped | 17.656 |
| turn-highlight-chromium-09 | Pass | 4 passed; 23 skipped | 17.564 |
| turn-highlight-chromium-10 | Pass | 4 passed; 23 skipped | 17.714 |
| turn-highlight-webkit-01 | Pass | 4 passed; 23 skipped | 21.362 |
| turn-highlight-webkit-02 | Pass | 4 passed; 23 skipped | 22.347 |
| turn-highlight-webkit-03 | Pass | 4 passed; 23 skipped | 21.480 |
| turn-highlight-webkit-04 | Pass | 4 passed; 23 skipped | 22.199 |
| turn-highlight-webkit-05 | Pass | 4 passed; 23 skipped | 21.987 |

## Final review

All 24 final checks pass. The product and test source hashes stay equal
through that sequence. The board and UI cases cover list scope, Escape,
focus, cards, and powers. The held-preview cases prove the product repair
in both motion modes. The held computer call gives the handoff test a
fixed state between the successful send and the computer reply.

The final product change uses one sheet-state flag and the existing refresh
path. It keeps an equal list in place. It adds no callback system, helper,
dependency, sleep, retry, or time limit. All immediate loss and card-motion
assertions stay before the new state waits. The earlier live-win fix stays.

The diff against the effects head changes only this record, the board module,
and the motion test. `git diff --check dc921442` passes. The index check
against the old motion parent reports two extra EOF blank lines imported
from the effects head, in `ground-fissures.md` and `view-harness.ts`. Those
files stay equal to the effects head. No lock is removed. Work stays on
`staging/motion-race`. No push occurs.
