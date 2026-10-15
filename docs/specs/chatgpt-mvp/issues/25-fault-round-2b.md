# Fault round 2, builder B

Status: ready-for-human

The owner approves these faults on 2026-10-15. Builder B owns the menus, lists and pages of the widget, and the plugin server. Builder A owns the board, the seat and the renderer. Work stays on `claude/fault-round-2b` from `66738a7b`. Do not push or merge.

## Plan and checks

1. Read each fault item. Check that the fault occurs at `66738a7b`.
2. Write a test that fails on the old code, then fix the cause once in shared code. Trivial text and CSS fixes share one test.
3. Run the touched plugin tests, `npm run typecheck`, `npm run plugin:build` and the plugin UI check.
4. Record each fault, its files and before → after here.

## Changes and results

| Fault | Files | Before → after |
| --- | --- | --- |
| F2. One rule text | `powers-ui.ts`, `screens/setup.ts`, `screens/collection.ts`, `screens/board.ts`, `read.ts` | Each page had its own filter and rules. Now one `ruleLine` gives the web's words ("take", not "capture"), a capital and a full stop on the Cards sheet, the king sheet, the Collection and the board. The Collection read the last game's rules; now its powers use the king-power rules and its cards use the default game (King powers off), as the Cards sheet does for the default setup. The pawn tip: "Moves 1 square forward." → "Moves 1 square forward. Moves 2 from its start rank." The website tip changes too. |
| F4. Opponent's move | none | Not reproduced. The J12 steps (f3, e5, g4, Qh4) in a friend game show each reply and the mate with no Reload, at `66738a7b` and after. With no sign of the opponent in 2 minutes, a daily game reads every 30 s (`poll.ts`). J7 needs no refresh item for this case. |
| F5. Start pending state | `screens/setup.ts` | Start only turned grey. Now it says "Starting your game…" at once. After 10 s it says "Still starting. Keep this page open." and ‹ Play comes back on. Start sends no second Create; the test counts 1. **Words wait for the owner (W3).** |
| F6. Name page | `index.html` | "Each name is unique. You pick it once, at your first game against a person." → "Each name is unique." The field fills only a saved name; a player with none gets an empty field. |
| F12. New game scroll | `app.ts` | The reset scrolled the sheet, which does not scroll. Now each page body opens at the top: 300 px → 0. |
| F15. Profile and Collection | `screens/profile.css`, `screens/profile.ts`, `screens/collection.ts` | The scroll had its own scroll area. Now it is part of the page scroll; at the page end its bottom roller shows. The Collection shows "Powers" once for each king (2 → 1). |
| F16. Your turn once | `games-list.ts` | "Your turn · move 3" plus the pill → "Move 3" plus the pill. |
| F17. Code fields | `index.html`, `app.css` | Placeholder `--stone-500` → `--ink-soft`. Both fields get `autocorrect="off"`. |
| F18. 1 game | `app.ts`, `server.ts` | "Your move in 1 games." → "Your move in 1 game." in the widget and the model text. |
| F20. Lining figures | `app.css` | Old-style figures → `lining-nums`; the move list keeps `tabular-nums`. |
| F21. Home kings | `app.css` | At 360 px the outer kings were 23 px outside the card. The kings' height is now `min(150px, 36vw)`; all six stay inside. |
| F22. New game margins | `screens/setup.css` | The website's `#new-game` dialog size loaded later and won: the page was 369 px in a 393 px frame (16 / 40 px). The rule now outranks it: 16 / 16 px. |
| F23. Play list width | `app.css` | Edge to edge on wide screens → the Play body stops at 640 px. |
| F24. Save bar | none | Not reproduced. Scrolled to the end, the last portrait row ends 32 px above the Save bar at 393 × 852 (102/118), 320 × 568 (63/84) and 393 × 660. The bar is a flex sibling of the scrolling form, so it cannot cover it. |
| F25. Play type sizes | `app.css` | Play had 20 px in the title and the code field. Title → `--fs-xl` (23 px), the size of the other sheet titles on a wide screen; code field → `--fs-lg` (18 px). All Play text is on the token scale at 393 and 820 px. |
| Safe-area insets | `app.ts` | A negative host inset set a negative padding → each `--safe-*` is 0 or more. |
| A4. Read-only hint | `server.ts`, `match/service.ts`, `match/store.ts`, `plugin/service.ts`, `api/http.ts` | `kingdown_get` has `readOnlyHint: true` but wrote `last_seen_at`. Now no read writes. The new app-only tool `kingdown_seen` (not read-only, idempotent, not destructive) records seat activity at most once each 30 seconds. The board's poll calls it when 30 s have passed. The website's game read calls it too, so its online mark stays. 24 → 25 tools. |
| C5. Board URI | `server.ts` | The server served only the current `board-<hash>.html`. Now a resource template serves the current page for every `ui://kingdown/board-<hash>.html`; `kingdown_open` names the current hash. The ext-apps helper takes one URI only, so the server uses the SDK's `ResourceTemplate`. A test reads an old hash and gets the current page. |

New tests: `tools/plugin-menus.test.ts` (8 browser tests; 7 fail on the old source, the J12 test passes on both) and three in `src/plugin/server.test.ts` (each fails on the old server). The pawn tip test in `src/read.test.ts` fails on the old code. The eight-word read limit now skips the pawn.

Files outside the given list: `screens/board.ts` (2 lines: the card and power text of F2; builder A owns the file), `src/read.ts` and `src/powers-ui.ts` (shared text, as F2 says), `src/api/http.ts` (1 line: the website read keeps its activity record), `screens/setup.css` (F22), and the checks and docs that list tools or old text.

## Checks

- `npx vitest run` on 11 touched files (menus, profile, app, lobby, UI harness, protocol fixture, server, plugin HTTP, read, powers-ui, new-game): 216 pass. `tools/plugin-ios-size.test.ts` and `tools/plugin-ui-style.test.ts`: 11 pass.
- `npm run check:browser plugin-ui` (the build, then `tools/plugin-ui-check.mjs` in the fixture host on a free port): passes in 307 s.
- `npm run plugin:check:protocol`: 25 tools and their hints pass.
- `npm run typecheck`, `npm run plugin:build`, `npm run test:docs` (113 tests) and `git diff --check` pass.

## Choices for the owner

- F5: the long wait starts at 10 s. The words are W3 option a.
- F25: the Play title takes 23 px (the wide-screen title size), not the nearest 18 px.
- F2: the Collection's cards read as in the default game (King powers off). With King powers on, Freeze, Ice Wall and Strike play the balanced readings; the Cards sheet shows those for that setup.

## Not checked

The database tests (`src/plugin/server.db.test.ts` changes for `kingdown_seen`) need `PLUGIN_TEST_DATABASE_URL`; the M1 runs them with the full `npm test`. I do not check a native ChatGPT host, an iPad, WebKit or the public site. No push, merge or deploy occurs.
