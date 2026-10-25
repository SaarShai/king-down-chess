# Mechanical checks for the faults of ticket 77

Status: in review on PR SaarShai/king-down-chess#88 (branch `staging/ci-guards`, base `main`; `main` merged in at `4c779072`). No merge or deploy.

## What

Two independent audits of the ticket 77 work list five faults that a session made and that no check caught. Each fault gets a check, not a new prose rule.

1. The tools folder has no type check. `tsconfig.json` includes `src` only, so the loop `for (const remount of [false, true]) ... await remount(page)` passed `npm run typecheck` and failed at run time.
2. A model name reached ticket 77. The steering lint checks named steering files only, while AGENTS.md exempts only the tasks archive.
3. A bare `npx vitest run` skips the test lock (`tools/test-lock.sh`) and the type check.
4. The optional Python probes in `tools/board-grain.test.ts` and `tools/stone-control.test.ts` skip on every import fault except a time-out. A broken install skips the source-export checks.
5. Nothing proves that the retained-profile journeys of `tools/web-online-check.mjs` stay on the local server.

## Plan

1. Add `tsconfig.tools.json` (extends `tsconfig.json`, `noImplicitAny: false`, includes `tools`). Fix its errors one by one; no blanket suppression. Run it from the `typecheck` script, so `npm test` and the pre-commit hook run it.
2. Lint each Markdown file of the specs folder with `findModelNames`. Fix the finds. Add a regression case. (Dropped: `main` holds the wider lint of PR SaarShai/king-down-chess#91.)
3. Add a vitest `globalSetup` that stops a run with no lock mark. Keep `npm run test:docs` working.
4. One shared Python probe: skip only when a required module is missing; fail on every other fault.
5. Record each request URL of the profile pages in `worker-browser.json`; assert that each goes to `http://127.0.0.1`.

## Acceptance

- Each check fails on the old fault and passes now.
- `npm test`, `npm run test:docs` and `npm run check:browser web-online` (Chromium and Firefox) pass.
- An open PR with the `pr` skill body.

## Results

### 1. Tools type check

`tsconfig.tools.json` gave 85 errors at `08c4dcda` (75 with `noUnusedLocals` off). Each has a local fix. The fixes that change behaviour or data:

```text
tools/plugin-ios-size.test.ts   expect.poll(fn, 'label') dropped the label: the second argument is an options
                                object. Now { message: 'label' }.
tools/plugin-board.test.ts      finished view: action 'finished' is no SeatAction ('done'); reason 'resign' is no
                                EndReason ('resignation').
tools/plugin-menus.test.ts      history rows: king null is no KingName ('Flame'); rating_policy 'legacy' (the value
                                the fixture gives a row with none).
tools/engines.test.ts           history view: rating_policy 'casual' (required by View).
tools/mine.ts                   the copy of trajectory() has no uncertainty, so the uncertainty sum was NaN; nothing
                                reads it. The sum is removed.
tools/jev-play.ts               a null search move no longer throws in toLan; the first legal move is used, as for
                                a move with no match.
src/online/client.ts            the default fetch wrapper names its two parameters (a spread of an overloaded
                                function's parameters is not valid in the tools program).
```

The other fixes are types only: declaration files for `tools/lib/plugin-control-bounds.mjs` and `tools/lib/plugin-hit-sizes.mjs` (Playwright typed their results as `unknown`), element casts in page callbacks, a `FixtureSeedInput` type for history rows with no `rating_policy`, and unused imports and locals removed.

Old fault: the remount loop in a tools file gives `TS2349: This expression is not callable. Type 'Boolean' has no call signatures.` under `tsconfig.tools.json`. `tsc --noEmit` with `tsconfig.json` exits 0 on it.

### 2. Model names in the specs folder

Dropped from this PR. PR SaarShai/king-down-chess#91 reached `main` first: `tools/model-names.docs.test.ts` lints each Markdown file of the tree outside its exempt files, with a regression case, and rewords the same tickets. The merge of `main` takes its lint and its wording; this branch keeps no doc change of its own except this ticket.

### 3. Test lock guard

`tools/test-lock-guard.ts` is the vitest `globalSetup`. It stops a run unless `KINGDOWN_TEST_LOCKED` (set by `tools/test-lock.sh`) or `KINGDOWN_TEST_DOCS` (set by `npm run test:docs`) is set. With `KINGDOWN_TEST_DOCS`, `vite.config.ts` includes the doc lints only, so that mark cannot open the other tests. `tools/test-lock.sh` now sets its mark before the no-git and no-perl paths too, so those runs start.

Old fault: `npx vitest run tools/test-lock.test.ts` now stops with "This vitest run has no test lock and no type check: run npm test ...", exit 1. `tools/test-lock-guard.test.ts` covers both marks.

### 4. Python probe

`tools/lib/python-modules.ts` (`pythonModules`) runs one Python probe. It gives false only when python3 or a required module is missing (`ModuleNotFoundError` with that module's name). A broken import, a missing dependency of a required module and a time-out fail; the time-out message gives the measured time. Both test files use it. `tools/lib/python-modules.test.ts` covers present, missing, broken-dependency, raising and slow modules. `tools/child-timeouts.test.ts` bounds the probe's call.

Old fault: with a `numpy.py` that raises on import on `PYTHONPATH`, the old probe prints "Skip source export" and gives false; `pythonModules('numpy', 'PIL')` throws "python3 cannot import numpy, PIL: Traceback ...".

### 5. Local-only profile requests

The audit says `worker-browser.json` records each request. It records only the browser facts, and the `http` events of `worker-events.json` are paths that reached the local server, so a request to another host cannot show in either. Now each profile context records the URL of each request; `worker-browser.json` holds them as `requests`, and `assertLocalRequests` fails on a URL that does not start with `http://127.0.0.1` (`data:` and `blob:` URLs are no network requests). The unit case fails on `https://project.supabase.co/...`, `http://127.0.0.1.example/` and `http://localhost:...`.

`npm run check:browser web-online` passes on Chromium (104.8 s; 5,029 requests, each to `http://127.0.0.1`) and on Firefox (110.3 s; 1,211 requests, each to `http://127.0.0.1`). Old fault: before this change, the check had no assertion on request hosts.

After the reviews (below), all profiles run behind a local proxy (`bypass: '127.0.0.1'`) that records and refuses each request to another host. The proxy sees a worker's own request and a WebSocket, which give no context request event in some engines (Firefox and WebKit for worker requests; every engine for a worker's WebSocket). The proxy log goes into `worker-browser.json` as `outside`. Two controls, `fetch('http://outside.invalid/request-control')` and `new WebSocket('ws://outside.invalid/socket-control')` (logged as `CONNECT outside.invalid:80`), must reach the proxy, so an empty log proves something. Every other proxy entry is a fault: no host rule names the sender from the destination. Firefox's media plug-in update check (`media.gmp-manager`, the source of `CONNECT aus5.mozilla.org:443` in one local run) is off.

WebKit sends the WebSocket control to the proxy as its URL (`ws://outside.invalid/socket-control`); Chromium and Firefox send a tunnel. Full Chromium and branded Chrome send their own service requests through the proxy (`www.google.com`, `accounts.google.com`, `update.googleapis.com` and others) with every switch tried, so a Chromium profile opens the bundled headless shell (`chromium-headless-shell`), which sends none. The other pages of the check keep `PLAYABLE_BROWSER`.

Loopback and link-local addresses (`localhost`, `127.0.0.2`, `[::1]`, `169.254.x.x`, `[fe80::1]`, `*.localhost`) never reach the proxy in a local probe of the three engines: not with Chromium's `<-loopback>` bypass rule and not with Firefox's `network.proxy.allow_hijacking_localhost`. A named host always reaches it. So each profile page also records its own WebSockets into `requests`, and `assertLocalRequests` names a page WebSocket to such an address. A worker's WebSocket to a loopback or link-local IP address stays outside both records; the app opens no WebSocket.

`npm run check:browser web-online` at the current version: Chrome 102.8 s and Chromium 97.3 s (profiles in the headless shell), Firefox 111.4 s, WebKit 89.3 s. Each proxy log holds only the two controls.

### Full suite

`npm test` at `57c43e79`: type checks (src and tools) exit 0; vitest 258 files, 4,785 passed, 8 skipped (383 s); Node checks 50 of 50. `npm run test:docs`: 13 files, 168 passed.

After the rebases on `18aa577b` and `0e0f2602` (the board tests split into `tools/plugin-board.test.ts`, `tools/plugin-board-input.test.ts`, `tools/plugin-board-drafts.test.ts` and `tools/lib/plugin-board-fixture.ts`), the board type fixes go to the file that now holds each test; the tools type check covers all four files. `tools/child-timeouts.test.ts` read the board build limit from `plugin-board.test.ts`, which no longer runs the build; it now reads `tools/lib/plugin-board-fixture.ts` (the first full run after the rebase failed only on this case).

## Review

Independent review of `b9eb56cf` (read-only, Codex at the highest effort): merge after fixes.

1. Should-fix, confirmed: `tools/kings-summary.ts` cast `m.strike`, a field that `parseLan` does not set; it sets `power: 'strike'`. The Strike count was always 0. Fixed: `m.power === 'strike'`. `parseLan` gives `strike` for `Qd1d3!` and no power for `Qd1d3`.
2. Should-fix, plausible: Firefox and WebKit give no context request event for a worker's own request, so the local-only check could miss one. Fixed with the proxy and the control above.

The review found no other fault in the type fixes, the test lock guard, the Python probe or the callers of vitest.

Re-review of `d4bdffe9` (read-only, Codex at the highest effort): merge after fixes. Fix 1 is correct and complete. Two should-fix findings, both confirmed:

1. Chromium had no proxy and a WebSocket gives no context request event, so `new WebSocket('wss://project.supabase.co/...')` entered neither record. Fixed: the proxy for every engine and a WebSocket control.
2. The service-host rule named the sender from the destination: a worker's own `fetch('https://www.mozilla.org/leak')` in Firefox would pass. Fixed: the rule is removed; the Firefox check that sent the one service request is off.

Re-review of `0b550240` (main merged; read-only, Codex at the highest effort): merge after fixes. Both earlier findings are closed for named hosts; the merge breaks none of the five checks. One should-fix: Chromium's default bypass rules let `new WebSocket('ws://localhost:52011/leak')` escape both records. The suggested `<-loopback>` rule does not send loopback or link-local addresses to the proxy in any engine (local probe), so each page now records its WebSockets; the worker case stays a known limit (above).
