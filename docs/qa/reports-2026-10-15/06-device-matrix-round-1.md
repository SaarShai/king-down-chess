<!-- Copied from the run's scratch folder on 2026-10-15. Links to screenshots and raw data point to that folder and do not resolve here. -->

# Device-matrix QA — King Down plugin widget (ticket 06)

**Result:** The main journeys complete on 26 of 27 host copies, two times each. There are no console errors and no page-level horizontal scroll. At 200% zoom on the owner's iPhone copy the board is unusable (3–31 px), and the setup screen cannot be tapped. Four other layout faults show on 320-wide phones, iPad and an 820 × 600 window.

- Build: commit `2e7f6295` (M1 checkout `~/projects/kd-matrix`, `plugin-server-dist/board.html`), local fixture harness on the M1.
- Engine: **Chromium 1243 only.** The M1 has no Playwright WebKit, and this task allows localhost network use only, so I did not download it. The iPhone and iPad copies use Chromium with `isMobile` and `hasTouch` (the same method as `tools/plugin-ios-size.test.ts`).
- Runs: 27 hosts and settings × 7 journeys, done in two full passes (pass 1 `out1/`, pass 2 `out/`). The board widths are the same in both passes. Each finding below occurs in both passes (2/2), unless the finding says otherwise.
- Scripts: `matrix.mjs` (matrix), `motion.mjs` (reduced-motion probe), `analyze.py` (summary). Raw numbers: `out/<host>.json`, `agg1.txt`, `agg2.txt`.
- Android insets 24/80 are an **inference**, not a measured ChatGPT value. At 200% zoom I halved the viewport and the host insets (the host chrome stays the same physical size).

## Findings

| ID | Severity | Host and setting | Steps | Expected | Actual | Evidence |
|---|---|---|---|---|---|---|
| M1 | **blocker** (at this setting only; it is not known if a ChatGPT host allows page zoom) | 393 × 852 (102/118) and 412 × 915 (24/80), page zoom 200% (CSS viewport 197 × 426 and 206 × 458) | Play → New game → Computer, all features on → Start → Ready | A board that a player can use, and setup rows that a player can tap | At 393: board canvas **31 px** on the seat, **17 px** on the all-features seat and **3 px** on the all-features board. At 412: 100 px and 86 px. The setup body scrolls sideways (`#setup-body` 219 > 173 px). "10 kinds ›" covers the Fairy pieces text. Taps on the setup rows time out (Playwright: "waiting for element to be visible, enabled and stable"), so the computer and friend journeys cannot start. On Profile the totals and the W/D/L marks go outside the frame (`div.registry` 183 > 69 px). Badges are 30 × 44. Note: 197 CSS px is narrower than the WCAG 1.4.10 reflow width (320 px). | `ip-393x852-zoom200__allfeatures__board.png`, `__allfeatures__seat.png`, `__computer__ERROR.png`, `__profile__top.png`; `an-412x915-zoom200__*` |
| M2 | fault | Desktop 820 × 600, insets 59/34 | Any game: seat or board | A board that fills the free space | Board canvas **82 px** on every board and seat screen. The player strips and the context line take the height. **Also seen:** ticket 04 lists this as an open note for fault round 3. | `desk-820x600__allfeatures__board.png`, `desk-820x600__computer__move3.png` |
| M3 | fault | iPhone 320 × 568 (63/84) | Play → Profile, with 4-digit totals and open games | Totals with a gap; readable open-game and history rows | Totals run together: **"1234700"** (Played 1234, Won 700). The open-game title is cut to 30 px ("Comp…"), and its line breaks after each word ("Your turn / · move 1 / White / · Oct 15,"); the time is lost. In the history, the feature icons overlap the reason text ("Agreement", "Resignation"). The opponent names show as "pla…". The DOM overlap check does not see this overlap because the icons are SVG. | `ip-320x568__profile__top.png`, `ip-320x568__profile__history-end.png` |
| M4 | fault | iPad 768 × 1024 and 1024 × 768 (touch) | Play → Settings | Touch targets of 44 px or more | "Symbols only" and "Show threats" rows are **36 px** tall; the checkboxes are about 22 px. Likely cause: `src/style.css:635-638` gives `label` the 44 px floor only below 720 px width, and `src/plugin/app.css:171` (`body[data-touch='true']`) covers only `button`. | `ipad-768x1024__settings__settings.png`, `ipad-1024x768__settings__settings.png` |
| M5 | polish | Every width up to 400 px (320, 360, 375, 393, 400 panel) | Settings → Name and picture | The full page title | The title "Pick a name and a picture" ends in "…" (301 px of text in 210–290 px). At 320: "PICK A NAME AND …". Cause: `src/plugin/app.css:167` (`white-space: nowrap; text-overflow: ellipsis`). | `ip-320x568__settings__handle.png`, `ip-393x852__settings__handle.png` |
| M6 | polish | iPad 1024 × 768 | New game with every feature on → Start → Ready | Player names in full | With six coins in each strip, the names are cut: "Compu…", "Computer…", "alice_7c…", "1588 · Whi…". | `ipad-1024x768__allfeatures__board.png` |
| M7 | fault | Your games, every host | Play, with one friend game that waits for its code and one open random game | You can tell the two games apart | Both rows say "Waiting for an opponent · Just opened · <colour> · <date>". Only the colour is different, so the player cannot see which row is the friend-code game. | `ip-393x852__games__play-top.png`, `ip-393x852-dark__games__play-top.png` |
| M8 | polish | de-DE, ja-JP (and en-US) | Play → Your games; New game → A friend → code; Profile | One date style in the English UI | Play and the friend code use the device locale inside English text: "White · 15. Okt., 22:43", "Ends 10月23日 6:03." The Profile always uses en-GB: "14 Oct". In en-US the Play list says "Oct 15, 4:32 PM" and the Profile says "14 Oct". Causes: `src/plugin/games-list.ts:6` and `src/plugin/screens/friend.ts:50` (`Intl.DateTimeFormat(undefined, …)`), `src/plugin/screens/profile.ts:13-14` (`'en-GB'`). The app does not read the host context `locale`. Which style to use is a **taste** decision; the mix is the fault. Numbers ("1234", "1588") do not change with the locale. | `ip-393x852-ja__friend__code.png`, `ip-393x852-de__games__play-top.png`, `ip-393x852-de__profile__top.png` |
| M9 | polish | iPhone 375 × 667 | Profile, open games | No single word on a line | "White · Oct 15, 4:51 / PM": "PM" is alone on a line. | `ip-375x667__profile__top.png` |
| M10 | polish | iPhone 320 × 568 | Computer game, after the first moves (board 169 px) | Readable board edge labels | The file letters A–H draw over the rank 1 pieces, and the rank numbers draw over the a-file pieces. | `ip-320x568__computer__move3.png` |
| M11 | polish | Android 360 × 800, 412 × 915 | All screens | 48 px targets (Android guidance) | Most controls are 44 px tall: Back (48 × 44), Start game, Save, Copy the code, Cancel the game, Join, the code and name fields, the level and colour segments, "10 kinds ›" (73 × 44), "21 cards ›" (71 × 44), and the Settings toggles. They meet the 44 px iOS floor. | `out/an-360x800.json` (`small`), `an-360x800__computer__setup.png` |
| M12 | polish | 393 × 852 and 412 × 915, 20-character names | Profile history; Your games | Names in full, or a clear way to see them | "Maximiliana_Feathers" shows as "Maximiliana_F…" or "Maximiliana_Feath…". A 30-character name is refused by the server ("Use 3 to 20 characters…"), so 20 is the longest name. | `ip-393x852-longname__profile__history-end.png` |
| M13 | polish | Desktop 1280 × 800, iPad | Profile history | Text contrast 4.5:1 | The green "W" result mark measures **4.43:1** on the parchment (pixel sample). The card coin letters ("Fi", "St", "Cu", "Ra") measure 1.3–4.1:1 on the card art. The letters have a shadow and sit on art, so a person must look again; this number is approximate. | `desk-1280x800__profile__history-end.png`, `ipad-1024x768__allfeatures__board.png` |
| M14 | **taste** | Host theme dark plus `prefers-color-scheme: dark` | Any screen | — | The widget stays in its light parchment look (`src/style.css:115` `color-scheme: only light`). Text contrast in dark mode is the same as in light mode. This is a design choice for the owner, not a fault. | `ip-393x852-dark__games__play-top.png` |
| M15 | **taste** | 320 × 568 and 375 × 667 | Computer game: first move, then later moves | — | The board grows when the Abort note goes away: 158 → 169 px (320) and 210 → 221 px (375). The seat is 169 px and the first board is 158 px. Ticket 04 lists this layout choice as approval item L0. | `out/ip-320x568.json` |

## Board canvas width per host (px, both passes the same)

| Host (viewport; insets top/bottom) | Seat | Board, move 1 | Board, after reply | All-features board | Frame width | Canvas / frame |
|---|---|---|---|---|---|---|
| iPhone 320 × 568; 63/84 | 169 | 158 | 169 | 158 | 320 | 0.49–0.53 |
| iPhone 375 × 667; 63/84 | 221 | 210 | 221 | 210 | 375 | 0.56–0.59 |
| iPhone 393 × 852; 102/118 (owner's copy) | 302 | 302 | 302 | 302 | 393 | 0.77 |
| iPhone 393 × 852; no insets sent | 374 | 374 | 374 | 374 | 393 | 0.95 |
| iPhone 393 × 852; 59/34 (device only) | 318 | 318 | 318 | 318 | 393 | 0.81 |
| iPhone 430 × 932; 102/118 | 332 | 332 | 332 | 332 | 430 | 0.77 |
| iPhone 440 × 956; 102/118 | 355 | 355 | 355 | 355 | 440 | 0.81 |
| Android 360 × 800; 24/80 (inferred) | 347 | 347 | 347 | 347 | 360 | 0.96 |
| Android 412 × 915; 24/80 (inferred) | 403 | 403 | 403 | 403 | 412 | 0.98 |
| iPad 768 × 1024; 24/20 | 512 | 512 | 512 | 512 | 768 | 0.67 |
| iPad 1024 × 768; 24/20 | 483 | 483 | 483 | 483 | 1024 | 0.47 |
| Desktop side panel 400 × 900; none | 391 | 391 | 391 | 391 | 400 | 0.98 |
| Desktop 1280 × 800; none | 536 | 536 | 536 | 536 | 1280 | 0.42 |
| Desktop 820 × 600; 59/34 | **82** | **82** | **82** | **82** | 820 | 0.10 |
| 393 × 852 dark / reduced motion / de-DE / ja-JP / long name | 302 | 302 | 302 | 302 | 393 | 0.77 |
| 412 × 915 dark / reduced motion / de-DE / ja-JP / long name | 403 | 403 | 403 | 403 | 412 | 0.98 |
| 393 × 852 at 200% zoom | **31** (all features: 17) | journey blocked | — | **3** | 197 | 0.02–0.16 |
| 412 × 915 at 200% zoom | 100 | journey blocked | — | 86 | 206 | 0.42–0.49 |
| Inline 393 (home card only) | — | — | — | — | — | card 393 × 353 |

## Checks that passed (both passes)

- **Journeys:** on all 26 hosts without zoom, every journey ends: a computer game to move 3 (e2-e4, the computer's reply, d2-d3; revision 4), the Arrangement seat and Shuffle, New game with every feature on to the board, Your games with 6 rows, Profile, Settings and the name screen, and the friend invite. Bob joins with the code, and alice's board shows 300–450 ms after the page becomes visible again.
- **Console:** 0 errors and 0 warnings from the widget on every host and setting.
- **Horizontal scroll:** none on the page and none in any element, except at 200% zoom (M1).
- **Controls under the host insets or outside the frame:** none on any host without zoom. Controls below the fold are reachable by scroll. (On the inline card the tool reports Play and Your games inside the 96 px composer reserve. Inline has no composer over the card, so this is a measuring artefact, not a fault.)
- **Overlap (DOM):** none on any host without zoom. (The SVG icon overlap in M3 is from the screenshots.)
- **Touch targets, iPhone copies:** all 44 px or more. The 44 px failures are only on iPad Settings (M4) and at 200% zoom.
- **Reduced motion** (`motion.json`, 2 runs each): with reduce, the idle board shows 1 distinct frame in 3.2 s (8 without reduce), and a move shows 5 frames in 0.56 s (14 without). No CSS animation runs in the plugin screens with reduce.
- **Inline:** the card sends `size-changed` 393 × 353. The height stays at 353 after 3 rounds, and the card has no inner scroll.
- **Text clipping:** no rule or status text is cut on the seat or the board on any phone. Cut text is listed in M3, M5, M6 and M12 only.
- **Move timing (fixture):** 0.6–1.0 s from the first tap to the move call for move 3 (two taps with a 150 ms gap), and 2.2–3.0 s from the first tap of move 1 to the computer's reply on the board. The fixture replies in 250 ms or less, so these times say little about the real service.

## Could not test

- **WebKit** (iOS Safari engine): not installed on the M1, and the network rule allows localhost only. All iPhone and iPad results are from Chromium. WebKit `vh`/`dvh`, font and canvas behaviour are not tested.
- **The real ChatGPT hosts** (iOS, Android, desktop app, web): the insets 102/118 and 63/84 are copies of the owner's reading; the Android 24/80 insets are an inference.
- **Dark-mode contrast:** the widget ignores the dark theme (M14), so dark contrast equals light contrast.
- **30-character name:** the server allows at most 20 characters. I tested 20 characters for alice and bob.
- **Contrast on textures:** most text sits on parchment or stone art. I measured it from pixels of a text-free screenshot (median of 24 points per text box). Text drawn in the canvas (board labels, coins) is not measured.
- **Locale through the host:** the app does not read the host context `locale`. Only the browser locale changes the dates.
- **Large text (Dynamic Type):** a browser cannot copy the iOS text-size setting. The 200% page zoom stands in for it.
- **Hover-only behaviour and keyboard focus** on desktop: not in this matrix.
