# Stream Knight and Paladin leaps on a slow link

Status: local checks pass. CI and the merge are open in the pull request.

## Fault

After PR 305 (issue 47), at 1.6 Mbps (the PR 303 slow-link probe, 64 leaps):

- Only 41 of 64 leaps played painted. The others fell back to code motion.
- A Knight held one pose up to 383 ms during a leap (before PR 305: 79 ms).
- Paladin black N played 0 of 2 painted (before PR 305: 2 of 2).
- A Paladin with a capture in reach got no leap prefetch: its attack prefetch filled half of the 64 MiB budget first.

## Cause

Traces of the runtime loads and of the probe proxy (`~/kd-runs/leap-slow/`, `show.mjs` and `px.mjs`) show five parts:

1. Six loads at once share a link that bandwidth limits. Each load takes six times as long, and the six end together. The frame that the leap needs first comes late, and the link stands idle for a round trip after each group.
2. The start rule of PR 305 (`leapWait`) took the measured latency from all loads. A load that the click had stopped, and that was asked for again, ended in a few milliseconds (the browser kept its transfer), so the measured latency was too short. The start came before the frames could come.
3. The click stopped the transfers of the selection prefetch, also of the frames of the clicked leap. They loaded again.
4. The stream stopped the transfer of each frame that the playhead passed, also near its end (95% of the bytes in the trace). The bytes were lost, and the pose before it held on.
5. The Paladin needed every fourth frame. Every fourth frame holds a pose about 165 ms past its slot, even when each frame is in time. The capture prefetch of a jumping piece ran before the leaps and took all of its half of the budget.

## Change

`src/render/painted/character-runtime.mjs`:

- The runtime reads the resource timing of each frame (`PerformanceObserver`): the round trip (request to first byte) and the time for one frame on the link (the time in which bytes arrive, over the last eight frames). `slots()` is the number of loads that keeps the link busy over a round trip, 2 to 6. A link that takes less than 20 ms for a frame (`FAST_FRAME`; 20 kB in 20 ms is 8 Mbps) keeps six, as on release 16. On a slow link, a load starts at least half a frame time after the one before it, so the loads do not end together.
- The latency of a load is at least the round trip plus the frames of all slots. A load that the runtime stopped and that ends early is not measured.
- A load in transfer runs on when the selection ends, so the clicked leap takes it over. A frame that the playhead passed runs on if it is in transfer; it shows as the nearer pose. New stream frames queue behind the stream's other frames.
- `leapPlan` takes every third frame when every second is too large (the Paladin). On a link limited by bandwidth, each needed frame must be decoded before the needed pose before it holds `POSE_HOLD` (150 ms) past its slot. On a link that bandwidth does not limit, the PR 305 rule stays (a frame may come 200 ms after its time), so the fast-link start does not change.
- At the 1000 ms limit, a leap whose first frames are decoded waits up to `LEAP_LATE` (500 ms) more for its stream to come in time, then plays. A late start shows less than a pose that holds 250 ms in the leap.
- A jumping piece prefetches its captures and its leaps in one queue: the first frames and turn of each capture and each leap, then the needed leap frames and the strike frames in the order the clocks reach them.

## Checks

- Unit test: a selected Knight leap on a simulated link (150 ms to the first byte, 200 bytes a millisecond that all transfers share, 20 kB a frame; select, 1 s, click). It plays painted, no needed pose holds more than 150 ms past its slot (87 ms), it starts within 400 ms of the click (210 ms) and it loads no frame twice. It fails on main: the start waits 760 ms, and the click loads six frames again.
- `npm run check:browser leap-start painted-leaps character-runtime`: all pass. A first build without `FAST_FRAME` failed `painted-leaps` on the local preview: the round trip there is also short, so it took two slots and a Paladin leap passed two frames.
- Focused tests: `character-runtime` (89), `scene-load` (86), `character-runtime-package` (17), `painted-attack-package`, `painted-leaps.docs`. `npm run typecheck` passes.
- `leap-start` (`tools/verify-painted-leaps.mjs start`, local preview, two runs): warm 7 to 20 ms, cold 63 to 263 ms, all inside the limits (150 and 400 ms). Main in the same session: warm 7 to 8 ms, cold 65 to 285 ms.
- Slow-link probe (`~/kd-runs/smooth/leap-streaming/leap-slow.mjs`, 2 runs, cold browser, all 8 targets from d4, both armies, Chromium). Release 16 is main 8417572, measured in this session. "Before PR 305" is the PR 303 build from issue 47 (`~/kd-runs/leap-start/table.txt`). Each cell: painted leaps of runs (longest start from the click, longest pose hold past its slot).

| Link | Before PR 305 | Release 16 | New |
|---|---|---|---|
| 4 Mbps, 100 ms: painted | 64 of 64 | 64 of 64 | 64 of 64 |
| 1.6 Mbps, 150 ms: painted | 38 of 64 | 43 of 64 | 59 of 64 |
| 1.6 Mbps: longest hold, Knight | 79 ms | 527 ms | 60 ms |
| 1.6 Mbps: longest hold, Paladin | 576 ms | 239 ms | 144 ms |
| 4 Mbps: longest start, Knight | 994 ms | 518 ms | 571 ms |
| 4 Mbps: longest start, Paladin | 1240 ms | 905 ms | 538 ms |

| Link | Piece | Army | Facing | Before PR 305 | Release 16 | New |
|---|---|---|---|---|---|---|
| 1.6 Mbps | knight | black | NE | 4/4 (1075, 50 ms) | 4/4 (291, 376 ms) | 4/4 (766, 59 ms) |
| 1.6 Mbps | knight | black | NW | 4/4 (1390, 79 ms) | 4/4 (1344, 50 ms) | 4/4 (1281, 59 ms) |
| 1.6 Mbps | knight | black | SE | 4/4 (1072, 50 ms) | 4/4 (1059, 145 ms) | 4/4 (670, 59 ms) |
| 1.6 Mbps | knight | black | SW | 4/4 (1390, 59 ms) | 4/4 (1345, 527 ms) | 4/4 (1321, 50 ms) |
| 1.6 Mbps | knight | white | NE | 4/4 (1139, 59 ms) | 4/4 (321, 376 ms) | 4/4 (724, 59 ms) |
| 1.6 Mbps | knight | white | NW | 4/4 (1397, 59 ms) | 4/4 (1348, 295 ms) | 4/4 (1002, 59 ms) |
| 1.6 Mbps | knight | white | SE | 4/4 (1087, 59 ms) | 4/4 (1120, 167 ms) | 4/4 (774, 60 ms) |
| 1.6 Mbps | knight | white | SW | 4/4 (1401, 59 ms) | 4/4 (1382, 59 ms) | 4/4 (1070, 59 ms) |
| 1.6 Mbps | paladin | black | E | 2/2 (1139, 162 ms) | 2/2 (1127, 168 ms) | 2/2 (1159, 143 ms) |
| 1.6 Mbps | paladin | black | N | 2/2 (1391, 162 ms) | 0/2 | 2/2 (1282, 140 ms) |
| 1.6 Mbps | paladin | black | NE | 0/2 | 1/2 (1250, 169 ms) | 2/2 (1051, 140 ms) |
| 1.6 Mbps | paladin | black | NW | 0/2 | 2/2 (1256, 238 ms) | 1/2 (1496, 142 ms) |
| 1.6 Mbps | paladin | black | S | 0/2 | 0/2 | 2/2 (1365, 140 ms) |
| 1.6 Mbps | paladin | black | SE | 0/2 | 2/2 (1037, 239 ms) | 2/2 (1526, 143 ms) |
| 1.6 Mbps | paladin | black | SW | 0/2 | 2/2 (1276, 163 ms) | 2/2 (1212, 140 ms) |
| 1.6 Mbps | paladin | black | W | 0/2 | 2/2 (1391, 164 ms) | 2/2 (1112, 143 ms) |
| 1.6 Mbps | paladin | white | E | 2/2 (1141, 576 ms) | 0/2 | 2/2 (1154, 143 ms) |
| 1.6 Mbps | paladin | white | N | 0/2 | 0/2 | 2/2 (1574, 143 ms) |
| 1.6 Mbps | paladin | white | NE | 0/2 | 0/2 | 2/2 (1767, 144 ms) |
| 1.6 Mbps | paladin | white | NW | 0/2 | 0/2 | 2/2 (1709, 141 ms) |
| 1.6 Mbps | paladin | white | S | 0/2 | 0/2 | 2/2 (1600, 143 ms) |
| 1.6 Mbps | paladin | white | SE | 0/2 | 0/2 | 2/2 (1539, 140 ms) |
| 1.6 Mbps | paladin | white | SW | 0/2 | 0/2 | 0/2 |
| 1.6 Mbps | paladin | white | W | 0/2 | 0/2 | 0/2 |
| 4 Mbps | knight | black | NE | 4/4 (237, 0 ms) | 4/4 (155, 59 ms) | 4/4 (157, 48 ms) |
| 4 Mbps | knight | black | NW | 4/4 (791, 47 ms) | 4/4 (400, 47 ms) | 4/4 (402, 43 ms) |
| 4 Mbps | knight | black | SE | 4/4 (542, 43 ms) | 4/4 (156, 49 ms) | 4/4 (157, 33 ms) |
| 4 Mbps | knight | black | SW | 4/4 (822, 1 ms) | 4/4 (400, 46 ms) | 4/4 (401, 43 ms) |
| 4 Mbps | knight | white | NE | 4/4 (342, 36 ms) | 4/4 (158, 50 ms) | 4/4 (171, 57 ms) |
| 4 Mbps | knight | white | NW | 4/4 (808, 10 ms) | 4/4 (397, 33 ms) | 4/4 (413, 47 ms) |
| 4 Mbps | knight | white | SE | 4/4 (557, 43 ms) | 4/4 (158, 58 ms) | 4/4 (163, 57 ms) |
| 4 Mbps | knight | white | SW | 4/4 (994, 42 ms) | 4/4 (518, 47 ms) | 4/4 (571, 47 ms) |
| 4 Mbps | paladin | black | E | 2/2 (611, 0 ms) | 2/2 (664, 115 ms) | 2/2 (337, 143 ms) |
| 4 Mbps | paladin | black | N | 2/2 (859, 0 ms) | 2/2 (831, 152 ms) | 2/2 (398, 141 ms) |
| 4 Mbps | paladin | black | NE | 2/2 (749, 0 ms) | 2/2 (704, 0 ms) | 2/2 (527, 144 ms) |
| 4 Mbps | paladin | black | NW | 2/2 (1240, 0 ms) | 2/2 (506, 151 ms) | 2/2 (518, 144 ms) |
| 4 Mbps | paladin | black | S | 2/2 (648, 0 ms) | 2/2 (583, 101 ms) | 2/2 (393, 140 ms) |
| 4 Mbps | paladin | black | SE | 2/2 (524, 0 ms) | 2/2 (589, 0 ms) | 2/2 (336, 143 ms) |
| 4 Mbps | paladin | black | SW | 2/2 (979, 0 ms) | 2/2 (722, 0 ms) | 2/2 (501, 141 ms) |
| 4 Mbps | paladin | black | W | 2/2 (1039, 0 ms) | 2/2 (391, 164 ms) | 2/2 (400, 144 ms) |
| 4 Mbps | paladin | white | E | 2/2 (952, 0 ms) | 2/2 (621, 163 ms) | 2/2 (346, 144 ms) |
| 4 Mbps | paladin | white | N | 2/2 (922, 0 ms) | 2/2 (905, 0 ms) | 2/2 (402, 140 ms) |
| 4 Mbps | paladin | white | NE | 2/2 (788, 0 ms) | 2/2 (770, 0 ms) | 2/2 (508, 141 ms) |
| 4 Mbps | paladin | white | NW | 2/2 (1024, 0 ms) | 2/2 (535, 169 ms) | 2/2 (515, 143 ms) |
| 4 Mbps | paladin | white | S | 2/2 (1021, 0 ms) | 2/2 (690, 88 ms) | 2/2 (432, 143 ms) |
| 4 Mbps | paladin | white | SE | 2/2 (558, 165 ms) | 2/2 (579, 164 ms) | 2/2 (538, 143 ms) |
| 4 Mbps | paladin | white | SW | 2/2 (1008, 0 ms) | 2/2 (804, 42 ms) | 2/2 (536, 140 ms) |
| 4 Mbps | paladin | white | W | 2/2 (1208, 0 ms) | 2/2 (870, 44 ms) | 2/2 (389, 141 ms) |

  At 1.6 Mbps no facing is worse than before PR 305. Paladin black NW plays 1 of 2 (release 16: 2 of 2, before PR 305: 0 of 2). Paladin white SW and W play 0 of 2, as on release 16. The white Paladin has a capture in reach (a7); it now plays 12 of 16 (release 16: 0 of 16). A slow leap starts later than on release 16 (up to 1767 ms against 1391 ms) because it waits for its stream (`LEAP_LATE`). The Paladin holds up to 144 ms at both links: with every third frame, the pose of frame 3 holds until frame 6. At 4 Mbps the Knight starts as on release 16: a second pair of runs of Knight white SW, NW and NE gave 395 to 634 ms against 392 to 575 ms on release 16.
- Decoded peak: 66,807,360 bytes (release 16: 67,093,632), inside 64 MiB (67,108,864).

Not checked: WebKit, mobile layouts, a real slow network (only the probe proxy, which is HTTP/1.1 and shares the link equally), HTTP/2 to the CDN, a browser without resource timing for the frames (the runtime then keeps six loads, as on release 16), the full suite (CI runs it).
