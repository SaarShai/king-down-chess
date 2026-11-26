# Home results, first Tab, and time words

Status: done on branch web-followups-2; reviewed; waits for the staging pass.

Class: B. Size: S.

Source: the two-account staging pass of PR 486 on 2026-11-26 (head `a36cee399`). Report: the lead's run folder `runs/web-followups-486/staging.md`. Each point is also on the live site, and none comes from PR 486.

## Points

1. **Medium. A result does not show on Home when the game ends in front of the player.** After a claim or a resignation, neither Home list gets a row for that game. Cause: the client writes the "seen" key when a finished game view arrives (`src/interface/people/host/index.ts`, near line 340), and `refresh()` (near lines 185 to 195) drops each seen result. Both players have the game page open, so the row never shows. Wanted: Home keeps a result row for 24 hours after the end, seen or not. The limit of 10 rows stays.
2. **Medium. The first Tab on Home does not show "Skip to content".** Cause: two lines focus the H1 on the first draw (`src/interface/play/shell.ts`, near line 125; `src/interface/play/main.ts`, near line 567), and the link is before the H1. Wanted: no focus move on the first draw; the focus moves to the H1 only after a route change in the app. A check case: load Home, push Tab one time, the link shows.
3. **Low. "2 days left" directly after a join with "3 days for each move".** Cause: `timeWords` rounds down (`src/interface/people/words.ts`, line 10). Wanted: with 2 days or more left, show days and hours ("2 days 23 hours"), or round to the nearest day. Never show more time than the player has by more than half a day. The Home row and the invite expiry line use the same words.
4. **Low. A finished row says "<name> wins"**, and the row already shows the name. Wanted: "They win". The scene rule that a status must not repeat the name then holds for each status.
5. **Low. A status wraps with one short word alone on line 2** ("win", "wins", "player") at 390x844, 844x390, 667x375 and 320x568. Wanted: the status is on one line, or it breaks only at the "·".
6. **Low. The game header at 390x844 starts line 2 with the dot**: "Your move" / "· Time is up". Wanted: the break comes after the dot, or the dot goes away at the break.

## Build (branch web-followups-2)

Scope: points 1 to 6. Client only. Line numbers are on this branch.

### 1. A result does not show on Home when the game ends in front of the player

- Cause: `src/interface/people/host/index.ts:192-196` (`refresh`) dropped each result whose seen key matched; `index.ts:343` writes that key when a finished view arrives on the game page.
- Change: `index.ts:194`: a result stays for 24 hours after `finished_at`, seen or not. After 24 hours the old rule applies. The limit of 10 rows and the seen-key write do not change.
- Remove control: a game row has no "Dismiss" (only invite rows have one, `src/interface/play/home.ts:144`), so a result row goes only by the rules above. No control is added.
- Continue card: `home.ts:101` takes only a game with `state === 'playing'`; a finished game is `state: 'finished'` and `mine: false` (`online.test.ts:151-153`), so it cannot be the card.
- Red: `online.test.ts` (test "Home keeps a result row for 24 hours"): `expected [ 'unseen' ] to deeply equal [ 'edge', 'fresh', 'unseen' ]`.
- Green: passes.

### 2. The first Tab on Home does not show "Skip to content"

- Cause: `src/interface/play/shell.ts:125` (old) focused the H1 after each draw, the first draw too; `src/interface/play/main.ts:567` (old) focused the Home title each time Home opened.
- Change: `shell.ts:108, 197, 207-208`: `start()` sets `firstDraw` while it draws the first page; `shell.ts:127` then moves no focus. `main.ts:567` reads the same `shell.firstDraw`, so the two places agree. A route change in the app (Back, Guide, a game) moves the focus to the H1 as before.
- Screen readers: the document title is the fixed "King Down" (`next.html:44`) and names the site on load; the new case checks it. On a first load of a deep link (a join link or a game), no focus moves, so a screen reader does not announce the page name.
- Check: `tools/verify-next-menus.mjs:253` case `first_tab` (390x844, 1280x720): after load no element has focus, the title is "King Down", one Tab focuses and shows the skip link, and Back from the Guide focuses the Home title. The `skip_link` case does not change (one stale comment only).
- Red (old shell.ts and main.ts): `FAIL 390x844 first_tab the first draw moves no focus: H1 | the first Tab on Home focuses and shows the skip link`.
- Green: see Gates.

### 3. "2 days left" directly after a join with "3 days for each move"

- Cause: `src/interface/people/words.ts:10` (old) `timeWords` gave whole days only, rounded down.
- Change: `words.ts:12-14`: with 2 days or more, the words are days and hours ("2 days 23 hours"; "3 days" when the hours are 0). The other ranges do not change. The optional `short` argument gives the nearest whole day by rounding (`Math.round`): at most 12 hours over the true time, never more.
- Choice: the three callers take the short words: `deadlineLine` (`games.ts:55`) and the invite expiry (`games.ts:42`) on Home, and the game header clock (`main.ts:1466`). The header is narrow too: with the long words, the scene check found "Their move · 2 days 11 hours left" on 3 lines at 320x568 and 360x640, and the header then cut the name ("test-b" is cut by main, 18 cases). So directly after a join with 3 days for each move, the header says "3 days left" (the staging report expected this), and never more than 12 hours over the true time. The long words ("2 days 23 hours") stay the default of `timeWords` for a wide caller; no caller uses them now.
- Red: `words.test.ts:9`: `expected '2 days' to be '2 days 23 hours'`; `words.test.ts:22`: `expected '2 days' to be '3 days'`; `online.test.ts` (test "the Home lines give the nearest whole day"): `expected '2 days' to be '3 days'`.
- Green: pass. `words.test.ts:26` holds the 12-hour limit from 2 to 8 days, one step each 7 minutes.

### 4. A finished row says "<name> wins"

- Cause: `src/interface/people/host/games.ts:33` (old) gave `${name} wins`.
- Change: `games.ts:33`: "They win". The Home row and the Continue card use this status. The result line of the game page (`main.ts:460`, `onlineResult`) keeps the name; it does not read this status.
- Red: `online.test.ts:151`: `expected { … } to match object { name: 'swift-guard-86', …, status: 'They win' }`; scene `home-results` at all sizes: `status "quiet-bishop-7 wins" repeats the name in a Home game row`.
- Green: pass.

### 5 and 6. A status breaks inside a part, and a line starts with "·"

- Cause: the Home row status (`home.ts:132`, old) and the game header clock (`main.ts:1466`, old) were one text. A line could break inside a part ("2" / "days") or before the "·". The header has `text-wrap: balance` (`reading-b.css:379`), which put "· Time is up" on line 2.
- Change: `home.ts:23` `statusParts`: the status splits at each " · " (a status such as "Time is up · claim the win" holds one), and each part is a `.text-part` box. The "·" ends the part before it, in one no-wrap span with the last word of that part, so no line starts with it, also when a part wraps inside. A normal space comes between the boxes. `menus.css:369-370`: `.text-part { display: inline-block; max-width: 100%; }`: a line breaks only between the parts, and a part that alone is wider than its line wraps inside (no side scroll). The text stays "A · B". Callers: the Home game row (`home.ts:132`), the invite line (`home.ts:138`) and the game header clock (`main.ts:1466`).
- Check: `tools/verify-play-scenes.mjs:227-249`: in a Home row status and the online header clock, no line starts with "·", and a part takes more than one line only when it alone is wider than its line. New scene `home-results` (`src/interface/play/scenes.ts:85-89`): a saved computer game, so each online game is a row: a claim row, a result that the friend won and a "Their move" row. It runs at the same sizes as `home-games`, with 667x375 and 844x390.
- Red (old home.ts and main.ts): 83 cases fail, for example `status "Their move · Time is up" starts a line with "·"` (online-claim 320x568), `status "Their move · 2 days" breaks inside "2 days", which fits on one line` (home-games 844x390), `status "Time is up · claim the win" breaks inside "claim the win", which fits on one line` (home-results).
- First gate run (head `422956b61`): play-scenes failed 21 cases. The status "Time is up · claim the win" was one part, so it broke inside "claim the win"; at 667x375 with 150% text "Their move ·" wrapped inside and put the "·" alone on a line; the longer header words cut the name (point 3). The repairs above follow this run.
- Second gate run (head `650ac3d41`): play-scenes failed 4 cases, `home-games` and `home-results` at 667x375 and 844x390 with 150% text: `status "Their move · 2 days" breaks inside "Their move", which fits on one line`. There the status column is about 70 px wide, and "Their move ·" is wider than it, so the part may wrap (the rule of the lead). The scene rule measured the part without its "·"; it now measures the part with its "·" (`tools/verify-play-scenes.mjs:244-245`).
- Third gate run (head `d1529d62d`): play-scenes passed; next-menus failed one case, `FAIL 390x844 first_tab TimeoutError: locator.click`: at 390x844 the shown skip link covers Guide, so the click of the case did not land. The case now blurs the link before the click. No app code changed.
- Green: see Gates.

## Repairs after the review

- Ticket, point 3: the known limit said that Home and the game page can show different words for the same time. That was false: all three callers use the short words. The limit now says so.
- `src/interface/people/words.ts:10`: the comment of `short` names the Home rows, the invite line and the game header.
- `src/interface/play/home.ts:168`: the Continue card status of a person game uses `statusParts`, as the rows do.
- `tools/verify-play-scenes.mjs:228`: the scene rule also measures the Continue card status (`.home-state > strong`) and the invite line (`.home-game-copy > span`).
- `src/interface/play/scenes.ts`: the scene server returns the invitations of a scene. `home-results` has one incoming invitation; with 4 rows the list folds, so the scene presses "Show all games" first. The new scene `home-claim` has the same games and invitation with no saved computer game, so the claim game is the Continue card ("Time is up · claim the win"). It runs at the same sizes as `home-results`.
- Ticket, point 2: the screen-reader text says that the title names the site, and that a first load of a deep link does not announce the page name. Known limits: the 24-hour result rows read each finished game again on each Home refresh.

## Gates

One at a time, after the last code edit. Five commits; the last three change only check scripts and this ticket.

- `npm run typecheck`, 14:02 (head `650ac3d41`): pass.
- `npm run test:changed`, 14:02-14:06 (head `650ac3d41`): 131 files, 2,307 tests pass, 1 skipped. A selection, not the full suite.
- `npm run check:browser play-scenes`, 14:13-14:19 (head `d1529d62d`): pass, 506 cases (36 scenes). No known mark is added.
- `npm run check:browser next-menus`, 14:30-14:41 (head `5f28a9be1`): pass (357 PASS, 119 SKIP, 0 FAIL; `first_tab` and `skip_link` at 390x844 and 1280x720).
- `npm run check:browser home`, 14:41 (head `5f28a9be1`): pass.
- `npm run check:browser web-online`, 14:41-14:43 (head `5f28a9be1`): pass.
- `npm run test:docs`, 14:43 (head `5f28a9be1`): 21 files, 219 tests pass, 1 skipped.
- Earlier runs that failed (see points 3, 5 and 6): play-scenes at `422956b61` and `650ac3d41`, next-menus at `d1529d62d`. Typecheck, test:changed and test:docs also passed at `422956b61` (13:49-13:53).
- Red runs before the code change: the focused unit run (5 tests fail), next-menus `first_tab` with the old shell.ts and main.ts, and play-scenes with the old home.ts and main.ts (83 cases fail).

## Not verified

- No staging or two-account pass ran. Point 1 is proven with a unit test of `refresh()` on a stand-in server only; the end of a real game in front of both players is not driven.
- Point 2 is checked in Chromium only, at 390x844 and 1280x720. No screen reader ran.
- Points 5 and 6: no pictures before and after; the scene rule measures the breaks. No 667x375 picture of the game header.

## Known limits

- Point 1: the 24 hours use the device clock against the server `finished_at`. A wrong device clock makes the time longer or shorter.
- Point 1: a result row inside the 24 hours has no control to remove it; it goes after 24 hours (if seen) or when 10 newer results push it out.
- Point 1: for 24 hours after a game ends, each Home refresh reads that finished game again (up to 10 reads each 15 s). A later change can keep the finished views.
- Point 2: a first load on a join link or an online game moves no focus either; the first Tab there goes to the first control of the page.
- Point 3: Home, the invite line and the game header use the short words (nearest whole day from 2 days). The long form ("2 days 23 hours") has no caller.
- Points 5 and 6: a part wider than its line still wraps inside the part. At 667x375 and 844x390 with 150% text the Home status column is about 70 px wide, and "Their move ·" shows as "Their" / "move ·" / "2 days".

## Closed by design

- The screen-reader label "Opponent's cards: ..." names the same four cards as the player's own. The rules give both players the same four open cards (`docs/RULES.md`, the hands show). It is not a leak.

## Open from ticket 16

- Point 7: the first move of a friend game took 25 s in one local run. No cause is proven.
- Point 8: staging has no sweep for timed-out games (ops).

## Release note

The first release run of PR 486 stopped at the local frame check `painted-game` ("quiet walk: normal 665 ms, fast 232 ms"). Other work ran on the machine at that time. The second run passed with a quiet machine. The cause is not proven; if the line fails again on a quiet machine, examine it.
