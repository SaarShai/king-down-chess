# PR 61: Codex-class fault sweep

Status: done

Scope: the plugin client in `src/plugin/` (queue, board, start, screens).
Base: `ba2e775c`. One worktree and branch for each fix group,
`claude/rc-cx-<group>`.

## Plan and checks

1. Finders read the client by area and report P2/P3 faults like the
   Codex review comments.
2. A skeptic tries to refute each report. Only confirmed faults go on.
3. One agent fixes each group with a test for each fault. A reviewer
   checks each branch.
4. Merge the branches into `claude/release-candidate`, run `tsc` and the
   pre-push suite, and push once.

## Result

Nine reports, eight confirmed (one duplicate), one false: the settings
tool never took `show_online` from the live widget.

| Group | Fault | Commit |
| --- | --- | --- |
| queue | A refused Join put the raw server text on every screen. | `7dba93b7` |
| board | A board command that a newer chat result superseded sent a read that stopped the newer mount. | `47b4e7a2` |
| board | Rematch on End did nothing while a pending command of another game or start existed. | `87816af6` |
| start | The quick-start flag stayed on after a Play now that failed or was superseded. | `9cf0937f` |
| start | A start's Choose or Get step lost its Play scope after the player left Play. | `656708a4` |
| screens | An inline chat join lost its preview and code error before Resume. | `37c421ab` |

All four reviews passed. Merged at `65c7058f`; `tsc` passes.

## Codex comments after the merge

- 4307713202 (P2): a refusal stayed after a later Block, because only a
  retained write cleared it. `queue.ts` now exports `userCommand()`, the
  one rule for a user command, and `send()` clears the refusal for each
  user write. Test: 'clears a board refusal when the player then blocks
  the opponent' in `src/plugin/app.test.ts` (red before the fix).
- 4307755876 (P2): a superseded mount kept its server calls running, so
  four quick chat results could hit the limit of three calls for each
  account. Each mount now has an AbortController that aborts when the
  queue detaches the mount (a newer chat result, a user command or the
  teardown); its settings, open, board and list calls take the signal,
  as on main. Test: 'aborts the calls of a mount that a newer chat result
  supersedes' (red before the fix).
- 4307954059 (P2): each name edit started a new check after 250 ms, and
  older checks kept running, so slow checks could fill the account's three
  server slots and refuse Save. The checks now run one at a time; after a
  check ends, only the newest name runs. Test: 'runs one name check at a
  time and then only the newest name' (red before the fix).
- 4307999875 (P2): a Join that got HANDLE_NEEDED after a collapse queued
  the name screen without its Back; the Resume set Back to Home and
  cleared `nameForCaller`, so Save dropped the Join. `navigate()` now sets
  the Back when it queues the name screen, and the Resume keeps it. Test:
  'keeps the Join return through a collapse while its reply asks for a
  name' (red before the fix).
- 4308852602 and 4308969434 (P2): a reopened Profile or Open games
  started a second pair of reads while the first pair still held server
  slots, so the fourth call got 429. A sweep of the client found the same
  fault in six more paths: each return to Play, Try again, the board Menu,
  the wait watch, Unblock, and a mix of screens. One gate in
  `client.call` now sends at most three calls at once for each widget; a
  fourth call waits, the oldest first, and a mount abort drops a waiting
  call. It replaces the Profile counter of `96c95bd7` and `67d66155`.
  Test: 'sends at most three calls at once, the oldest waiting call
  next, and drops a waiting call that its mount aborts' in
  `src/plugin/client.test.ts` (red before the fix).
- The same sweep: a first Settings read that failed with no start to
  retry left Play off with no way out. It now shows the 'connect' notice,
  whose Try again loads the widget again, and a later good Settings read
  clears it. Test: 'offers Try again when the first Settings read fails
  with no start to retry, and clears it when a later mount reads them'.
  Not changed: a call that times out on the client (10 s) frees its gate
  slot while the server still holds its own; this needs a server that
  takes more than 10 s for each of three calls.

## CI

- `test` on `dc966b69` failed once in 'recovers a lost seat Ready before
  the computer makes the first move after remount'. The computer's first
  move is a retained command, so `pending` was `kingdown_computer` while
  the slow runner made the move. The test now waits for that move, then
  checks that no command is pending. The checks are the same.
- The Validate workflow never passed on this branch: `verify` and
  `browser` stopped at their 15-minute limits on every run. The release
  candidate's `npm test` takes about 15 minutes on the runner (main: 7),
  and plugin-ui on Chromium about 2.5 times its local 194 s. Saar,
  2026-10-18: "Raise CI limits". `STEP` is now 2 for Chromium on CI (3
  for WebKit, 1 locally), and `verify` and `browser` have 30 minutes.
- The full WebKit plugin-ui check on CI stopped once for 90 s on the
  Settings row of Play (`plugin-ui-check.mjs` openScreen, after the
  threats-black viewport loop); it passes on macOS WebKit in 220 s. Saar,
  2026-10-18: "Investigate now". `openScreen()` now logs the lock, the
  row's box over two frames and the frame rate when a click stalls.
  The cause is in the harness: one host page keeps each old widget
  document across about 120 remounts. `freshHost()` now loads the host
  page again at seven block boundaries (`ffebd8ee`, `b3f0ab5d`; ticket 45).
  The macOS WebKit GPU peak falls from 15.4 GB to 3.9 GB.
- After the limits change, four other checks failed once each and
  passed on the run before. Each one is a race in a test, not a product
  fault. No limit or assertion changes.
  - "The dealt Vault has a move": a random army can have no rook, bishop
    or queen. The card game now has no fairy pieces (ticket 48).
  - The WebKit card coin face read 44 px one frame early, and a WebKit
    Send click stalled in Playwright's stable wait. The test waits one
    more frame, and the click uses `clickButton` (ticket 49).
  - "moves the keyboard cursor while the opponent move animates" missed
    a 189 ms animation. The test holds the animation until the real key
    arrives and records that the board was animating (ticket 50).
  - plugin-ui on Chromium stopped with "socket hang up" on a fixture
    call. The harness server closed idle sockets after 5 s, and
    Playwright reuses its sockets. The server now keeps them
    (`plugin-ui-harness.ts`, `keepAliveTimeout = 0`).
  - With the host reloads, CI WebKit reached the M2 win check for the
    first time. Its sampler started after the 1.1 s ceremony had ended
    (one sample, no words). The sampler now starts in the page before
    the winning snapshot.

## Round 2 (base `65c7058f`)

Ten reports, eight confirmed (two duplicates), two false: the server
does not refuse the live board's one-action turns, and a resent PR 57
start keeps its king pick.

| Group | Fault | Commit |
| --- | --- | --- |
| queue | A failed Find from Open games showed no error and no Retry there. | `953a39c8` |
| queue | A name saved after an Accept or Join HANDLE_NEEDED resent an unrelated pending command. | `05de157d` |
| board | A failed turn kept 'Sending…' next to the Retry error. | `9271c54d` |
| start | A failed handoff Choose or Get left Play the computer on, so a second tap made a second solo game. | `4ab7f979` |
| screens | A collapse to inline cleared the Join code, the preview and the Save follow-up before Resume. | `a202dcde`, `03533659` |
| shared | The web game read capitalized the piece name. | `e1713bc6` |

Not changed: a rename from Settings or Profile still resends an old
failed start; 'recovers a lost Create or Find reply when Save resumes the
pending start' tests that on purpose.

All six reviews passed (screens after one fix-up and a second review). A
review of the merged result found no fault. Two merge conflicts, both in
`app.ts`, keep both sides: the start lock list has `find-opponent`, and
the handoff locks `wait-computer`; a name screen opened again sets its
Back and clears `nameForCaller`, except on the Resume after a collapse.
A known limit here (a Join that gets HANDLE_NEEDED after a collapse lost
its Back to Join) is fixed: see Codex comment 4307999875 below.
