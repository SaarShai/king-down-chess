# Start a streamed leap at once on a fast link

Status: local checks pass. CI and the merge are open in the pull request.

## Fault

After PR 303 (issue 46), a Knight or Paladin leap started up to about 1 s after the click on a fast link (staging, release 16 candidate; live release 15 started in 58 ms). The board showed no motion in that time.

## Cause

Two parts of PR 303, both bound by request latency, not by bandwidth:

1. The start waited for frames 0 to 3 and the landing frame, then for the decode rate that `strikeWait` measures in its own wait. That rate starts from nothing: the wait holds for at least one more frame, and it takes six parallel loads as one after the other. A frame that is 200 to 700 ms away (a cold or far CDN edge; staging gave 400 to 700 ms a request after the deploy) made the start wait up to the 1000 ms limit.
2. The selection prefetch loaded each leap one after the other and waited for each before the next, so the six slots stood idle at the end of each leap. On a far edge it did not finish in 1 s, and the leap toward the target was often not loaded. The prefetched frames had no pin, so the idle play of the figures could push them out of the decoded budget. The first-sound cost (a new `AudioContext`, about 190 ms once per browser in headless Chromium) is a different, old delay; it is the same on live.

## Change

`src/render/painted/character-runtime.mjs`:

- The runtime measures the link from every decoded frame: the latency (request to decoded frame) and the interval between two frames while all six slots are busy.
- `leapWait` replaces the leap's frames-first wait and its `strikeWait`. A leap starts once, at the measured link, its first frame is decoded one frame before the jump clock reaches it, and each other needed frame at most `LEAP_HOLD` (200 ms) after its time. A load past its latency is late. At the 1000 ms limit the PR 303 rule stays: the leap plays if its first frames are decoded, else the code motion plays.
- The selection prefetch puts all leaps in one queue: the first frame and turn of each, then the needed frames of all in the order the clocks reach them (a turn first delays a jump). The frames stay pinned while the piece is selected, within half of the 64 MiB budget.
- Captures (PR 300) and walks keep their code.

`tools/verify-painted-leaps.mjs start` is the new `leap-start` check (in the CI run of all checks). Each frame request waits 200 ms. It fails when a leap starts more than 150 ms (warm: select, 1 s, click) or 400 ms (cold: select, 150 ms, click) after the click. It prints the capture and walk delays.

## Checks

- Unit test: a leap starts on its first frame when the measured link brings the next frames within the hold; it waits for a first frame that is late. It fails on main (150 ms against 30 ms).
- Focused tests: `character-runtime` (88).
- `npm run check:browser leap-start painted-leaps character-runtime`: all pass. The guard on main: 5 of 8 leap cases fail (warm 252 to 261 ms, cold 478 ms).
- Start delay, click to move start (ms), local preview, Chromium, one run each. Rows: piece, army, facing, warm or cold. Columns: main 6bae4683d and the fix at each link.

| Case | main, no limit | fix, no limit | main, 50 Mbps 80 ms | fix, 50 Mbps 80 ms | main, 200 ms a request | fix, 200 ms a request | main, 4 Mbps 100 ms | fix, 4 Mbps 100 ms |
|---|---|---|---|---|---|---|---|---|
| knight white SE warm | 11 | 15 | 172 | 13 | 274 | 16 | 448 | 122 |
| knight white SE cold | 54 | 17 | 320 | 17 | 259 | 98 | 882 | 111 |
| knight white NW warm | 68 | 15 | 188 | 17 | 304 | 10 | 800 | 16 |
| knight white NW cold | 140 | 16 | 332 | 131 | 549 | 255 | 818 | 398 |
| paladin white SE warm | 142 | 17 | 146 | 10 | 272 | 10 | 572 | 447 |
| paladin white SE cold | 104 | 9 | 245 | 10 | 286 | 99 | 579 | 560 |
| paladin white NE warm | 95 | 13 | 175 | 15 | 267 | 16 | 558 | 143 |
| paladin white NE cold | 111 | 9 | 180 | 16 | 571 | 116 | 513 | 139 |
| knight black SE warm | 12 | 15 | 9 | 16 | 263 | 15 | 418 | 14 |
| knight black SE cold | 74 | 14 | 259 | 18 | 357 | 99 | 822 | 112 |
| knight black NW warm | 99 | 14 | 157 | 10 | 415 | 14 | 803 | 13 |
| knight black NW cold | 122 | 13 | 239 | 140 | 580 | 258 | 747 | 416 |
| paladin black SE warm | 70 | 14 | 176 | 17 | 279 | 16 | 496 | 207 |
| paladin black SE cold | 78 | 9 | 193 | 33 | 304 | 98 | 530 | 80 |
| paladin black NE warm | 109 | 17 | 177 | 10 | 541 | 10 | 482 | 16 |
| paladin black NE cold | 127 | 9 | 260 | 18 | 421 | 115 | 451 | 113 |

  The "200 ms a request" column is the `leap-start` link. Warm on main is the start wait for one more frame; cold on the fix is the time to the first frame of the leap (the frame queue toward four or eight targets).
- Capture (PR 300) and walk, same measure. Main and the fix are equal: the fix does not change them, and they do not have the 1 s wait. The warm rook walk on a free link waits 200 ms for its large idle to return to rest (the idle exit), on main also.

| Case | main, no limit | fix, no limit | main, 50 Mbps 80 ms | fix, 50 Mbps 80 ms | main, 4 Mbps 100 ms | fix, 4 Mbps 100 ms |
|---|---|---|---|---|---|---|
| knight capture warm | 16 | 15 | 16 | 10 | 129 | 174 |
| knight capture cold | 7 | 18 | 260 | 149 | 691 | 733 |
| rook walk warm | 238 | 225 | 15 | 14 | 8 | 17 |
| rook walk cold | 14 | 10 | 195 | 189 | 766 | 787 |

- Slow-link probe (`~/kd-runs/smooth/leap-streaming/leap-slow.mjs`, 2 runs, cold browser, all 8 targets from d4, both armies). Painted leaps (no fallback):

| Link | Release 15 | Main (PR 303) | Fix |
|---|---|---|---|
| 4 Mbps, 100 ms | 64 of 64 | 64 of 64 | 64 of 64 |
| 1.6 Mbps, 150 ms | 18 of 64 | 38 of 64 | 41 of 64 |

  Start at 4 Mbps: Knight 157 to 521 ms (main 237 to 994), Paladin 471 to 1035 ms (main 524 to 1240). Late pose at 4 Mbps: Knight at most 59 ms, Paladin at most 164 ms (main 47 and 165). At 1.6 Mbps the Knight starts earlier on NE (289 against 1075 ms) and holds a pose longer (at most 383 ms against 79 ms). Paladin at 1.6 Mbps: black N 0 of 2 (main 2 of 2), black NE, NW, SE, W 1 or 2 of 2 (main 0). Decoded peak 67,093,632 bytes, within 64 MiB. Full table: `~/kd-runs/leap-start/table.txt`.

Not checked: WebKit, mobile layouts, a real far-edge network other than the staging and live sites from this Mac, a Paladin with a capture in reach (its attack prefetch fills half of the budget first, as on main, so its leaps get no prefetch), the full suite (CI runs it).
