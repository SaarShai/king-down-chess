# Web game: deterministic recovery check

Type: task
Status: resolved

## Plan and verification

1. Trace the retry policy and the failed CI check. Keep the app behavior unless it has a fault.
2. Stop the old page's retry timer before navigation. Check the exact requests and deliberate failures, command identity and single applied move.
3. Run `web-game` five times, including CPU load, then `web-online web-game` and `npm test` on a disposable local database.

## Results

The client makes four attempts with delays of 0.5, 1 and 2 seconds. The clock installed by the check still runs. The old page can start a retry before navigation, which cancels that request. The new page then starts four recovery attempts. The check ignores the cancelled request and can count four failures instead of five. This is not a duplicate application: the durable receipt keeps the same command ID and the server applies it once.

The check fixes and pauses the page clock before it drops the first reply. It restores the clock after navigation. It requires six identical commands: the first, four failed recovery attempts and the manual retry. It counts only failures it causes and rejects cancelled command requests.

## Checks

- Five Chromium `web-game` runs pass: 70.1, 69.2, 69.7, 71.6 and 71.1 seconds. The second run has a CPU busy loop.
- The combined Chromium `web-online web-game` run passes: 95.3 and 71.5 seconds.
- The first full `npm test` on the final check fails one unrelated plugin polling case: Retry appears after two failed polls. It passes 302 files and 5,961 tests, with 11 skips. The full repeat passes 303 files and 5,962 tests, with 11 skips, plus 67 artwork checks. An earlier full run also passes.
- All checks use a disposable loopback database. No app code changes.
