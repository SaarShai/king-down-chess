# web-online: name the asset that fails during offline play

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

tools/web-online-check.mjs:752 asserts `failedAssets` is empty, and :749 asserts that offline play asks the server only for the probe paths. Both failed in WebKit jobs. The message at :752 does not show the list, so the asset and its error text are not in the job log.

Runs and lines (exact):
- 45063912903 attempt 1 (2026-11-22, checks / browser-webkit-board (input)), attempt 2 green: `FAIL web-online        162.1 s  AssertionError [ERR_ASSERTION]: Offline play has no failed asset requests  /tmp/kingdown-check-runs/king-down-chess-OrPhCg/web-online.log`
- 44262287966 attempt 1 (2026-11-18, browser-webkit-ui), attempt 2 green: `FAIL web-online        133.5 s  AssertionError [ERR_ASSERTION]: Offline play requests no asset from the server, only the network-first page and worker checks: ["/character-runtime/assets/cd93396993931574db3aeb1e096f242a5638dec1b6...`

## Change

First change (cheapest): put the list in the message at :752, for example `` `Offline play has no failed asset requests: ${JSON.stringify(failedAssets)}` ``. The errorText then tells a navigation cancel from a cache miss.

Possible repair, after the list shows the cause: if the failed requests are character-runtime art that a `goto` or `reload` cancels (WebKit reports a cancel), wait for `characterWarmupSettled` before each navigation in the offline part, or ignore a cancel error text only.

tools/web-online-check.mjs is in the file list of lane seam-ci this week. Do not change it before that lane merges.

## Test that fails first

Forced order: during offline play, start a fetch of a character-runtime asset that the page route holds for 2 s, then call `active.goto(origin)`. Red with `Offline play has no failed asset requests` (WebKit: a cancel). With the repair (wait before navigation): green.

## Known limits

- Cause not proven: the job logs do not name the asset.
- 6e7fbc3b1 (2026-11-18 11:23 UTC) sets the browser offline before the server refuses requests and adds the assertion at :752. Run 44262287966 is before it; run 45063912903 is after it.

## Work record

Not started.
