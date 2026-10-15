<!-- Copied from the run's scratch folder on 2026-10-15. Links to screenshots and raw data point to that folder and do not resolve here. -->

# Device-matrix QA, round 2

**Result:** The ordinary host copies complete the main journeys. At 200% zoom, the 197 px iPhone copy still has an unusable board. Eight round 1 findings are fixed. Three improve in part. Two other findings remain. Two taste items remain.

The M1 runs every browser. The test uses commit `1a18046f03d986504f5f81dd26fdb6bd616a2bfe`. The built HTML has **658,792 bytes**. Its SHA-256 is `d24d693e4beac0a50fbe4cd71b9f6b578b248144769f52f84d27ddd1a3474b76`.

The resource is `ui://kingdown/board-4dba62b9a73612b5c5f0f778fabb9a0d989da7de924bb422c3b3eec97d7df0dd.html`. [Build details](out/build-metadata.json) identify the loopback harness and the engine versions.

The run has **46 cases in each of two passes**. The original matrix has 27 cases. Two cases add the protocol locale and time-zone checks. Seventeen Chromium copies give a comparison with WebKit at the same sizes. WebKit **26.6** runs the iPhone and iPad copies. Chromium **153.0.8010.12** runs Android, desktop and the comparison copies. Each phone and iPad context sets `isMobile` and `hasTouch`. The host context also sets touch.

Each fullscreen case covers the seven requested journeys. Inline covers the home card only. The computer flow uses e2–e4, the computer reply, and d2–d3. “All features” enables Fairy pieces, Arrangement, Cards and King powers. Classic stays off in that combination. The run attempts a 30-character handle. The server refuses it. The run then uses 20 characters.

Android insets **24/80 are an inference**. They are not a reading from ChatGPT. At 200% zoom, the test halves the CSS viewport and host insets. The effective sizes are 197 × 426 and 206 × 458. The 197 px case is narrower than the 320 px reflow check. This test does not establish whether a real ChatGPT host permits page zoom.

## Open findings

Each finding repeats in both main passes. Rates refer to each named host and setting. These are existing findings. No product code changes in this run.

| ID | Severity; priority; rate | Host and steps | Expected | Actual | Evidence; likely cause |
|---|---|---|---|---|---|
| M1 | **blocker at this setting**; P1; 2/2 | iPhone copy, 200%; WebKit and Chromium. Open a computer game. Open an Arrangement seat. Turn all features on. | A board that a player can use. Setup and Profile reflow. | The first game board is **3 px**. WebKit sends **0 moves**. Exact Chromium test coordinates can send both moves. The seat is **12 px**; it can reach **0 px** after Shuffle. The all-features seat can be **0 × 0**. Setup now accepts taps. Its horizontal overflow is **0 px**. The Profile registry fits at **125 / 125 px**. Badge buttons remain **30 × 44 px**, and captions overlap. Android at 200% now completes the moves: **86 → 114 px**. | [WebKit board](out/pass2/ip-393x852-zoom200__computer__move3.png), [seat data](out/pass2/ip-393x852-zoom200.json), [badges](out/pass2/ip-393x852-zoom200__profile__badges.png). `src/plugin/app.css:185–193` gives the remaining height to the board. Wrapped headers also use more height. The badge grid stays at five columns in `screens/profile.css:41`. |
| M3 | polish; P3; 2/2 | 320 × 568. Open Profile. Inspect totals, open games and history. | Gaps between totals. Full names. Separate icons and reason text. | Totals and icons now fit. The first two totals have a **6.23 px** ink gap. History names have **96 px**, against **30 px** in the old narrow row. “Computer · Club” still needs **98 px**. An open-game “Computer · Beginner” needs **127 px** in **118 px**. | [Profile](out/pass2/ip-320x568__profile__top.png), [history](out/pass2/ip-320x568__profile__history-end.png), [data](out/pass2/ip-320x568.json). `screens/profile.css:20` keeps names on one line with ellipsis. |
| M6 | polish; P3; 2/2 in each engine | iPad 1024 × 768. Start a game with all features. Press Ready. | Full player names. | The name area stays at **60 px**. “Computer” needs **64 px**. Each strip has one power button and four card buttons. | [WebKit board](out/pass2/ipad-1024x768__allfeatures__board.png), [Chromium data](out/pass2/ipad-1024x768-cr.json). `src/plugin/app.css:181` applies ellipsis. The coins share the strip width. |
| M12 | polish; P3; 2/2 | 393 × 852 and 412 × 915. Use the longest accepted handle. Open Profile history. | The full name, or a clear way to read it. | “Maximiliana_Feathers” needs **139 px**. A 412 px host gives it **122 px**. The text still ends with “…”. The server limit remains **20 characters**. | [Phone history](out/pass2/ip-393x852-longname__profile__history-end.png), [Android data](out/pass2/an-412x915-longname.json). `screens/profile.css:20` and `screens/profile.ts:92` keep the one-line history name. |
| M13 | polish; P2; 2/2 | iPad and desktop. Open Profile history. Start an all-features game. Inspect the card letters. | Text contrast of **4.5:1** or more. | The W mark gets darker. Some parchment samples still fall below **4.5:1**. The portrait iPad gives **4.11:1 / 4.20:1** lowest median samples. Some card letters give about **1.35:1**. These are approximate texture samples. | [Profile](out/pass2/ipad-768x1024__profile__history-end.png), [card text](out/pass2/ipad-1024x768__allfeatures__board.png), [pixel data](out/pass2/ipad-768x1024.json). The W uses `#3b671e` in `screens/profile.css:25`. Card letters sit on art. |

## Round 1 findings

“Changed” means that part of the finding remains. The old values come from the round 1 report and JSON. The new values come from this run.

| ID | Status | Round 1 → round 2 | Evidence |
|---|---|---|---|
| M1 | **changed** | Seat **31 → 12 px**. All-features seat **17 → 0 px** in the collapsed case. Board **3 → 3 px**. Setup overflow clears. Profile totals reflow. Badge width stays **30 px**. | [Zoom data](out/pass2/ip-393x852-zoom200.json) |
| M2 | **fixed** | 820 × 600 seat and board: **82 → 360 px**. Both passes agree. | [Board](out/pass2/desk-820x600__computer__move3.png) |
| M3 | **changed** | Totals separate and icons move below the name. Narrow history name space: **30 → 96 px**. Some names still clip. | [Profile data](out/pass2/ip-320x568.json) |
| M4 | **fixed** | Both iPad Settings rows: **36 → 44 px**. Both engines pass. | [Settings](out/pass2/ipad-1024x768__settings__settings.png) |
| M5 | **fixed** | The name-page title uses ellipsis in round 1. It now wraps to **58 px** high. Its width is **210 / 210 px**. Clipped title records: **1 → 0** at 320 px. | [Name page](out/pass2/ip-320x568__settings__handle.png) |
| M6 | **still there** | “Computer” remains **64 px of text in 60 px**. | [Board data](out/pass2/ipad-1024x768.json) |
| M7 | **fixed** | Two equal waiting titles become **two distinct titles**: friend and opponent. The corrected list has **6 rows**. | [Six-game list](out/pass2/ip-393x852__games__play-bottom.png), [row text](out/pass2/ip-393x852.json) |
| M8 | **fixed** | The date style changes from device-language dates plus en-GB Profile dates to **one English style**. de-DE and ja-JP pass. Totals stay **1234**; rating stays **1588**. | [German data](out/pass2/ip-393x852-de.json), [Japanese data](out/pass2/an-412x915-ja.json) |
| M9 | **fixed** | The 375 px Profile no longer leaves AM or PM alone. The focused line check finds **0 isolated AM/PM lines** in both engines, twice. | [Profile](out/pass2/ip-375x667__profile__top.png), [line probe](out/focused/extras.json) |
| M10 | **fixed** | At **158–169 px**, labels no longer cover pieces. The renderer hides labels below **192 px** board width. At **210–221 px**, labels stay in the board edge. | [320 board](out/pass2/ip-320x568__computer__move3.png), [375 board](out/pass2/ip-375x667__computer__move3.png) |
| M11 | **fixed** | Visible boxes can stay at **44 px**. Their CSS tap areas reach **48 px**. Text fields rise to **48 px**. The focused test sends **6 / 6 successful taps** in the added area. | [Touch rectangles](out/pass2/an-360x800.json), [touch probe](out/focused/extras.json) |
| M12 | **still there** | The limit stays **20 characters**. A **139 px** name still clips in a **122 px** cell on Android. | [Long-name data](out/pass2/an-412x915-longname.json) |
| M13 | **changed** | W changes from `#3d6b1f` to `#3b671e`. The portrait iPad's lowest old median is **3.93:1**; the new samples are **4.11:1 / 4.20:1**. Card letters still have low contrast. | [Contrast data](out/pass2/ipad-768x1024.json) |
| M14 | **still there; taste** | Dark host and dark media preference still give **one light parchment scheme**. This is not a fault. | [Dark copy](out/pass2/ip-393x852-dark__games__play-top.png) |
| M15 | **still there; taste** | The board still grows **158 → 169 px** at 320, and **210 → 221 px** at 375. The Abort note goes away. This is not a fault. | [Board data](out/pass2/ip-320x568.json) |

## New faults

No new product fault appears outside M1–M15. No product fault has only one occurrence.

## Board canvas widths

All values are CSS px. Each cell shows **round 1 → pass 1 / pass 2**. The two inline copies show the home card only. The table includes every engine copy.

At 200%, the table names the original host size. Its effective CSS size is half that value, rounded. A WebKit “reply board” of 3 px is the measured board after the reply wait; **no reply arrives**. Chromium reaches a later game state. Its larger value is not a difference in the same rendered state.

The he-IL and Los Angeles cases have no round 1 setting match. Their old numbers use the default copy at the same size.

| Host; top/bottom insets | Engine | Seat: R1 → P1 / P2 | First board: R1 → P1 / P2 | Reply board: R1 → P1 / P2 | All features: R1 → P1 / P2 | Frame width | Canvas / frame, P2 |
|---|---|---:|---:|---:|---:|---:|---:|
| iPhone 320 × 568; 63/84 | WebKit | 169 → 169 / 169 | 158 → 158 / 158 | 169 → 169 / 169 | 158 → 158 / 158 | 320 | 0.49–0.53 |
| iPhone 375 × 667; 63/84 | WebKit | 221 → 221 / 221 | 210 → 210 / 210 | 221 → 221 / 221 | 210 → 210 / 210 | 375 | 0.56–0.59 |
| iPhone 393 × 852; 102/118 | WebKit | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 430 × 932; 102/118 | WebKit | 332 → 332 / 332 | 332 → 332 / 332 | 332 → 332 / 332 | 332 → 332 / 332 | 430 | 0.77 |
| iPhone 440 × 956; 102/118 | WebKit | 355 → 355 / 355 | 355 → 355 / 355 | 355 → 355 / 355 | 355 → 355 / 355 | 440 | 0.81 |
| iPhone 393 × 852; none | WebKit | 374 → 374 / 374 | 374 → 374 / 374 | 374 → 374 / 374 | 374 → 374 / 374 | 393 | 0.95 |
| iPhone 393 × 852; 59/34 | WebKit | 318 → 318 / 318 | 318 → 318 / 318 | 318 → 318 / 318 | 318 → 318 / 318 | 393 | 0.81 |
| Android 360 × 800; 24/80 | Chromium | 347 → 347 / 347 | 347 → 347 / 347 | 347 → 347 / 347 | 347 → 347 / 347 | 360 | 0.96 |
| Android 412 × 915; 24/80 | Chromium | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 412 | 0.98 |
| iPad 768 × 1024; 24/20 | WebKit | 512 → 512 / 512 | 512 → 512 / 512 | 512 → 512 / 512 | 512 → 512 / 512 | 768 | 0.67 |
| iPad 1024 × 768; 24/20 | WebKit | 483 → 483 / 483 | 483 → 483 / 483 | 483 → 483 / 483 | 483 → 483 / 483 | 1024 | 0.47 |
| Desktop 400 × 900; none | Chromium | 391 → 391 / 391 | 391 → 391 / 391 | 391 → 391 / 391 | 391 → 391 / 391 | 400 | 0.98 |
| Desktop 1280 × 800; none | Chromium | 536 → 536 / 536 | 536 → 536 / 536 | 536 → 536 / 536 | 536 → 536 / 536 | 1280 | 0.42 |
| Desktop 820 × 600; 59/34 | Chromium | 82 → 360 / 360 | 82 → 360 / 360 | 82 → 360 / 360 | 82 → 360 / 360 | 820 | 0.44 |
| Inline 393 × 852; 0/0 | WebKit | — | — | — | — | — | card 393 × 353 |
| iPhone 393 × 852; dark; 102/118 | WebKit | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; 200%; 102/118 | WebKit | 17 → 12 / 12 | — → 3 / 3 | — → 3 / 3 | 3 → 3 / 3 | 197 | 0.02–0.06 |
| iPhone 393 × 852; reduce; 102/118 | WebKit | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; de-DE; 102/118 | WebKit | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; ja-JP; 102/118 | WebKit | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; long name; 102/118 | WebKit | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| Android 412 × 915; dark; 24/80 | Chromium | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 412 | 0.98 |
| Android 412 × 915; 200%; 24/80 | Chromium | 100 → 87 / 87 | — → 86 / 86 | — → 114 / 114 | 86 → 86 / 86 | 206 | 0.42–0.55 |
| Android 412 × 915; reduce; 24/80 | Chromium | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 412 | 0.98 |
| Android 412 × 915; de-DE; 24/80 | Chromium | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 412 | 0.98 |
| Android 412 × 915; ja-JP; 24/80 | Chromium | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 412 | 0.98 |
| Android 412 × 915; long name; 24/80 | Chromium | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 403 → 403 / 403 | 412 | 0.98 |
| iPhone 393 × 852; he-IL; 102/118 | WebKit | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| Desktop 1280 × 800; Los Angeles; none | Chromium | 536 → 536 / 536 | 536 → 536 / 536 | 536 → 536 / 536 | 536 → 536 / 536 | 1280 | 0.42 |
| iPhone 320 × 568; 63/84 | Chromium | 169 → 169 / 169 | 158 → 158 / 158 | 169 → 169 / 169 | 158 → 158 / 158 | 320 | 0.49–0.53 |
| iPhone 375 × 667; 63/84 | Chromium | 221 → 221 / 221 | 210 → 210 / 210 | 221 → 221 / 221 | 210 → 210 / 210 | 375 | 0.56–0.59 |
| iPhone 393 × 852; 102/118 | Chromium | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 430 × 932; 102/118 | Chromium | 332 → 332 / 332 | 332 → 332 / 332 | 332 → 332 / 332 | 332 → 332 / 332 | 430 | 0.77 |
| iPhone 440 × 956; 102/118 | Chromium | 355 → 355 / 355 | 355 → 355 / 355 | 355 → 355 / 355 | 355 → 355 / 355 | 440 | 0.81 |
| iPhone 393 × 852; none | Chromium | 374 → 374 / 374 | 374 → 374 / 374 | 374 → 374 / 374 | 374 → 374 / 374 | 393 | 0.95 |
| iPhone 393 × 852; 59/34 | Chromium | 318 → 318 / 318 | 318 → 318 / 318 | 318 → 318 / 318 | 318 → 318 / 318 | 393 | 0.81 |
| iPad 768 × 1024; 24/20 | Chromium | 512 → 512 / 512 | 512 → 512 / 512 | 512 → 512 / 512 | 512 → 512 / 512 | 768 | 0.67 |
| iPad 1024 × 768; 24/20 | Chromium | 483 → 483 / 483 | 483 → 483 / 483 | 483 → 483 / 483 | 483 → 483 / 483 | 1024 | 0.47 |
| Inline 393 × 852; 0/0 | Chromium | — | — | — | — | — | card 393 × 353 |
| iPhone 393 × 852; dark; 102/118 | Chromium | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; 200%; 102/118 | Chromium | 17 → 12 / 12 | — → 3 / 3 | — → 47 / 47 | 3 → 3 / 3 | 197 | 0.02–0.24 |
| iPhone 393 × 852; reduce; 102/118 | Chromium | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; de-DE; 102/118 | Chromium | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; ja-JP; 102/118 | Chromium | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; long name; 102/118 | Chromium | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |
| iPhone 393 × 852; he-IL; 102/118 | Chromium | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 302 → 302 / 302 | 393 | 0.77 |

## Engine and layout checks

| Check | Result in round 2 |
|---|---|
| Same-size engine comparison | All four main widths agree in the **15 fullscreen pairs without zoom**, twice. Both inline engines report **393 × 353 px**. At 197 px, both first boards are **3 px**. Chromium reaches the reply state; WebKit does not. |
| Repeatability | All **176 numeric main-width values** agree between pass 1 and pass 2. |
| Fonts | The active Cinzel and Alegreya Sans faces load in both engines. The 16 px test string measures **129.53601 px** in WebKit and **129.53587 px** in Chromium. The difference is about **0.00014 px**. |
| Canvas size | Main-matrix backing sizes are **960 × 1024** or **1200 × 1280**. The focused 3× iPad probe also uses **1680 × 1792**. The minimum backing-to-required-pixel ratio is **1.006**. The maximum fit error is **0.97 CSS px**. No new canvas-size fault appears. |
| Viewport units | Reported `vh` and `dvh` match the test viewport. A **350 px stale-unit simulation** changes the tested board widths by **0 px** in all **18 focused cases**. This probe covers the board. |
| Safe areas | Measured frame-edge error is **0 px**. The bottom reserve uses the larger of the supplied inset and the **96 / 128 px** floor. No fullscreen control is unreachable on a host without zoom. |
| Tap areas | iPad Settings rows are **44 px**. Android fields and CSS tap areas reach **48 px**. All **6** taps in the added Android segment area select the intended level. |
| Text and scroll | Page and inner horizontal-scroll failures: **0** in the 92 main cases. DOM overlap records: **0**. The screenshots still show badge-caption ink overlap under M1. The DOM box check does not detect that ink overlap. Other clipped names remain under M3, M6 and M12. |
| Dates | de-DE and ja-JP use the English date style. WebKit uses “at” before the time; Chromium uses a comma. The 375 px line probe finds **0 isolated AM/PM lines**, twice in each engine. |
| CSP | All **9 focused cases with the localhost resource policy** have **0 console errors**. The policy permits the local resource origin and denies widget connections. This is not the real ChatGPT sandbox. |
| Console and network | The **92 main cases** have **0 console records**, **0 script errors** and **0 blocked external origins**. No new journey fault appears. M1 remains the play limit. |

The motion probe uses eight idle samples across 3.2 s and fourteen move samples across 0.56 s. Each row has two repetitions. The first idle sample window crosses the new passive-motion limit. These are browser samples, not device frame-rate or battery measurements.

| Host and engine | Normal idle frames | Reduced idle frames | Normal move frames | Reduced move frames | Reduced idle after move |
|---|---:|---:|---:|---:|---:|
| 393 × 852, WebKit | 6 / 6 | 1 / 1 | 14 / 14 | 3 / 3 | 1 / 1 |
| 393 × 852, Chromium | 6 / 6 | 1 / 1 | 14 / 14 | 5 / 5 | 1 / 1 |
| 412 × 915, Chromium | 6 / 6 | 1 / 1 | 14 / 14 | 5 / 4 | 1 / 1 |

[Motion data](out/motion/motion.json), [focused data](out/focused/extras.json) and [layout totals](out/metrics.json) contain the measurements. The 197 px name-page probe also selects the last picture in both engines, twice. Tall scroll-box warnings do not prevent that action.

## Evidence and test limits

[Checks by host](out/checks.csv) give the raw counts. [Detailed results](out/summary-detail.json) give each warning and its screen. Each main pass folder has one JSON file per case and PNGs for the screens. Flow records include the tool calls and the game view. [The evidence manifest](out/evidence-manifest.json) gives file sizes and hashes.

The runner reuses `matrix.mjs`, `motion.mjs` and `analyze.py` from round 1. The old runner seeds six games, then creates three more before the list check. Its measured row count is nine. Pass 1 repeats that load. The corrected runner resets to six and asserts six rows. Pass 2 uses this correction. A [pass 1 supplement](out/pass1-sixgames/summary.json) checks the six-game list on all 44 fullscreen cases. Thus each fullscreen case has two six-game checks.

The first focused probe tries Pieces before it selects an opponent. The corrected probe selects Computer first. All 18 corrected cases pass. This is a probe fault.

The first smoke probe reads a frame during Remount. Navigation destroys that script context. The corrected probe waits for navigation. Both corrected smoke cases pass. No product finding comes from that probe error.

Pass 1 table metadata can select the hidden board table on a seat. The report does not use that zero rectangle as a fault. Pass 2 selects the visible seat table. It also records a zero-size canvas directly. The small-canvas settle probe accepts a stable positive width. Its time bound stays unchanged.

The control-bounds helper requires a whole control box to fit in its scroll viewport. A tall zoomed row can exceed that viewport while its parts remain available by scroll. The inline composer warnings are also measurement artefacts. Inline has no composer over the home card. The report separates these warnings from confirmed faults.

Visible 44 px boxes alone do not establish M11. A CSS pseudo-element can supply the 48 px tap area. The focused probe checks the added area with real touch events.

Pass 1 keeps the round 1 tool's 3:1 floor for large text. Pass 2 uses 4.5:1 for all text. Its extra strictness finds no new contrast selector.

Contrast on art uses the round 1 pixel method. The probe hides text, samples 24 background points per text box, and computes a median. It does not include the text shadow. Card art varies with the deal. Treat these values as approximate. Canvas text is checked in the screenshots. It is not included in the DOM text-contrast totals.

## What this run cannot test

- Real ChatGPT hosts, native safe areas, composer overlays and the on-screen keyboard. Android insets remain an inference.
- Fonts on real phones, Dynamic Type, haptics, the Silent switch, battery use or heat. M1 browser copies do not establish these results.
- A true first-run player. The fixture starts with named players. The server refuses a 30-character name.
- Real service timing, rating updates, badge awards, deadlines and code limits. The fixture omits or shortens these behaviours.
- The complete release protocol, a main-branch render comparison, desktop keyboard focus or a screen-reader game. This is the requested device matrix.
- The real ChatGPT sandbox CSP. The focused pass applies a localhost resource policy to the harness. It does not reproduce the full host sandbox.

## Repository and process check

The commit and Git status match the start values. The built HTML hash also matches. [Verification data](out/verification.json) records these checks. The task writes only QA files in the output folders. It makes no deployment or public-site request. It changes no test limit.

The copy contains **2,194 verified evidence files** and **2,821,985,291 bytes**. The local hash check has **0 mismatches**. [Copy verification](out/copy-verification.json) and [process verification](out/process-verification.json) record the result. The task closes its browsers and stops its own harness. It stops no other session's process.
