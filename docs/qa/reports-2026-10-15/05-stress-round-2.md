<!-- Copied from the run's scratch folder on 2026-10-15. Links to screenshots and raw data point to that folder and do not resolve here. -->

Result: 0 Blockers, 0 Majors, 0 Minors and 1 Polish fault observed. F31 and F32 stay fixed. The original F33 cases pass; two other screens still add an error prefix.

## Build and scope

Test date: 15 October 2026. Frozen build: `1a18046f`.

This round repeats steps 0 and 16–25 of `docs/qa/plugin-qa-protocol.md`. It follows sections 1, 2 and 4–7. It adds command failures, late replies, pending remounts, shared-board widgets and random network failures. Layout checks remain outside this assignment. The known composer and small-phone layout faults are not reported.

The build command is `node tools/plugin-server-build.mjs "$OUT/build"`. All output, scripts and harness caches stay in this output folder. No product file changes.

| Build field | Value |
|---|---|
| HTML bytes | 658,792 |
| Build MCP payload | 661,788 bytes; below the 1,000,000-byte limit |
| Served MCP payload | 661,518 bytes |
| Build URI | `ui://kingdown/board-d24d693e4beac0a50fbe4cd71b9f6b578b248144769f52f84d27ddd1a3474b76.html` |
| Served URI | `ui://kingdown/board-5dc23fe26cfa599c32f55dfd8a907d11757362f1534ccd560a1cb8d81eb2b9c9.html` |
| Official harness | `http://127.0.0.1:58195/` |
| Isolated rules harness | `http://127.0.0.1:61368/` |

The server replaces the art origin for localhost. This changes the resource hash and byte count. The server builder hides the child UI log. `evidence/build.json` uses the UI builder's JSON calculation. `evidence/resources.json` records the bytes read through MCP.

The second harness copies the current fixture into this output folder. Its only test changes allow exact rules positions and stop automatic replies in those positions. The engine and built widget stay unchanged. Later isolated checks use its normal game paths.

| Tier | Surface | Coverage |
|---|---|---|
| 1 | Chromium desktop, 1280 × 800, DPR 1 | Smoke, delayed replies, offline actions, remounts, lifecycle, shared widgets, polls, CSP and random input. Locale `en-US`; time zone `America/Los_Angeles`. |
| 1 | Chromium desktop, 1280 × 800, DPR 3 | Idle CPU, state actions and the 150-move soak. |
| 1 | WebKit phone, 393 × 852, DPR 3, mobile and touch | Smoke and the same recovery, shared-widget, poll, CSP and random-input checks. Locale `he-IL`; time zone `Asia/Jerusalem`. |
| 1 | Phone host copy, 393 × 852 | Full-height frame. Host insets: top 102, bottom 118. Board move, reply and Display check. |
| 1 | Chromium inline, 760 × 800, DPR 1 | Home, board move, reply and Display check. |
| 2 | WebKit tablet, 820 × 1180, DPR 2, touch | Board move, reply and Display check. |
| 2 | Chromium Android stand-in, 375 × 667, DPR 2.625, mobile and touch | Board move, reply and Display check. |
| 2 | Firefox desktop, 1024 × 768, DPR 1 | Board move and computer reply. |

Touch contexts also declare the host touch capability. The phone host copy reports frame 393 × 632 at y=102, section 393 × 580, board 385 × 323 and canvas 302 × 322. This is a saved measurement, not layout approval. See `evidence/surface-phone-host.json/png`.

## Earlier findings

| Finding | Result | Evidence |
|---|---|---|
| **F31 — Late reply** | **Fixed in the tested paths.** Start and Move each pass at 5, 9, 11 and 40 seconds in both engines. At 5 and 9 seconds, release completes the action. At the 11- and 40-second samples, the connection sentence and Retry show. Retry keeps the command ID. A late reply does not replace Bob's later move or a newer game. | `delays.json`; `chromium/webkit-start/move-*.json/png`; `widgets.json`. |
| **F32 — Idle drawing** | **Fixed.** After a seven-second settle, two 60-second samples use 0.018054 and 0.015405 seconds of CPU task time. The earlier round uses about 42.5 seconds. Both new samples use normal motion at DPR 3. | `idle-60s-0.json/png`, `idle-60s-1.json/png`. |
| **F33 — Offline words** | **Original Start and Join cases fixed.** An offline Start, including failure of its first settings request, shows the exact shared sentence. Join does too. Settings and name availability still add `Error:`. This is S2-01 below. | `confirm.json`, `chromium/webkit-F33-original.json/png`, `offline-commands.json`. |

The review fixes also pass. Quiet polls held for 40 seconds show no timeout message or Retry. Mount settings reads held for 40 seconds keep waiting and then recover. Start shows its slow line after five seconds. Pending remounts recover. Presence writes respect the 30-second interval. An old resource hash returns the current page.

## Findings

### S2-01 — Settings and the name check add `Error:` to the connection sentence

- **Step:** 21 and 25. Follow-up to F33.
- **Severity:** Polish.
- **Priority:** P3. Fix when time permits.
- **Class:** **fault**, not taste. The requested sentence is exact and shared.
- **Repro rate:** 4/4 across two routes and two engines. Each route occurs once in a fresh Chromium page and once in a fresh WebKit page.
- **Surfaces:** Chromium 1280 × 800, DPR 1, fullscreen. WebKit 393 × 852, DPR 3, mobile and touch, fullscreen.

Repro A:

1. Open a fresh widget. Select Play → Settings.
2. Disconnect the context as the next `kingdown_settings` request starts.
3. Change Show threats.
4. Read the red error line. Restore the connection and change the setting again.

Repro B:

1. Open a fresh widget. Select Play → Settings → Name and picture.
2. Set the context offline.
3. Type a new valid name. Wait for its availability check.
4. Read the status below the name field.

**Expected:** `Cannot connect. Check your connection, then try again.`

**Actual:** `Error: Cannot connect. Check your connection, then try again.`

The connection instruction is clear, and recovery works. The extra technical prefix is the fault. No game or setting is lost.

**Evidence:** [Chromium Settings](evidence/chromium-offline-settings.json), [Settings screenshot](evidence/chromium-offline-settings.png), [WebKit Settings](evidence/webkit-offline-settings.json), [WebKit screenshot](evidence/webkit-offline-settings.png), [Chromium name check](evidence/chromium-handle-check-words.json), [WebKit name check](evidence/webkit-handle-check-words.json). Matching PNG files show the name checks. The JSON files include calls and console logs. Scripts: `offline.mjs` and `confirm.mjs`.

**Likely cause:** [app.ts:347](</Users/za/Documents/king down chess/.claude/worktrees/qa-1a18046f/src/plugin/app.ts:347>) and [app.ts:377](</Users/za/Documents/king down chess/.claude/worktrees/qa-1a18046f/src/plugin/app.ts:377>) display `String(error)`. This adds the Error object's name to its message.

**Smallest fix:** Display `error.message` for an Error object at these two sites. The existing `showError` helper already does this. Keep the full error in diagnostics. Repeat both offline routes in Chromium and WebKit.

The round 3 ticket describes the shared sentence. No separate open record for these two prefixes is found. This report counts them as one remaining fault in that area. No taste finding is recorded.

## Seen once

None. No product finding depends on a single failed attempt.

## Harness and driver faults

**H01 — The local development host still fails the cold-start target. Also seen in round 1.**

Step 16; harness-only Minor/P2; **fault**; repro 3/3. Surface: Chromium, 1280 × 800, DPR 1, cold inline open. This is separate from the product fault count.

Chromium uses 4× CPU slowdown, 150 ms latency, 1.6 Mbps download, 750 kbps upload and an empty cache. Host navigation to enabled Play takes 18,246, 18,197 and 18,201 ms. The median is **18,201 ms**, above 2.5 seconds. The three Play taps take 147, 165 and 162 ms. Their median, **162 ms**, passes the 300 ms target.

The host loads Vite development code and the SDK. The widget response has 658,549 uncompressed bytes after the localhost rewrite. That response alone takes about 3.31 seconds. This is a failed local measurement. It does not establish the delivery time in ChatGPT.

Likely harness sources: `tools/plugin-ui-harness.ts:52` and its host/resource handlers. The smallest harness fix is a built host with separate host, resource-transfer and widget-ready timings. The real host must then be checked. Evidence: `evidence/performance.json`; script `phase16.mjs`. Production cold-start approval remains open.

**Driver limits, corrected or separated from product results:**

- The first perft process has a stale local port. Its Classic counts complete. The corrected script completes all fixture counts. `perft.json` is the final record.
- The random driver makes 503 Chromium attempts and 508 WebKit attempts to execute 500 inputs in each engine. Three and eight attempts hit a changing overlay or a disabled label, or find no control for one sample. Each later attempt continues. No screen stays blocked. These attempts are not product findings.
- Injected failures produce the intended network diagnostic. Those console entries are separate from unexpected errors. Neither random run has a page error or an unexpected console error.
- Fake-clock poll checks install the clock before page reload. They advance one second at a time and allow each response to finish. Waiting and active-opponent states are supplied by the fixture. They do not measure real presence.

## Checks that pass

| Step | Result and evidence |
|---|---|
| **0 — Smoke** | WebKit and Chromium each play three moves plus three computer replies. Remount keeps the game, position and revision 6. Settings opens and shows Display check. `smoke-phone.json/png`, `smoke-desktop.json/png`. |
| **16 — Speed and errors** | Payload and tap time pass. No long task appears in the measured first-screen intervals. Both idle samples pass after the passive-motion settle. Failed art requests and 1,200 ms art delays do not stop a board move or reply. `performance.json`, `idle-60s-*.json`, `art-fail.json/png`, `art-slow.json/png`. H01 limits the cold-start result. |
| **17 — Model words** | All 23 requested model calls complete. Open results update the widget. Public results contain no position, legal moves, opponent private data or session/trace/request IDs. All 25 tools have matching hints. `kingdown_seen` is an app-only write. `model-tools.json`, `model-final.json`, `tool-hints.json`. |
| **18 — Rules** | All 24 Classic depth counts match the reference table. All 36 fixture counts match the prior main baseline. Board choices reject unsafe castling and pinned en passant. All four promotions work. Stalemate, repetition, the 50-move rule and material draws show the correct result words. Flame Strike gives check. `perft.json`, `perft-main-baseline.json`, `engine-compare.json`, `rules-board.json`, `rules-*.json/png`. |
| **19 — State sync** | Eight-move comparisons, duplicate commands, same-revision races, move/resign races, join, accept and rematch races pass. Database rows confirm one accepted action or game. Both engines also pass shared-board races and game switches with a late reply. `database-sync.json`, `ui-sync-actions.json`, `widgets.json`. |
| **20 — People** | Draw offer, accept and decline work in both directions. Resign, early abort, rematch accept/decline and a past-deadline claim pass. The seeded end card shows rating 1520, +20 and a new badge. Opponent actions arrive by poll. `database-sync.json`, `ui-sync-actions.json`, `20-*.json/png`. |
| **21 — Network and lifecycle** | All 34 UI action failures recover. All 46 pending-command or pending-read remount checks pass. The 18 delay checks pass. Slow links, 30 seconds offline mid-move, 60 seconds frozen, ten hidden minutes and hidden pending moves pass. The remaining word fault is S2-01. `offline-commands.json`, `remounts.json`, `delays.json`, `lifecycle.json`, `confirm.json`. |
| **22 — Tool calls** | All 32 screen/state poll checks pass across Chromium and WebKit. No measured presence interval is below 30 seconds. Real database reads do not update activity. Repeated seen calls within 30 seconds do not update it again. `polls.json`, `database-metadata.json`. |
| **23 — Abuse** | The 40 real-service abuse checks pass. Wrong side/turn, another player's game, private reads, finished moves, own code and bad revisions fail. Long, HTML, RTL, zero-width and look-alike inputs fail. Two batches of 50 code guesses reach rate limiting. No forbidden state change or private view appears. A non-member seen call changes no row. `database-abuse.json`, `database-metadata.json`. |
| **24 — Soak and random input** | One game reaches 150 half-moves with 32 injected failures. All 150 state comparisons pass. Fifteen move retries retain their IDs. Heap growth is 14.92%. Each engine executes 500 random inputs with network failures. No page error, lasting blocked screen or attempt above three seconds appears. `soak-network.json`, `random-input-chromium.json`, `random-input-webkit.json`. |
| **25 — Readiness** | CSP passes on all 14 screens in both engines, plus the pieces, cards and king sheets. Loaded origins stay within the local resource policy. Old and current resource hashes return the current HTML. No ads, purchase prompts, adult content or placeholder screens appear in the tested flows. Privacy words agree with the inspected stored data. S2-01 remains. `csp-surfaces.json`, `resources.json`, and `public/privacy.html`. |

Evidence names in this table refer to `evidence/`, except the two root perft files.

### Network and command coverage

The 17 UI actions are Create, Find, Join, Accept, Cancel, Invite, Choose, Move, Computer, Draw, Resign, Abort, Claim, Rematch, Settings, Handle and Resume. Each fails at its own request boundary in both engines. Create and Find also complete their preceding settings write before the injected failure. Recovery uses the original ID where the tool has one.

The eight other tools are Open, Get, Games, Lobby, Profile, Seen, Say and Report. `remaining-tools.mjs` probes the frozen source client with a real harness fetch. It disconnects before each request, checks unchanged game state, then reconnects and repeats the call. All 16 checks pass. These are client/transport checks, not widget-control checks. Say and Report have no tested visible control. This distinction is recorded in `remaining-tools.json`.

The remount matrix covers all 14 screens in both engines. It includes retained actions and ordinary reads. It tests 17 action paths and six screens with a held quiet read in each engine. A completed command may lead to a board or an end card after remount. Those are expected state changes.

| Network or lifecycle case | Chromium | WebKit |
|---|---|---|
| Start/Move replies at 5, 9, 11, 40 seconds | Pass | Pass |
| Quiet poll held for 40 seconds | No timeout text; no Retry | No timeout text; no Retry |
| Mount settings read held for 40 seconds | Waits, then opens | Waits, then opens |
| Offline after a move commits; reconnect after 30 seconds | One move; same retry ID | One move; same retry ID |
| Hidden for ten fake-clock minutes while Bob makes two moves | 0 hidden calls; Get + Seen on return | 0 hidden calls; Get + Seen on return |
| Hide while a move waits; Bob moves; show and Retry | Both moves remain; same ID | Both moves remain; same ID |
| Frozen for 60 real seconds | Correct view at the first check after resume; 2 ms | CDP-only check |

At 400 ms latency and 400 kbps, Start takes 1,322 ms and the move/reply takes 1,335 ms. At 2,000 ms latency, they take 4,353 and 4,437 ms. Your games and code Join work in both link tests. The opponent move arrives through the normal daily poll in 30,298 and 31,740 ms. No Reload is used.

### Two widgets on one board

Each pair shares the same `board_id`, not only the same game. Two simultaneous legal moves at one revision accept one move. The other widget gets clear stale-revision words. Seven more alternating moves keep both views equal. This repeats twice per engine.

A further case holds a move in widget A. Widget B starts a new game on that board binding. A reaches Retry, reads the new binding and shows the new game. Release of the old reply does not replace it. The old game still contains its one accepted move. Both engines pass. The evidence saves both widgets and Bob's view: `widgets.json` and `*-widgets-*.json/png`.

### Idle tool counts

These are calls in 120 seconds after the initial reads. Both engines give the same counts.

| Screen/state | Reads | Seen |
|---|---|---:|
| Home, Play, Setup, Join, Profile, Collection, Settings, Handle | 0 each | 0 |
| Computer board | 0 | 0 |
| Lobby | 8 Lobby + 8 Games | 0 |
| Friend, Wait, Seat | 24 Get each | 4 |
| Waiting, next 120 seconds | 8 Get | 4 |
| Own turn, daily game | 4 Get | 4 |
| Active opponent | 40 Get | 4 |
| End card with a recent opponent | 40 Get for rematch | 0 in the measured window |

The smallest observed Seen gap is 30,004 ms. The database check also confirms that three Get calls leave `last_seen_at` unchanged. Seen calls inside the first 30 seconds leave it unchanged. A call after 31 seconds updates it; the next immediate call does not.

### Rules counts

| Classic position | Depth 1 | Depth 2 | Depth 3 | Depth 4 |
|---|---:|---:|---:|---:|
| Start | 20 | 400 | 8,902 | 197,281 |
| Kiwipete | 48 | 2,039 | 97,862 | 4,085,603 |
| 3 | 14 | 191 | 2,812 | 43,238 |
| 4 | 6 | 264 | 9,467 | 422,333 |
| 5 | 44 | 1,486 | 62,379 | 2,103,487 |
| 6 | 46 | 2,079 | 89,890 | 3,894,594 |

The 12 fixture variants are default, swap, threats, threats-black, freeze, haste, gallery kings 0/1/2 and apart kings 0/1/2. Each matches the prior main run at `38a6bbff`, depths 1–3. `engine-compare.json` records the comparison.

### Soak and random input

The soak uses seed `0x1a18046f` (437781615), Chromium 1280 × 800 and DPR 3. It samples every ten half-moves after garbage collection. Alice uses the board. Scripted Bob uses the tool endpoint.

| Sample | JS heap bytes | DOM nodes | JS listeners | Documents |
|---|---:|---:|---:|---:|
| Move 10 | 13,446,388 | 1,712 | 200 | 4 |
| Move 30 | 13,912,032 | 1,711 | 200 | 4 |
| Move 150 | 15,452,652 | 1,711 | 200 | 4 |

Heap growth is **14.92%**, below 20%. Total listeners stay at 200. The window-proxy probe returns zero at every sample; the total count is the stronger stability check.

The soak injects 32 failures. Eight occur after the server accepts a request. Fifteen move retries use one ID each. The other failures affect reads. All 150 comparisons keep the two players' position, revision and turn equal. No page error occurs.

The random input seed is `0x1824a7ed` (405055469). Its network seed is `0x1a18046f`.

| Engine | Executed inputs | Injected failures | Longest attempt | Page/unexpected console errors |
|---|---:|---:|---:|---:|
| Chromium | 500 | 18 | 2,973 ms | 0 |
| WebKit | 500 | 17 | 2,968 ms | 0 |

The full input order, failed driver attempts and network failures are saved. The console contains only the expected network diagnostics. Timing and prior fixture rows can change a replay's path, so the saved action trace is the exact record.

## Limits and checks not performed

- Real ChatGPT iOS, Android, desktop and web hosts remain owner checks. The model's choice of tools is not tested here.
- No simulator device is assigned. There is no real-device battery, heat, screen-reader, cellular or full-day two-person test.
- Layout, stale viewport units, touch target size, sharpness and screenshot comparison with main remain outside this task. The report gives no visual release approval.
- Production cold-start time remains open because of H01.
- CSP uses the declared resource domains on the local widget response. It does not reproduce ChatGPT's complete sandbox and cache.
- The fixture does not implement real deadlines, rating updates, code limits or presence. The existing `kingdown_mvp15_test` database supplies the real-service checks. Only disposable test data is written. No schema change occurs.
- The perft comparison uses the saved prior main baseline. No external Chess Programming Wiki request occurs under the localhost-only rule. The standard reference counts are in the script; the repository also covers positions 1–5.
- No full `npm test` run occurs. This report covers the requested QA scripts and direct checks. It does not replace the complete UI protocol or the owner checks.
- No source fix is made. S2-01 still needs its exact confirmation test after a fix.

## Exploration record

The focused exploration is part of the requested steps. Section 9's two additional 45-minute sessions are not requested, and are not claimed.

| Charter | Tested | Result / remaining question |
|---|---|---|
| Explore delayed and lost replies with two engines to find lost or repeated actions. | 5/9/11/40-second replies, 34 UI outages, 46 remount cases, offline mid-move and hidden pending actions. Timestamps are in `delays.log`, `lifecycle.log` and `confirm.log`. | Recovery passes. The two word prefixes remain. Real-host transport still needs the owner. |
| Explore shared state with two widgets to find an old reply that replaces a newer game. | Same board ID, concurrent moves, stale revisions, later opponent moves and a game switch during a held move. | All six cases pass. |
| Explore long use with fixed input and failure seeds to find growth or blocked screens. | 150 half-moves, 1,000 executed random inputs and 67 injected failures across those runs. | Memory, state and input checks pass. No battery conclusion follows. |

## Evidence and cleanup

Scripts, logs and the two perft files stay beside this report. Other JSON and PNG evidence stays in `evidence/`. Files with matching names show the measured state. `plan.md` records the task plan outside the frozen repository.

`evidence/cleanup.json` records the final git status, test-data check and process shutdown. The commit stays `1a18046f`. No repository or git-state change occurs. No secret or environment value is read. No deploy or external network request occurs. All owned browsers and harnesses stop. Ports 58064–58066 remain untouched.

## 10-line summary

1. Build 1a18046f has no observed Blocker, Major or Minor.
2. One Polish follow-up remains: two screens add `Error:`.
3. F31 passes delayed-reply, Retry and late-result checks.
4. F32 uses 0.015–0.018 CPU seconds in each idle minute.
5. The original F33 Start and Join cases pass.
6. All 34 UI outage and 46 remount cases pass.
7. Shared-board races and all 32 poll checks pass.
8. The 150-move soak and 1,000 random inputs pass.
9. Real-host, visual and production cold-start checks remain open.
10. The frozen checkout stays unchanged; owned test processes stop.
