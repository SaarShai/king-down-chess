# Fast account sign-in and game load

Status: resolved on branch `staging/fix-signin-speed`; not deployed.
Type: task

## Scope

The owner asks for a fix for slow sign-in and game load on `/play/`.
Live base: `70e569bc`. Branch base: `origin/staging/first-game`.
Use local test accounts. Check the live site without an account. Do not deploy.

## Plan

1. Trace auth, API reads, runtime load and cache control. Measure the local path in Chromium and WebKit. Read the live path with a fresh browser context.
2. Fix the cause in shared code. Add a browser check with a short limit and a controlled slow path.
3. Run the affected browser checks in both engines, `npm test`, and `npm run build`. Review the diff. Commit, push, and open a PR into `staging/first-game`.

## Pass criteria

- The game list resolves in a few seconds with a valid local session.
- A slow optional load does not hold the first account screen.
- The browser check fails on the old stall and passes with the fix.
- The required checks pass. The ticket records exact results and timing limits.

## Evidence

The checks below pass. The owner authorizes this repair in the task request.

### Cause

`entry.ts` waits for `readWebAccountAccess()` before it reads a session.
That read calls `withPrivateCachePolicy()`. On a fresh profile, the policy
registers `/sw.js` and waits for its complete offline cache. The live worker
lists 188 files. Thus an unused local-game image can hold sign-in, settings,
and the game list. These account modules match live base `70e569bc`.

A fresh read-only live check sends GET requests only. It uses a new profile
for each engine. It never signs in:

| Engine | Sign-in options ready | Status request starts | Status HTTP time | Provider HTTP time |
| --- | ---: | ---: | ---: | ---: |
| Chromium | 19,140 ms | 17,698 ms | 516 ms | 854 ms |
| WebKit | 10,537 ms | 9,707 ms | 291 ms | 469 ms |

The local compiled stack uses PostgreSQL, signed test users, the real SDK,
and the real game API. The server holds `/ui/cards/rescue.webp` for 12 s.
Before the fix, Chromium takes 12,444 ms to show the list. WebKit takes
12,835 ms. The new check fails on the old product code with a 5,000 ms limit.
The WebKit baseline restores both product files to HEAD before it runs; its
exit is 1 at the timing assertion. It then restores the fix.

This shows a cache-install wait before auth. It does not reproduce the exact
reported two-minute wait. The code has a 60 s install budget and a fresh 8 s
proof budget. The measured path has no fixed 120 s wait. No evidence points
to blocked third-party cookies or lost auth storage. The local SDK checks
cover a saved session, an expired session with token refresh, and a new PKCE
sign-in return. No real provider or account receives these fixture requests.

### Change

- A successful lookup with no worker uses the existing empty-cache proof.
  It removes old app caches and verifies their absence before the send.
- A second lookup catches a worker that another tab starts during cleanup.
  Existing, unsafe, installing and replaced workers still need fresh proof.
- The HTML starts offline caching on the local root page only. It uses the
  same registration settings as the private-cache check. An account page
  no longer starts a delayed offline install after its 60 s board poll.
- `signin-speed` checks a real game row and enabled controls within 5 s.
  Chromium and WebKit CI run it with the existing `web-online` check.
- The offline check starts its own worker before it tests the offline graph.
  No safety or offline assertion is removed.

The fix does not bypass an existing worker update. A slow or unsafe existing
worker must still pass the cache proof before a private request can send.

### Final results

| Engine | Saved session | Token refresh | New PKCE sign-in |
| --- | ---: | ---: | ---: |
| Chromium | 318 ms | 348 ms | 459 ms |
| WebKit | 690 ms | 414 ms | 839 ms |

The WebKit baseline starts status at 12,588 ms and shows the list at
12,835 ms. The fix starts status at 503 ms and shows the list at 690 ms.
The main delay is before status, not in the game API or runtime boot.

All browser checks use the disposable loopback test database. Auth provider
replies use signed local fixture users. No test signs in to a real account.

- `PLAYABLE_BROWSER=chromium npm run check:browser signin-speed web-online web-game account-discovery staging-login`: all 5 pass. Times: 3.9 s, 95.0 s, 67.9 s, 7.8 s and 3.7 s.
- `PLAYABLE_BROWSER=webkit npm run check:browser signin-speed web-online`: both pass. Times: 4.8 s and 85.0 s.
- `npm test`: exit 0. Type checks pass. 303 test files pass; 5,961 tests pass and 11 skip. All 67 artwork checks pass. Test duration: 389.99 s.
- `npm run build`: exit 0. Type check and Vite build pass. The existing optional character-manifest warning remains.
- `npm run test:docs`: 17 files and 187 tests pass after the evidence update.
- `git diff --check`: pass.

Browser logs and screenshots:

- Chromium: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-bTS46E/`.
- WebKit: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-twpERB/`.
- Red WebKit: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/signin-speed-TzwJzF/`.
- Live read-only waterfall and command logs: `/tmp/signin-speed-evidence/`.

The WebKit screenshot shows the game row and enabled game controls. The
repair keeps one shared safety gate. It adds no saved proof and no auth
bypass. Independent PR review remains before a merge. No deploy, publish,
production write or Firefox run occurs.
