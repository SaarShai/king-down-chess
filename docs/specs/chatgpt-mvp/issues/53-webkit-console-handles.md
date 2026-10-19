# CI WebKit: the plugin-ui page crash and the held console objects

Status: claimed
Type: task

## Scope

CI run 39230893586 (PR 63, commit `3486ab42`) failed in the job
`browser-webkit`, step `npm run check:browser plugin-ui`, after 757 s.
The page target closed in `clickButton` (`tools/plugin-ui-check.mjs:45`,
from `sendTurn` at :1695, called at :3134). Then `page.evaluate` at :3185
reported `Target crashed`. The same check passed on `19e9ebef`, and a
re-run of the same job passed. PR 63 does not change any file that this
check runs. So the crash is intermittent, and memory growth is the
suspected cause. This ticket follows [ticket 45](45-pr61-linux-ci.md).

Find the cause and fix it. Do not add a retry. Do not raise a limit or
the STEP factor. Do not remove an assertion. Prove the fix with CI
WebKit passes. Do not merge.

## Plan and checks

1. [x] Read the CI log. Audit every page and context that the check opens.
2. [x] Measure in Mac WebKit: the Playwright handles that are not
   disposed, and the memory of each WebKit process, before and after the
   fix.
3. [x] Fix the cause. Add a regression test that fails without the fix.
4. [x] Measure on the CI runner: baseline and fix, with and without the
   host reloads of `freshHost()`, three jobs each.
5. [x] Run the final branch in CI. Record the results here and in the PR.

## Findings

### The check closes its pages

The check opens four pages besides the host page: the Android page, the
desktop page and two phone pages. Each one closes in a `finally` block.
The host page stays open for the whole run, and `freshHost()` reloads it
at seven block boundaries (ticket 45). The crash point (:3134 and :3185)
uses no WebKit-only code.

### Playwright kept every console argument

`trapErrors` listens for console messages. Playwright then makes a
handle for each console argument, and the page keeps that object until
the handle is disposed. Playwright never disposes these handles. The
ext-apps bridge on the host logs each message event from its widget
frames ("Ignoring message from unknown source", and others), and each
event keeps its widget window.

A probe of Playwright's handle list (`globalThis.leakedJSHandles`)
counts the handles that are not disposed:

| Run | Handles at the end | Most message events kept by the host |
|---|---|---|
| Mac WebKit, main | 14,471 | 3,614 |
| Mac WebKit, fix | 1,969 | 0 |
| CI WebKit, main, with reloads | 14,591 to 14,734 | 1,198 to 1,225 |
| CI WebKit, fix, with reloads | 1,886 to 1,983 | 279 to 298 |

The other handles (about 1,900) belong to the check's own code.

The fix disposes each handle when the message arrives. On the Mac, with a
50 MB marker in each widget document and no host reloads, WebKit memory
rises to 7.8 GB on main and falls only when the host page navigates.
With the fix, garbage collection frees the old documents (4.6 GB falls
to 1.8 GB). The new `trapErrors` test fails on main in Chromium and
WebKit, and passes with the fix.

### The Linux runner: the fix does not change memory

The runner has 16 GB. WebKit kills its own page process when the process
uses more than 8192 MB: "Unable to shrink memory footprint of process
(8433 MB) below the kill thresold (8192 MB). Killed". The kernel records
no OOM kill. After the kill the check waits until its 1260 s limit.

Three jobs each, PLAYABLE_BROWSER=webkit, peak memory of the WebKit
processes (main is `3d4c97ae`, run 39245399741; fix is run
39246105494):

| Branch | Host reloads | Result | Time | Peak |
|---|---|---|---|---|
| main | on | 3 pass | 876 to 1163 s | 4200 to 4402 MB |
| main | off | 3 killed by WebKit | 1260 s limit | 8912 to 9103 MB |
| fix | on | 2 pass, 1 M2 fault | 1037 to 1126 s | 4258 to 4362 MB |
| fix | off | 3 killed by WebKit | 1260 s limit | 8748 to 9197 MB |

The M2 fault ("M2 samples the live win text while it scales":
`samples:11, wordSamples:0`) is a timing fault that run 39163839294 also
shows on main.

With no reloads, the page grows by about 2 GB a minute and WebKit kills
it after 270 to 480 s, on main and with the fix. With reloads, the peak
stays near 4.4 GB, about half of the kill limit.

Run 39257713828 adds a 30 MB marker to each widget document (fix, no
reloads). The marker memory never falls before the kill:

| Marker | Memory at 120 s | Kill time | Memory at the kill |
|---|---|---|---|
| none | 4294 to 4382 MB | 270 to 300 s | 8254 to 8386 MB |
| 30 MB | 4313 to 6293 MB | 180 to 240 s | 9345 to 9824 MB |

So on Linux, about 40 to 75 old widget documents stay alive at a time,
also with the fix. On the Mac, garbage collection frees them. On both, a
host reload frees all of the growth.

### The crash of run 39230893586

That run crashed at 757 s, in the last block, after "Ticket 15 look
comparisons". At that step the five passing runs with reloads above use
1333 to 1656 MB, far below the 8192 MB kill. A WebKit kill writes its
reason, but this log has no browser output, so it gives no reason. It is
the only `Target crashed` in the last 80 runs of the workflow. The
evidence does not show that memory caused it.

## Changes

- `tools/lib/checks.mjs`: `trapErrors` disposes each console argument
  handle at once. Test: `trapErrors` lets the page free an object that it
  logged (`tools/lib/checks.test.ts`).
- `.github/workflows/plugin-checks.yml`: the WebKit plugin-ui step sets
  `DEBUG: pw:browser`, so the check log keeps WebKit's own output. A
  later crash then names its reason. Test: `tools/workflow.lint.test.ts`.

## Validation

- PR 64 run 39254786210 (`377a5018`): all four checks pass. WebKit
  plugin-ui passes in 1110.8 s.
- Run 39246105494 (the fix with the probe, reloads on): 2 of 3 WebKit
  jobs pass; the third fails on the M2 timing fault.
- The run of the final commit (this ticket, one comment and the merge of
  main with its new WebKit `web-online` step) is on PR 64.

## Answer and open limits

The held console objects were a real fault, and the fix removes it. It
does not prove the cause of the crash in run 39230893586: that crash
came at about 1.5 GB, with no reason in the log. The next crash writes
WebKit's reason to the log.

Open limits, not in this ticket:

- On Linux WebKit, old widget documents stay alive until a host reload,
  also with the fix. With the seven reloads the peak is 4.4 GB.
- The WebKit plugin-ui check takes 876 to 1163 s of its 1260 s limit.
- The M2 timing fault above.
