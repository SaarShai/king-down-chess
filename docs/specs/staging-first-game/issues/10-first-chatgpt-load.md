# Reliable first ChatGPT load

Status: native-created control tabs pass observed checks. The failing host/browser path remains unresolved. No application fix is accepted.

Owner request: fix the first-load failure and verify fresh ChatGPT opens without **Try again**. Keep all changes in staging.

## Baseline

The application branch is `e41fe5f6`; the active staging product is `01cbe379`, preview `dpl_FtPtUzjWoYNbtzvMLXUgRhrGVW3E`. [The previous trace](09-real-host-proof.md) proves the game round trip and records the startup failure. Do not repeat game integration work or infer that HTTP 200 proves browser execution.

## Plan

1. Reproduce a fresh open with a measurable ready/error outcome. Compare browser entry and observation paths to rule out a test-tool artifact.
2. Locate the first failing boundary: host sandbox navigation, resource delivery/execution, bridge connection or application mounting. Change one variable per probe.
3. Fix the confirmed cause with the smallest complete change. Keep OAuth, CSP, account ownership and gameplay intact.
4. Run relevant regression/build checks and an independent review. Publish only to the isolated staging preview.
5. Verify at least five fresh opens without retry, including a direct app URL and opening from the plugin page. Confirm the game still resumes. Remove temporary traces and record evidence.

## Acceptance

- A repeatable failing case becomes green without **Try again** or automatic hidden retries.
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

## Review and remaining boundary

An independent reader confirms that the earlier application-bug attribution was too broad. Do not call this fixed while the repeatable failing case remains red. Do not count a model's response as proof that the board resumed. Require the saved history in the actual widget.

The available browser APIs expose rendered state and console logs, but not the host's sandbox-delivery messages or debugger target state. A more precise diagnosis requires that boundary trace or an independently controlled browser session. Do not add a hidden retry, weaken CSP/auth, or rewrite game startup to mask this unconfirmed cause.

## Restore and game check

The staging alias resolves to the original ready preview `dpl_FtPtUzjWoYNbtzvMLXUgRhrGVW3E` after the probe. ChatGPT's staging tools are refreshed. A warm tab retains the probe panel; a new native-created tab loads the restored game on its first attempt, without retry. This is a fourth successful native direct-URL control.

Game `cbee2c5b-2745-89d7-a96d-c93e88f9dbae` is created before the probe with Classic chess, computer Beginner and White. The widget commits `e2–e4`; the computer replies `g7–g6`. The clean restored page lists the game. Opening it and its Moves panel shows both saved moves. The website opens `/g/cbee2c5b-2745-89d7-a96d-c93e88f9dbae` and shows the same two moves. Screenshots: `active-game-before.png`, `restored-first-open.png`, `resumed-chatgpt.png` and `resumed-web.png`.

The temporary preview is deleted and its worktree removed. `minimal-probe.patch` retains the two-file probe for reproduction; no diagnostic code is merged. The application remains `01cbe379`. No production deployment, account, database or security setting changes.

Acceptance remains incomplete: the native-created control tabs and saved-game checks pass, but the repeatable failing host/browser startup path is still red. Independent review checks the records and matching history screenshots; its two wording corrections are applied.
