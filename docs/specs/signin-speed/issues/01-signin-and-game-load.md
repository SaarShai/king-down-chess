# Fast account sign-in and game load

Status: resolved on branch `staging/fix-signin-speed`; not deployed.
Type: task

## Scope

The owner asks for a repair of the home page → account link path in PR 209.
Base head: `8c1c971835a3eb9be6ac6f3327dabf62436d3eb4`.
Use local test users only. Do not deploy, publish, or write to production.

## Plan and pass criteria

1. Add the real home page → account link path. Hold one offline card for 12 s.
   Record a failing run on the base product code in both engines.
2. Prove private-cache safety before the full offline install ends. Check first
   install, active and waiting workers, replacements, bad replies and failed cleanup.
3. Correct the desktop cache checks. Use a real browser to prove that product code
   installs and activates the root worker. Keep the full offline game checks.
4. Run the browser matrix, full tests, build and doc checks. Record the results.
   Commit with the hooks unchanged. Push to the same branch and update PR 209.

Each account entry must show a real game row and enabled game controls in 5 s.
Cover saved session, token refresh and PKCE sign-in with direct and home entry.
The home cases must start with an installing worker and finish while it installs.
Private replies must stay outside the public cache. Offline activation must still
require one complete build. A changed or unproved worker must block private sends.

## Cause and review

Three independent reviewers report the same gap in the first repair. A direct
`/play/` visit skips a new offline install. But `/` starts the install after the
board is ready. The account link then opens `/play/` with an installing worker.
The old gate waits for that worker before it reads `/api/status`. It can wait
60 s before `CACHE_INSTALL_DEADLINE`. The same gate holds a PKCE return.

The new browser case confirms this on base head `8c1c9718`. The root page starts
its worker through product code. The server holds `/ui/cards/rescue.webp` for
12 s. The check clicks a visible `[data-account-play]` link. Status, auth and
private game reads use the compiled app and a disposable loopback database.

The first check covers only direct entry. It cannot detect the home-page fault.
The old desktop check also assumes that a private visit installs a worker. The
old offline check registers the worker itself, so it does not prove root setup.

## Safety argument

The gate separates a complete offline build from safe private traffic:

- The new `public-install-v1` reply checks all existing keys in the worker's own
  cache. Each key must be public. It does not require files that are still loading.
  All later writes still use `cacheable()`, including every install write.
- The exact build allowlist excludes private routes and unknown paths. Requests
  with Authorization or no-store, cross-origin requests, redirects, auth query
  replies and no-store replies cannot enter that cache. Private requests pass to
  the network. The private API client still sends with `cache: 'no-store'`.
- Before each private send during install, the page proves the controller and
  every active, installing and waiting worker. Each reply has a fresh request ID
  and port. The incoming worker is first. If a worker cannot give early proof,
  the send waits for takeover within the base 60 s install budget. It then needs
  fresh full proof from the new controller.
- Only the cache names of those proved versions can remain. The page removes all
  other app caches, then lists names again. It checks the worker set after each
  asynchronous step. With no registration, it checks again before each delete
  and stops cleanup when another tab starts a worker. It makes the last check
  and the send in the same task.
- The install has one 60 s budget across replacements. After install, full proof
  has a fresh 8 s budget. Other requests keep their 8 s budget. No proof is saved
  between private requests. The gate retains the incoming worker reference and
  refuses a failed install even when the browser clears its installing slot.
  A failed deletion, late reply or silent worker cannot open the send.
- Each worker reads only its own version cache. The active and incoming caches
  can coexist during install, but their files do not mix. Install still checks
  the complete offline graph before `skipWaiting()`. Activation still checks the
  complete cache, removes old versions, and then claims clients. The existing
  full-build proof remains in use when no install runs.

A client can message an installing worker: see the
[Service Worker specification](https://www.w3.org/TR/service-workers/).
An old worker that cannot prove the new write policy blocks private sends until
the new worker takes over and gives full proof. The worker URL is not proof.

The root registration code stays in place. The `web-online` browser check now
loads the real root, waits for an activated controller, and checks its script,
scope and update mode. It does not register that first offline worker by hand.
CI runs this check in Chromium and WebKit. The full offline game checks remain.

The desktop check keeps all 30 cold/warm pairs, legal-state reads and accepted
turns. Cold means a fresh context. Warm means a same-context reload with a warm
HTTP cache. Both private visits must have no registration and no controller.

## Browser fixture

The auth SDK, PKCE flow, session restore and token refresh stay in use. A local
HTTP provider returns test auth and cloud-save replies. WebKit does not route
controlled-page auth fetches through the Playwright route mock. Thus the fixture
uses a loopback server. The test build keeps account-config validation and changes
only the returned provider address to that server. The product config is unchanged.

The root save receipt resolves before the measured click. The refresh case then
expires the saved session before that click, so refresh occurs on `/play/` while
install runs. All external requests are blocked. No real provider or account is
used. The test uses a synchronous state poll: this Playwright version accepts an
async predicate's Promise as ready before its boolean result is true.

## Before the repair

The product cache files and Vite config match base head in these runs. Only the
browser fixture and check change. All six paths complete in each engine; the
check then fails at the 5 s limit. Times start at direct navigation or the real
home account-link click. The root board setup is outside the home measurement.

| Entry | Auth path | Chromium | WebKit |
| --- | --- | ---: | ---: |
| Direct | Saved session | 336 ms | 660 ms |
| Direct | Token refresh | 276 ms | 396 ms |
| Direct | PKCE sign-in | 442 ms | 464 ms |
| Home link | Saved session | 12,470 ms | 12,635 ms |
| Home link | Token refresh | 12,477 ms | 12,640 ms |
| Home link | PKCE sign-in | 12,815 ms | 12,343 ms |

Home status starts at 11,978–12,046 ms in Chromium and 12,044–12,053 ms in
WebKit. This proves an install wait before auth. It does not reproduce the exact
reported two-minute Safari wait.

Base failure logs and JSON:

- Chromium: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-QAjpAt/`.
- WebKit: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-sb8ngm/`.
- Command logs: `/tmp/signin-round2-red-chromium.log`, `/tmp/signin-round2-red-webkit-ready.log`.

## After the repair

The list and enabled controls pass the 5 s limit on all six paths. All three
home cases in each engine still have an installing worker when they finish.
The slow offline card remains held. Each private read gets fresh proof.

| Entry | Auth path | Chromium before | Chromium after | WebKit before | WebKit after |
| --- | --- | ---: | ---: | ---: | ---: |
| Direct | Saved session | 336 ms | 405 ms | 660 ms | 732 ms |
| Direct | Token refresh | 276 ms | 274 ms | 396 ms | 409 ms |
| Direct | PKCE sign-in | 442 ms | 437 ms | 464 ms | 492 ms |
| Home link | Saved session | 12,470 ms | 200 ms | 12,635 ms | 378 ms |
| Home link | Token refresh | 12,477 ms | 213 ms | 12,640 ms | 427 ms |
| Home link | PKCE sign-in | 12,815 ms | 408 ms | 12,343 ms | 516 ms |

Home sign-in options fall from 12,571 to 154 ms in Chromium and from 12,116
to 267 ms in WebKit. Home status starts at 95–121 ms and 219–239 ms. The PKCE
return gets its own status reply while the same offline install still runs.

## Final checks and review

All commands use the disposable loopback database. The browser checks use local
test users and the local provider. The full suite runs without a file filter.

- `PLAYABLE_BROWSER=chromium npm run check:browser signin-speed web-online web-game account-discovery staging-login desktop-performance`: all 6 pass. Times: 17.9 s, 101.7 s, 69.0 s, 7.4 s, 3.6 s and 43.8 s.
- `PLAYABLE_BROWSER=webkit npm run check:browser signin-speed web-online`: both pass. Times: 19.1 s and 93.4 s.
- `npm test`: exit 0. Both type checks pass. All 303 files pass; 5,968 tests pass and 11 skip. Duration: 489.29 s. All 67 artwork checks also pass.
- `npm run build`: exit 0. Type check and Vite build pass. Vite takes 609 ms. The existing optional character-manifest warning remains.
- `npm run test:docs`: all 17 files and 187 tests pass, also after the evidence update.
- Focused safety checks: `KINGDOWN_TEST_FILE='**/{cache-policy,service-worker}.test.ts' npm test`: both files and 207 tests pass. This is separate from the full-suite result.
- `git diff --check`: pass.

The desktop check completes all 30 cold/warm pairs and accepted turns. Each
private visit has no worker. The legal reads, board readiness, accepted HTTP
reply and stored command checks remain. The offline check proves product root
installation and activation in both engines, then checks the full offline game.

The first full Chromium run finds an old-worker upgrade fault in the early
proof order. A silent old controller holds the successor while it waits for
proof. The incoming-first order fixes this without a delay or a weaker refusal.
A unit test and the real old-worker browser checks cover this order.

Final browser logs, JSON and screenshots:

- Chromium: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-yMqAtv/`.
- WebKit: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-S8E37W/`.
- Command logs: `/tmp/signin-round2-chromium-final.log`, `/tmp/signin-round2-webkit-final.log`, `/tmp/signin-round2-npm-test.log`, `/tmp/signin-round2-build.log`, `/tmp/signin-round2-docs.log`.

The final diff keeps the repair in the shared private-send gate and worker.
The auth flow stays in place. No proof is saved and no private request bypasses
an unproved controller. The three prior reviews identify the first-round gap;
this repair still needs independent review before merge. No deploy, publish,
production write, real-account sign-in, Firefox run or merge occurs.

## Round 3 plan and pass criteria

1. Check the live worker at `70e569bc`. Keep its source as a test fixture.
   Show that a 12 s upgrade fails at head `23f3dded`, then passes with the repair.
2. Keep early proof for workers that support it. Give older workers the base
   60 s install budget. Require fresh full proof after takeover. Refuse a failed
   install even when the browser clears `registration.installing` first.
3. Keep page cleanup from deleting the cache of an install in another tab.
   Add a race test that opens the new cache after the first registration lookup.
4. Run the requested focused tests, Chromium and WebKit checks, full tests,
   build and doc checks. Keep hooks unchanged. Commit and push to the same branch.

Pass: no private send uses an unproved worker. The 12 s live-worker upgrade
succeeds after fresh proof. A failed install sends nothing. Cleanup keeps the
new install cache. All requested checks pass. No production action occurs.

## Round 3 findings and repair

All three findings are confirmed at `23f3dded`. The worker at live main
`70e569bc` has no early-proof branch. It refuses full proof while a replacement
installs. The gate fails at 8 s, before the base 60 s install budget. The prior
upgrade test uses the new worker source and cannot detect this protocol gap.
The checked-in live fixture has Git blob `9cac671dca573d8f6812e6789ba89d2b26009b8b`,
which equals `70e569bc:public/sw.js`.

The new regression cases fail on unchanged product code: a controlled 12 s
upgrade and an uncontrolled 59 s upgrade both fail at 8,000 ms with
`CACHE_PROOF_DEADLINE`. The failed-install test confirms that the old controller
gets a message after the browser clears the installing slot. The race test
confirms that cleanup deletes the new install cache.

The repair restores the base install budget. Silence, an unsupported early
reply or a failed early message waits for a state change within that budget.
Each completed install needs fresh full proof. The failed worker reference
survives slot removal. Page cleanup checks for a registration before each
delete and passes a new registration back through the normal proof path.

The browser check installs the live worker, starts the current worker and holds
one public card for 12 s. It requires a private read to wait more than 8 s,
succeed after takeover and pass the existing proof-order and storage checks.

## Round 3 final checks

The four new regression cases fail on the unchanged product at `23f3dded`.
The focused selection uses `KINGDOWN_TEST_FILE='**/{cache-policy,service-worker}.test.ts'`
and `KINGDOWN_TEST_NAME='live 70e569bc: true|clears installing|between lookup'`.
Both upgrade cases fail at 8,000 ms. The other cases detect the surviving-old
controller message and deletion of the new install cache. Log:
`/tmp/signin-round3-red.log`.

After the repair, both the 12 s controlled upgrade and the 59 s uncontrolled
upgrade pass. Neither sends before takeover. Each then uses fresh full proof.
The fallback cases also cover an old policy, a wrong request ID, a failed
message, 9 s of activation and 7 s before the full reply. A replacement keeps
the same 60 s install budget. A late reply cannot reopen a refused send.

The live upgrade browser case passes in Chromium at 13,106 ms and in WebKit
at 12,162 ms. Both runs hold one public file for 12 s. The existing proof-order,
private-canary and saved-data checks pass after takeover. The new-worker fast
path also stays fast: home entry takes 291–401 ms in Chromium and 471–539 ms
in WebKit, with an install still in progress in all home cases.

Final commands and results:

- `KINGDOWN_TEST_FILE='**/{cache-policy,service-worker}.test.ts' npm test`:
  exit 0; 2 files and 215 tests pass; 393 ms. Both type checks and all 67 artwork
  checks pass. Log: `/tmp/signin-round3-focused-final.log`.
- `PLAYABLE_BROWSER=chromium npm run check:browser signin-speed web-online web-game account-discovery staging-login desktop-performance`:
  exit 0; all 6 pass. Times: 18.8 s, 110.1 s, 71.3 s, 8.0 s, 3.9 s and 45.7 s.
  Log: `/tmp/signin-round3-chromium.log`.
- `PLAYABLE_BROWSER=webkit npm run check:browser signin-speed web-online`:
  exit 0; both pass. Times: 20.2 s and 100.2 s.
  Log: `/tmp/signin-round3-webkit.log`.
- `npm test`: exit 0; both type checks pass; all 303 files pass; 5,976 tests pass
  and 11 skip. Duration: 420.73 s. All 67 artwork checks pass.
  Log: `/tmp/signin-round3-npm-test.log`.
- `npm run build`: exit 0; type check and Vite build pass. Vite takes 270 ms.
  The existing optional character-manifest warning remains.
  Log: `/tmp/signin-round3-build.log`.
- `npm run test:docs`: exit 0; all 17 files and 187 tests pass.
  Logs: `/tmp/signin-round3-docs.log` and `/tmp/signin-round3-docs-final.log`.
  The final run includes this evidence update.

Browser logs, JSON and screenshots:

- Chromium: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-5GOGXX/`.
- WebKit: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-XloUNf/`.

The final review keeps the repair in the shared gate. No auth flow, API caller
or dependency changes. No private send bypasses proof. The browser checks use
local users and a disposable loopback database. No Firefox run, real-account
sign-in, production write, deploy, publish or merge occurs. Independent review
remains before merge. Commit and push use the unchanged hooks and no hook inputs.
