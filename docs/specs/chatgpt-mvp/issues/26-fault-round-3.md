# Fault round 3

Status: ready-for-human

The owner requests these four fixes on 2026-10-15. Work stays on `claude/fault-round-3`, from `00919e05`. Do not push or merge.

## Plan and checks

1. Read each fault record and trace each caller. Add a failing check before each code fix.
2. Limit tool requests to 10 s. Use the pending command and Retry. Read authority before Retry. Test a held reply and its late release.
3. Stop passive effects after 5 s. Stop idle drawing. Keep move and capture motion. Measure TaskDuration over 60 s before and after the fix. The shared website board gets the same 5 s rule.
4. Map connection errors once. Test offline Start and Join. Keep the source error in diagnostics.
5. Use the table screen for the plugin's short landscape layout. Check 820 × 600, 1024 × 768, 1280 × 800, 852 × 393 and 400 × 900. Keep the two phone host copies.
6. Run the touched plugin tests, type check, plugin build and local UI check. Record results and limits. Commit with both requested trailers.

## Scope

Product files: `src/plugin/client.ts`, `src/plugin/screens/setup.ts`, `src/plugin/app.css`, `tools/plugin-ui-build.mjs`, `docs/2d-first-pieces/board/scene.mjs`. Tests: `src/plugin/client.test.ts`, `tools/plugin-app.test.ts`, `tools/plugin-board.test.ts`, `tools/plugin-ios-size.test.ts`. This ticket records the work. No other source file changes.

## Changes and results

| Fault | Files | Before → after |
| --- | --- | --- |
| F31. Late reply | `client.ts`, `client.test.ts`, `plugin-app.test.ts` | 60 s busy state → 10 s request limit, pending error and Retry. The test taps e2 and e4. Retry reads authority, keeps the command ID and saves one move. A later Black move stays in view when the held reply arrives. |
| F32. Idle drawing | `board/scene.mjs`, `plugin-board.test.ts` | Effects loop → 5 s passive motion after a change, then the last frame stays still. Selection and resize start motion again. The capture reaches contact and its end. The website board gets the same 5 s rule through this shared scene. |
| F33. Offline words | `client.ts`, `screens/setup.ts`, `client.test.ts`, `plugin-app.test.ts` | Raw fetch error → “Cannot connect. Check your connection, then select Start game again.” Join uses “Join” in the same shared mapping. The console and error cause keep the source error. |
| F34. Medium landscape | `plugin-ui-build.mjs`, `app.css`, `plugin-ios-size.test.ts` | The 820 × 600 board is 82 px → 360 px. The plugin uses the existing side layout from its table screen. The added query needs landscape, a screen height of at most 640 px and a screen width below 900 px. The viewport stays in landscape too, so short portrait phones keep their rows. Only the side column scrolls. The website CSS does not change. |

`app.ts` already reads the server before Retry and keeps the command ID. This fix uses that path. The SDK drops the reply after its request limit, before the client can write a board binding or show a view.

## Checks

The new checks fail on the old code: the 10 s hold has no Retry; offline Start shows `ProtocolError: Failed to fetch`; the idle frame count keeps growing; the 820 × 600 board is 82 px. The repaired checks pass. A bounds check also rejects scroll styles on a portrait row with no box; those styles stay in the side layout.

- `npx vitest run src/plugin/client.test.ts tools/plugin-app.test.ts tools/plugin-board.test.ts tools/plugin-ios-size.test.ts`: 88 pass on the first full run. A repeat has one 5 s limit failure in the existing normal-pace reduced motion case. Both reduced motion cases pass on a focused repeat. The final run uses one file at a time with `--no-file-parallelism`: all 88 pass. No limit changes. The held-move check also passes after its read-before-write assertion is made exact.
- `npm run typecheck`: pass.
- `npm run plugin:build`: pass.
- `node tools/plugin-ui-check.mjs`: pass, with an owned fixture harness on a free localhost port.
- `npm run test:docs`: 113 pass.

The size test checks all five requested sizes. It checks the side layout, the board, a failed read and control hit points. The existing phone tests pass at 393 × 852 with insets 102/118 and 320 × 568 with insets 63/84. The full host height replaces the harness Remount bar in these copies.

### Host copies

Chromium and WebKit agree on these normal board widths. Each page uses the full host height. Each copy also checks a failed read.

| Viewport | Insets, top/bottom; sides | Board, px | Layout |
| --- | --- | ---: | --- |
| 820 × 600 | 59/34 | 360 | Side |
| 1024 × 768 | 24/20 | 483 | Side |
| 1280 × 800 | 0/0 | 536 | Side |
| 852 × 393 | 0/21; 59/59 | 222 | Side |
| 400 × 900 | 0/0 | 391 | Stacked |
| 393 × 852 | 102/118 | 302 | Stacked |
| 320 × 568 | 63/84 | 158 | Stacked |

The two tall desktop widths and the portrait copies match the earlier check. The 820 × 600 copy uses the existing compact side layout. Screenshots and measurements are in `layout.json` and the matching PNG files in the evidence folder.

### Idle CPU

Chromium; Classic friend game; 1280 × 800; DPR 3; normal motion. Each sample starts after the board loads and rests for 7 s. CDP `Performance.getMetrics` supplies the two counters. No input occurs during each 60 s sample.

| Counter, seconds in 60 s | Before | After |
| --- | ---: | ---: |
| TaskDuration | 42.024003 | 0.016719 |
| ScriptDuration | 39.334380 | 0.001760 |
| One core, from TaskDuration | 70.04% | 0.028% |

TaskDuration falls by 99.96%. This measures browser work, not battery use or heat.

Evidence and check logs: `/tmp/kingdown-fault-round-3/`. The folder holds the test logs, the two CPU samples and the local probe scripts. The check runner closes its harness and browsers.

## Not checked

The full test suite runs later on the M1. Native ChatGPT hosts, real devices, a database, the public site and a separate website browser check are outside this local check. No push, merge or deploy occurs. No test limit changes.

## Review fixes

A second reader reviewed commit `7adaac11`. This section records the fixes for its five should-fix findings and note N1. Product files: `client.ts`, `app.ts`, `screens/setup.ts`. Tests: `client.test.ts`, `plugin-app.test.ts`.

| Finding | Fix | Test |
| --- | --- | --- |
| 1. A slow poll puts "Request timed out" on a healthy board | A quiet call that cannot connect writes nothing to `#error`. The next poll tries again. | Hold one quiet `kingdown_get` past 10 s, then release: `#error` is empty and Retry is hidden. |
| N1. The 10 s limit covers the mount reads | `kingdown_settings`, `kingdown_open` and `kingdown_resume` in `mountResult` pass `limit: false` and keep the SDK limit. | Hold the mount `kingdown_settings` for 20 s: Home shows no error. A client test checks both limits. |
| 2. A time-out shows raw words; Setup says "Still starting" | The connection pattern also finds `timed out`. The Setup line does not say "Still starting" while the pending command has an error. A change of the Retry row draws Setup again. | Hold `kingdown_create` past 10 s: Retry, the connection sentence, and "Starting your game…". |
| 3 and 4. The words name absent buttons; other commands show "Failed to fetch" | Every failed connection and time-out gives one sentence, `CANNOT_CONNECT` in `client.ts`: "Cannot connect. Check your connection, then try again." The console diagnostic stays. The words wait for the owner's approval; a change is one line. | Client test: settings, find, join preview, move, accept and get. The offline Start and Join test now expects the one sentence. |
| 5. A remount while a command waits locks the board | At the end of the mount, a saved command other than create or find with no error gets the connection sentence and Retry on the current screen. The handle screen and a command that this page still sends are excluded. Retry reads first and sends the same command ID. | Hold a move, Remount: Retry shows. Retry, then release: the server has one move, from two sends of one command ID. |

### Checks

- Each new or changed test fails on `f1017eea`: 6 of 6 in `plugin-app.test.ts`. The Setup line test also fails with only the old `setup.ts` ("Still starting. Keep this page open.").
- `npx vitest run src/plugin/client.test.ts tools/plugin-app.test.ts --no-file-parallelism`: 57 pass.
- `npm run typecheck`: pass.
- `npm run check:browser plugin-ui`: pass. The first run found a Setup draw before the Setup body existed; a guard fixed it.
- No test limit changes. The full suite runs later on the M1.

## Integration note

The 10 s command limit (F31) ends a held Create at the same moment as the old 10 s wait line (F5), so the wait line never showed and two tests in `tools/plugin-menus.test.ts` failed. The wait line now shows after 5 s (`screens/setup.ts`); at 10 s the connection line and Retry follow. Both tests pass (9 of 9).
