# Fault round 4

Status: ready-for-human

The owner requests these eleven fixes on 2026-10-15. They come from F35 and from the device-matrix QA report (M1, M3, M4, M5, M7–M11, M13). Work stays on `claude/fault-round-4`, from `f1017eea` (fault rounds 1–3 merged). Do not push or merge.

## Plan and checks

1. Check each item on this head first. The QA report ran on the older commit `2e7f6295`.
2. Make the smallest change that fully fixes each item. Add a check that fails on the old code where a check is practical.
3. Take before and after screenshots and numbers with one script, on a clean copy of `f1017eea` and on this branch.
4. Run the touched plugin tests, the type check and `npm run check:browser plugin-ui`. Record results and limits. Commit with the requested trailer.

## Scope

Product files: `src/plugin/screens/board.ts`, `src/plugin/app.css`, `src/plugin/screens/profile.css`, `src/plugin/screens/setup.css`, `src/plugin/games-list.ts`, `src/plugin/screens/profile.ts`, `src/plugin/screens/friend.ts`, `src/render/board-ink.ts`, `src/render/PaintedView.ts`. Tests and checks: `tools/plugin-board.test.ts`, `tools/plugin-profile.test.ts`, `tools/plugin-ios-size.test.ts`, `src/render/board-ink.test.ts`, `tools/plugin-ui-check.mjs`.

Not changed, as the request says: names cut with "…" (M6, M12), dark mode (M14), the board size (M15, approval item L0), and all words except item 5.

## Status on this head before the fix

All eleven items are still present on `f1017eea`, with two partial exceptions:

- M3: the open-game title is 100 px wide at 320 × 568, not 30 px. The other M3 faults are still present: the totals touch, the time wraps, and the icons overlap the reason.
- M1: the setup rows accept taps in this local harness. The sideways scroll and the "10 kinds ›" overlap are still present.

## Changes and results

Numbers come from the shot script at the sizes named. Before = `f1017eea`; after = this branch.

| Item | Change | Before → after |
| --- | --- | --- |
| F35. Mate topple | `board.ts` `refresh()` lays the king down only when no move animates (`!animating`). No new motion. | During the mating move, `setFallen` received the king square → the square arrives only after the move ends. |
| M3. Profile at 320 × 568 (63/84) | Total figures use `min(--fs-xl, 11cqi)` with a 4 px column gap. In a scroll of 240 px or less, the feature icons go on a second line under the name. | Gap from "1234" to "700": 3 → 6 px. Name width: 30 px ("pla…") → 96 px (full). Icons overlap the reason text: yes → no. The time wraps "9:20 / PM" → it stays on one line. |
| M4. iPad touch | With touch, labels get the 44 px floor at all widths (`app.css`, touch and `pointer: coarse`). | Settings rows at 768 × 1024 and 1024 × 768: 36 → 44 px. |
| M5. Page titles | Sheet titles wrap (`overflow-wrap: anywhere`); no `nowrap` or ellipsis. The plugin overrides the website's `#menu-sheet` `nowrap`. | "Pick a name and a picture" at 320: cut → two lines, 58 px. The "Fairy pieces" sheet title at 197 px no longer goes under its ×. |
| M7. Friend wait | `waitingLine()`: a friend game says "Waiting for a friend" in Your games and Profile. | Two rows with the same words → two different titles. |
| M8. Dates | One constant `DATE_LOCALE` in `games-list.ts`: the device locale when it is English, else `en-US`. `formatDate()` serves Play, Profile and the friend code. | de-DE "15. Okt., 21:20", ja-JP "10月22日 21:30", Profile "14 Oct" → "Oct 15, 9:27 PM" and "Oct 14" everywhere. |
| M9. AM/PM | `formatDate()` puts a non-breaking space before AM or PM. | "PM" alone on a line → no line holds only AM or PM. |
| M10. Board labels | `coordInk(width)`: the label size is at most 40 board units and is centred in the 32-unit frame. Labels under 8 CSS px are not drawn (a board under 192 px). | 320 × 568 (158 px board): 12 px labels over the rank 1 and a-file pieces → no labels. 375 (210 px) and 393 (302 px): labels stay, inside the frame. |
| M13. W mark | `#3d6b1f` → `#3b671e`. | On the darkest parchment sample (`#e5d6bc`): 4.42:1 → 4.67:1. |
| M1. 200% zoom | New game: `#setup-body` is a size container. At 260 px or less, the modes stack, the segments wrap two to a line, and the toggle text takes its own line with "10 kinds ›" below it. Profile: at 260 px or less the scroll edge is thinner; in a scroll of 160 px or less the totals use two rows and the date has its own line. | 197 × 426: `#setup-body` 219 > 197 → no sideways scroll; `.registry` 183 > 69 → 125 = 125. "10 kinds ›" covered the text → it sits below the text and opens its sheet. The same results at 206 × 458. |
| M11. Android 48 px | The F9 hit layer now also covers `.seg-row` labels and the Settings toggles. With touch, text fields are 48 px. The Settings checkbox stays above the layer. | 360 × 800 controls under a 48 px tap area: 11 (code field, 4 level and 3 colour segments, 2 toggles, name field) → 0. Back, Start game, Save, Copy the code, Cancel the game, Join and "10 kinds ›"/"21 cards ›" already had 48 px from F9. |

## Checks

Each new check fails on `f1017eea` and passes on this branch:

- `plugin-board.test.ts`: the mated king falls only after the move ends.
- `plugin-profile.test.ts`: totals and rows at 320 × 568 (gaps, overlap, name width, AM/PM, friend wording, W contrast); one date style under de-DE, ja-JP and en-US; Profile at 197 px with no sideways scroll; the page title wraps.
- `plugin-ios-size.test.ts`: the Settings floor on both iPad sizes; the name page title at 320; 48 px tap areas on Android 360 × 800 (Play, New game, friend code, Settings, Name); New game at 197 px.
- `board-ink.test.ts`: the edge labels stay inside the frame or are hidden.

Results:

- `bash tools/test-lock.sh npx vitest run` on `board-ink`, `plugin-board`, `plugin-profile`, `plugin-ios-size`, `plugin-app`, `plugin-lobby`, `plugin-menus` and `plugin-ui-style` (`--no-file-parallelism`): 139 of 141 pass. The two failures are in `plugin-menus.test.ts` ("shows Starting at once…" and "keeps ‹ Play free…"). They fail in the same way on a clean copy of `f1017eea`, so this round did not cause them. After the checkbox fix, `plugin-ios-size` and `plugin-app` pass again: 60 of 60.
- `npm run typecheck`: pass.
- `npm run check:browser plugin-ui`: pass (260 s). Two of its assertions now expect "Waiting for a friend" for friend games (item 5). The first run found the Settings hit layer over the checkbox; the checkbox now sits above it.

Screenshots and numbers: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/fix/r4/shots/` (`before__*.png`, `after__*.png`, `before.json`, `after.json`, and the script `shots.mts`).

## Not checked

The full test suite runs later on the M1. Only Chromium was used: no WebKit, no real devices and no native ChatGPT hosts. The Android insets 24/80 are an estimate from the QA report. No push, merge or deploy. No test time limit changed.

## For the owner

- M10 hides the board labels on boards under 192 px (the 320 × 568 phone). The other choice is labels of about 7 px. This is a taste call: say if you want the small labels back.
- M8: `DATE_LOCALE` in `src/plugin/games-list.ts` sets the date style in one line.
