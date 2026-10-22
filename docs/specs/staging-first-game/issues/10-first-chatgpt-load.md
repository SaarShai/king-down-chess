# Reliable first ChatGPT load

Status: the controlled blank-frame path has a captured cause and a verified readiness procedure. Ten fresh controlled opens pass on unchanged `fd853122`, without Try again. The vendor's idle response-release defect is not patched. The separate post-mount settings failure is captured and repaired in ticket 47 by serverless transaction pooling and idle cleanup. Source `64205cdf` passes ten distinct clean fresh opens and later notice checks; the older error screenshot is retained as red evidence. See the [current diagnosis](../browser-controller-startup.md). Do not claim general startup reliability.

Owner request: fix the first-load failure and verify fresh ChatGPT opens without **Try again**. Keep all changes in staging.

## Current follow-up

Ticket 34 exercises actual interrupted requests on staging source `5ac73cc9`. The browser-control-attached tab again shows Couldn't display King Down Staging after navigation and reload; Try again mounts the app. Console capture supplies induced ten-second SDK timeouts and host cache warnings, not a decisive new startup cause. The successful transaction recovery does not close first-readiness reliability. Reuse the earlier attachment controls and native-open evidence; do not repeat the minimal probe or add a hidden retry. See [the bounded recovery result](34-host-recovery-and-account-switch.md).

On product `be0786da`, preview `dpl_Tx6SkvtZnmT7R15NumP1Srp8owM6`, one native mount shows `Internal error` after the game list loads. Selecting a saved game works without **Try again**. Three later native direct-URL opens reach enabled controls, and the last resumes all eight accepted feature actions after refreshing the staging tool definitions. No matching server tool error appears in the inspected deployment logs. The origin is unknown; do not attribute it to the earlier debugger failure without evidence.

See [the current host proof](../../game-ownership/owned-staging-proof.md) and `evidence/staging-game-ownership/startup-matrix.json` beside the application repository. These checks use a warm signed-in profile. Keep a follow-up open to locate the boundary if the error recurs. Do not add a speculative retry or weaken security. The records below preserve the earlier diagnosis.

## Baseline

The application branch is `e41fe5f6`; the active staging product is `01cbe379`, preview `dpl_FtPtUzjWoYNbtzvMLXUgRhrGVW3E`. [The previous trace](09-real-host-proof.md) proves the game round trip and records the startup failure. Do not repeat game integration work or infer that HTTP 200 proves browser execution.

## Plan

1. Reproduce a fresh open with a measurable ready/error outcome. Compare browser entry and observation paths to rule out a test-tool artifact.
2. Locate the first failing boundary: host sandbox navigation, resource delivery/execution, bridge connection or application mounting. Change one variable per probe.
3. Fix the confirmed cause with the smallest complete change. Keep OAuth, CSP, account ownership and gameplay intact.
4. Run relevant regression/build checks and an independent review. Publish only to the isolated staging preview.
5. Verify at least five fresh opens without retry, including a direct app URL and opening from the plugin page. Confirm the game still resumes. Remove temporary traces and record evidence.

## Acceptance

- A repeatable failing case becomes green without **Try again** or automatic hidden retries. If the test tool causes the stall, prove the effect with attachment/detachment controls and correct the verification procedure. Do not call that an application or tool repair.
- Five fresh real-host opens reach enabled controls; record entry path and observed time.
- The existing staging account/game still resumes with the saved history and result.
- No production change, weakened security control, secret capture or speculative framework.
- The final source, preview, checks and remaining limits are recorded.

## Isolation checks

The unchanged product passes three native Chrome direct-URL opens, with controls confirmed after browser-tab attachment where needed, and five fresh widget mounts through **Plugins → King Down Staging → Open plugin** in a control tab. Each widget mount has a new iframe initialization ID and enabled **Start game** controls. No trial uses **Try again**. These are not cold-cache browser tests. Observed ready times are upper bounds, not load-time measurements. Evidence: `evidence/staging-first-load/launch-matrix.json` in the new project.

Browser API document creation/navigation/reload still reproduces the error before observed game HTML. This association does not prove an automation defect or an application defect. Exclude the native reload comparison: the owner changes foreground windows during the check, and a completed reload is not established.

Probe plan: an isolated worktree replaces only the widget HTML and bootstrap with static text and the same App SDK. Keep the endpoint, resource metadata, OAuth and CSP. Observe HTML, connection and first tool-result status. Build with `plugin:build:ui`, record bytes/hash, then publish a temporary staging preview. Compare a browser API open and the plugin entry. Restore the verified product preview and tool definitions after the probe. Do not merge diagnostic code.

## Minimal panel result

The temporary `staging/first-load-minimal` worktree changes only `src/plugin/index.html` and `src/plugin/bootstrap.ts`. Its HTML shows a fixed heading and startup status. Its bootstrap imports the same App SDK, registers the first tool-result handler and connects. It has no game engine, board, artwork, account UI, polling or retries.

`plugin:build:ui` and `build:vercel` pass. The resource is 233,852 bytes, with SHA-256 `6cd14d9b1d0fabad0d2f42d5bc1c930e09917c787f8d89db975d5e1c7efac0a2`. Preview `dpl_pFcXp3DSAs7nx6vpb1ypYApXpTpL` belongs to `kingdown-staging`; the deployment guard confirms the preview target.

- A browser API direct open fails with the same host error. No probe text is observed.
- **Plugins → Open plugin** also fails in the previously affected browser-API-created tab.
- The same entry succeeds in the native-created control tab. It shows **Connected** and **First tool result received**, with a new iframe initialization ID.

Thus the game code and artwork are not necessary for this failure. The evidence supports an association with the browser/tab startup path. It does not establish whether the cause is browser automation, the host, shared SDK behavior or resource delivery. The five passing widget mounts do not establish reliability in every tab or browser.

Evidence: `evidence/staging-first-load/minimal-probe.json`, `minimal-direct-failure.png` and `minimal-control-connected.png`. The fixed status text contains no account data or tool payloads.

## Initial review and remaining boundary

An independent reader confirms that the earlier application-bug attribution was too broad. Do not call this fixed while the repeatable failing case remains red. Do not count a model's response as proof that the board resumed. Require the saved history in the actual widget.

The available browser APIs expose rendered state and console logs, but not the host's sandbox-delivery messages or debugger target state. A more precise diagnosis requires that boundary trace or an independently controlled browser session. Do not add a hidden retry, weaken CSP/auth, or rewrite game startup to mask this unconfirmed cause.

## Restore and game check

The staging alias resolves to the original ready preview `dpl_FtPtUzjWoYNbtzvMLXUgRhrGVW3E` after the probe. ChatGPT's staging tools are refreshed. A warm tab retains the probe panel; a new native-created tab loads the restored game on its first attempt, without retry. This is a fourth successful native direct-URL control.

Game `cbee2c5b-2745-89d7-a96d-c93e88f9dbae` is created before the probe with Classic chess, computer Beginner and White. The widget commits `e2–e4`; the computer replies `g7–g6`. The clean restored page lists the game. Opening it and its Moves panel shows both saved moves. The website opens `/g/cbee2c5b-2745-89d7-a96d-c93e88f9dbae` and shows the same two moves. Screenshots: `active-game-before.png`, `restored-first-open.png`, `resumed-chatgpt.png` and `resumed-web.png`.

The temporary preview is deleted and its worktree removed. `minimal-probe.patch` retains the two-file probe for reproduction; no diagnostic code is merged. The application remains `01cbe379`. No production deployment, account, database or security setting changes.

At this checkpoint, acceptance remains incomplete: the native-created control tabs and saved-game checks pass, but the repeatable failing host/browser startup path is still red. Independent review checks the records and matching history screenshots; its two wording corrections are applied.

## Continued diagnostic plan

The owner requests another route to the missing startup diagnostics. Inspect supported browser capabilities and Chrome DevTools through the available UI controls. Capture only fixed startup method names, request status/timing and debugger state; exclude credentials, headers and account payloads.

Ranked predictions:

1. A new sandbox target pauses under the debugger. A paused-frame indication or target event precedes missing HTML; resuming it makes the same first attempt connect.
2. Sandbox navigation or a required request stalls. Network diagnostics show the failed or pending boundary before the host error.
3. The sandbox loads but host-to-panel delivery stalls. The loaded proxy lacks its resource-ready/initialize transition, while a passing control completes that transition.

Keep the repeatable browser-API failure as the red case. Verify a cause-specific fix against that case and at least five fresh game opens without retry. Preserve the existing staging game and restore/remove each diagnostic probe.

## Native diagnostic result

Chrome DevTools provides a second diagnostic route. The failed load shows a blank game document before the host error. Sources shows only the main thread and **Not paused**. Protocol Monitor does not expose a decisive child-frame event. Thus a specific paused target or protocol command is not established.

The attachment controls provide stronger evidence:

1. In the failing browser-API-created tab, cancel the **ChatGPT started debugging this browser** session. Use Chrome's Reload button. The unchanged game becomes ready with a new frame ID.
2. Attach browser control again. Use the same native Reload button. Navigation stalls with the previous frame still visible. Cancel the debugger; the pending navigation proceeds and a new game frame becomes ready. No further reload or game retry is used.
3. Close DevTools. A browser-API reload shows **Loading app** at 21 seconds. Cancel the debugger only. Game HTML appears immediately, and the next observation shows enabled controls.
4. Repeat in a new native-created tab. Its first direct open passes. After debugger attachment, native Reload still shows the old frame at 19 seconds. Cancel releases the pending navigation. A new frame and enabled controls are observed within 20 seconds of detachment.

The product, account and URL are unchanged during these comparisons. No cache clearing or cache-setting change is performed. The pattern occurs with DevTools open and closed. It supports browser-control debugger interference in these reproductions. It does not identify the exact debugger/host mechanism or prove that every possible startup failure has the same cause.

Console cache warnings, a host thread-request 404 and a host runner CSP warning also occur in passing loads. They do not justify a game, auth or CSP change.

Evidence in `evidence/staging-first-load/`:

- `debugger-crossover.json`: ordered actions, observations and known elapsed times.
- `debugger-detached-same-tab.png`, `first-attempt-released.png`, `attached-native-reload-stalled.png`: control states.

## Corrected verification and outcome

Use native Chrome controls for first-load acceptance. Open a new tab, then the direct app URL or **Plugins → King Down Staging → Open plugin**. Keep the browser-control debugger disconnected until enabled game controls are observed. Browser-tab inspection can attach it again; do not use that inspection during this control. Record a new frame ID and distinguish first readiness from retry recovery. See [the connection procedure](../chatgpt-connection.md).

Five distinct native first opens pass: four direct app opens and one plugin-page entry. Each has a distinct frame ID and enabled **Start game**. No **Try again**, automatic retry, debugger attachment or detachment before readiness, or application change is used. Run 1 is the native control later reused for the attachment test; runs 2–5 follow that test. These are five first opens, not an uninterrupted batch after all diagnostics. Observed readiness upper bounds are 18, 13, 19, 11 and 15 seconds; these include time between observations and are not load-time measurements. The shared signed-in profile has a warm cache.

After the fifth open, the actual board resumes game `cbee2c5b-2745-89d7-a96d-c93e88f9dbae`. Its Moves panel shows `e2–e4` and `g7–g6`, matching the website proof. Evidence: `native-verification.json`, `native-fresh-2.png`, `native-fresh-5.png`, `native-resumed-game.png` and `verified-first-load-board.png`.

The application startup blocker is closed for the verified native workflow. The debugger-associated path remains unresolved as a tooling limitation. No game patch, hidden retry or new deployment follows from this evidence. Product `01cbe379` and the original staging preview remain active.

Protocol Monitor is restored to off, DevTools is closed, and the temporary test tabs are removed. The existing website and ChatGPT game tabs remain. An independent reader accepts the controlled inference and requires this explicit distinction between workflow correction and application repair. Its chronology and cache-wording corrections are applied. All 161 documentation checks pass.
