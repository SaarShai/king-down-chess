# Repairs of the eight staging faults (tickets 13 and 14)

Status: done, merged and live (PR 485; merge commit `2a9c8d344`; live on 2026-11-26 10:11Z).

Class: C. Size: M.

Source: ticket [13](13-result-reload-boot-fault.md), ticket [14](14-staging-pass-faults.md), and the staging report `runs/seam-staging-479/pass.md` of the lead's run folder. One scout read each fault. The lead set the scope: client repairs only, no server, no ops change.

Line numbers are on this branch.

## 1. An ended game shows as a live game (ticket 14, item 1)

- Cause: the server ends a missed move only at the next command or at the sweep (`src/match/service.ts`, by design). Until then the view says `playing` and `ready`. The web client trusted it: `mine()` in `src/interface/people/controller.ts` gave a live draft, the received turn and Send, and `personGame()` in `src/interface/people/host/games.ts` gave "Your move" and the first place on Home.
- Change: `controller.ts:106-109`: `mine()` is false when the move time has passed (`late`, the same rule as `boardActions`, no solo games). `clock.mine` keeps the turn (`myTurn`), so the clock still reads "Your move · Time is up". `controller.ts:211` and `:239`: the read time is set before the first `mine()` of a new view, so `late` uses the time of the new read. `games.ts:25-32`: a late game is not `mine`; its status is "Time is up". `games.ts:62`: the turn line is "Your time to move is up." (review batch: no promise about when the game ends; staging has no sweep). `src/interface/play/main.ts:1471`: the help line is empty in that state, not "Your opponent now plays."
- Red (old code): `controller.test.ts` "time up on your own move": `expected { phase: 'your-move', … } to match object { draft: undefined, … }`. `online.test.ts` "a game whose move time ran out on your turn is not "Your move" on Home": `expected { id: 'g', name: 'bo', … } to match object { mine: false, status: 'Time is up' }`.
- Green: both pass (unit run 22:21-22:22).

## 2. Landscape Home breaks a friend name into pieces (ticket 14, item 2)

- Cause: `src/interface/play/menus.css:385` (old) gave the status column `minmax(0, auto)`, so the status took its full width (up to 22ch) before the name. The name has `overflow-wrap: anywhere`, so it broke after 2 or 3 letters.
- Change: `menus.css:386`: the name and the status share the free width (`minmax(0, 1fr) minmax(0, 1fr)`) at all sizes. The scout proposed a rule for landscape only; the scene check showed the same fault at 320x568 and at 150% text in portrait and on the desktop, so the rule is for all sizes.
- Check: new scene `home-games` in `src/interface/play/scenes.ts` (signed in, three person games, names `test-b`, `midnight-rook-42`, `swift-guard-86`). `tools/verify-play-scenes.mjs` also runs it at 667x375 and 844x390.
- Red (old rule, play-scenes 22:25-22:31): 7 cases fail, for example `home-games 667x375 100%: word "midnight" breaks over two lines in strong`, and at 320x568 100%, 360x640 150%, 390x844 150%, 1280x800 150%.
- Green (new rule): see the gate list. Three cases at 150% text keep the fault and have a known mark in `tools/play-scenes-known.mjs` (320x568, 667x375, 844x390).

## 3. The sender does not see a declined invite (ticket 14, item 3)

- Cause: the server and the data work. On Home, `gameOrder` (`games.ts`) put a declined update after all "Your move" rows, and Home shows 3 rows (`src/interface/play/home.ts:64`), so the row was under "Show all games". The toast handler (`main.ts:266`) kept "Invite sent to X. X sees it on Home." as `onlineNote`, which nothing clears, so it stayed for the whole visit.
- Change: `games.ts:44-47`: an invite row ranks with the "Your move" games (review batch; first version: before them). It has no deadline, so it comes after the "Your move" games with a deadline and before all other rows. `home.ts:136`: invite rows carry `invite: true`. `src/interface/people/screens/copy.ts`: `passingNote()` names the sent texts (link copied, link sent, invite sent by name). `main.ts:266`: these texts use the short status line (6 s), not the note. The landing text "Invite sent to X." (`copy.ts`, `landingText.inviteSent`) does not match and keeps the old path.
- Red: `online.test.ts` "game order …" (first version of the test): `expected 'a' to be 'declined'`; "a sent invite or link is a short status …": `TypeError: undefined is not a function`.
- Green: both pass.

## 4. An invite does not show on an open Home (ticket 14, item 4)

- Cause: Home has one poll (`main.ts:2314-2316`), and its wait comes from the first live game (`src/plugin/poll.ts`, `pollDelay`). A daily game with the opponent to move gives 30 s.
- Change: `poll.ts:31-32`: a target can set `maxMs`. `poll.ts:53`: the wait is at most `maxMs`. `main.ts:2316`: Home sets `maxMs: 15_000`. No other caller sets it.
- Red: `poll.test.ts` "a target maxMs caps the wait": `expected [ 1, 1 ] to deeply equal [ 2, 1 ]`.
- Green: passes.

## 5. The join page is blank for about 5 s (ticket 14, item 5)

- Cause: the join route (`main.ts:2281-2284`) left `#app` empty while `loadPeople()` ran the account start, and `landingPage` (`src/interface/people/screens/landing.ts`) gave an empty section until the invite preview came.
- Change: `main.ts:2283` and `landing.ts:151`: a line "Loading the invite…" (`landingText.loading`) shows at once; the first render replaces it.
- Red: `pages.test.ts` "The link landing shows a loading line at once": the loading line is not found; `next-menus` case `join_loading` (390x844, 1280x720): "the join page shows a loading line at once".
- Green: both pass (next-menus 22:33).

## 6. Offline, a signed-in player sees "Sign in" (ticket 14, item 6)

- Cause: the account code is not in the offline cache (by design, `vite.config.ts:26`). The load fails, `peopleStatus` is `failed`, and `showHomeSignIn` (`main.ts:232`) treated `failed` as signed out.
- Change: `main.ts:232`: on a `ready` load, Sign in shows when the host has no session. On a `failed` load, Sign in shows only when no session is stored (`AUTH_KEY` in `localStorage`, the key that `init` in `src/interface/people/host/index.ts` reads; review batch). Settings > Account still has Sign in.
- Check (review batch): `next-menus` case `offline_signed_out` (390x844, 1280x720): no stored session; the load fails (the people host chunk is aborted, see Review); Sign in shows. Red with the old line: "Sign in shows with no stored session".
- Red: `next-menus` case `offline_sign_in` (390x844): "no Sign in while the account cannot load".
- Green: passes at 390x844 and 1280x720.

## 7. "Link sent" shows in red and stays (ticket 14, item 7)

- Cause: the toast handler (`main.ts:266`, old line 262) sent only "Invite link copied" to the neutral line; "Link sent" went to the red `.home-note`.
- Change: the same `passingNote()` condition as repair 3.
- Red and green: the `passingNote` unit test of repair 3.

## 8. A failed board load on a result reload shows the boot fault (ticket 13)

- Cause: confirmed as ticket 13 says. The file is now `src/interface/entry.ts:9-11`: it set `kdBooted` after `startPlatform()`, which waits for the first child of `#app`. On a result reload that child comes late, and a failed board file can come first.
- Change: `src/interface/platform.ts:42-43`: the flag is set when the main module has loaded. `entry.ts` does not change.
- Check: `tools/verify-next-menus.mjs`, case `code_fault`, waits for the aborted board request to fail, then one frame, before it counts `#boot-fault` (review batch; first version: a fixed 250 ms). `src/interface/play/merge.test.ts`: platform.ts sets the flag right after the import. No known mark for `code_fault` exists in the repository.
- Red: `next-menus` `code_fault` fails at 10 of 17 sizes (22:24-22:25); `merge.test.ts`: the pattern does not match.
- Green: `code_fault` passes at 17 of 17 sizes (22:33); `merge.test.ts` passes.

## Gates (head 6c33acf67, 2026-11-25)

- `npm run typecheck`: pass.
- Unit tests, `KINGDOWN_TEST_FILE='{src/interface/people/**/*.test.ts,src/plugin/poll.test.ts,src/interface/play/*.test.ts}'`, 22:41-22:42: 54 files, 985 tests pass. A focused run, not the full suite.
- `npm run test:docs`, 22:41: 21 files pass.
- `npm run check:browser play-scenes`, 22:43-22:49: pass, 494 cases (35 scenes); 3 known marks for `home-games` at 150%.
- `npm run check:browser next-menus`, 22:49-22:59: pass (all cases, 17 sizes).
- `npm run check:browser home`, 22:59: pass.
- `npm run check:browser web-game`, 22:59-23:00: pass.
- `npm run check:browser web-online`, 23:00-23:03: pass.

## Gates of the review batch (on e736dea13 plus the batch, 2026-11-25)

- `npm run typecheck`: pass.
- Unit tests, `KINGDOWN_TEST_FILE='{src/interface/people/host/online.test.ts,src/interface/people/controller.test.ts,src/interface/play/merge.test.ts}'`, 23:33: 3 files, 120 tests pass.
- `npm run test:docs`: 21 files pass.
- `npm run check:browser next-menus`, 23:34-23:44: pass (all cases, 17 sizes; 353 PASS, 89 SKIP, 0 FAIL).
- `npm run check:browser play-scenes`, 23:44-23:50: pass, 494 cases (35 scenes).
- `npm run check:browser home`, 23:50: pass.

## Where a scout was wrong

- Repair 1: the scout did not name that `mine()` false makes the phase `their-move`, which gave the help line "Your opponent now plays." (`main.ts:1471`). The scout's `late` also read `readAt` before the new read set it, which would lock every first read of a game; this branch sets the read time first.
- Repair 2: the scout said the fault is only in landscape. The scene check shows it at 320x568 and at 150% text at all sizes.
- Repair 3: the scout's condition `message.startsWith('Invite sent to ')` also takes the landing text "Invite sent to X.".
- Repair 4: the `poll.ts` line numbers were 2 lines off (31 and 52, not 33 and 50).
- Repair 6: the account chunk is not the only chunk named `client-*`; a small online client chunk has the same name, and an abort of both stops Home.
- The unit test command of the scouts used the comma form of `KINGDOWN_TEST_FILE`, not the brace form.

## Not verified

- No staging or two-account pass ran. Repairs 1, 3 and 4 are proven by unit tests and stand-in servers only.
- The `main.ts` toast path of repairs 3 and 7 is not driven in a browser; only `passingNote()` is tested.
- Repair 5 shows the line; it does not make the join faster (`init` still waits for `refresh()`).
- The near-deadline lock of repair 1 uses the client clock; a large clock error can lock a little early or late.

## Known limits

- The plugin board (`src/plugin/screens/board.ts`) and the old `/play/` page (`src/account-game/runtime.ts`) keep the gap of repair 1: they still show live controls after the move time.
- Staging has no sweep for games that run out of time: `supabase/ops/cron.sql` posts to the live address only (not confirmed). So on staging a late game ends only at a command or a claim.
- At 150% text on a narrow Home row (320x568, 667x375, 844x390), a long name still breaks (known mark).
- With 3 or more "Your move" games that have a deadline, an invite row goes under "Show all games". A "Your move" game with no deadline ties with an invite row and keeps the input order: `home.ts` adds the game rows (line 121) before the invite rows (line 136), so that game stays above the invites.
- The lock of repair 1 shows only at the next poll read or the update timer, up to 30 s after the deadline. Until then the player can stage a move and tap Send; the server refuses a late Send (an `ended` fault, then a full read). Not built: a timer at the deadline.

## Review

- Kind: two agents that did not build the change. One read what a player gets; one read the tests and the checks.
- Head: e736dea13.
- Findings and what the batch did:
  - BLOCKING (player): `gameOrder` put every invite row above all "Your move" rows; Home shows 3 rows, so 3 invite rows pushed a "Your move" game under "Show all games". Batch: invite rows rank with "Your move" games (`games.ts:44-47`). `online.test.ts` "game order": three "Your move" rows with a deadline come before the declined row; three invite rows do not push a "Your move" game out of the first three rows; a declined row comes before a "their move" row. Red on e736dea13: `expected [ 'declined', 'a', 'b', 'c' ] to deeply equal [ 'a', 'b', 'c', 'declined' ]`. The Known-limits line is corrected.
  - Note (player): repair 6 hid Sign in on every failed load, also with no stored session. Batch: see repair 6. The case `offline_signed_out` cannot abort the same file as `offline_sign_in`: with no stored session, `init` does not load the account client, so that abort does not fail the load. The case aborts the people host chunk (`host-*.js` that holds the host code) instead.
  - Note (player): "The game ends soon." is not true on staging. Batch: the line is "Your time to move is up."; `controller.test.ts` changes with it.
  - Note (player): the lock of repair 1 shows only at the next poll or timer. Batch: not built; recorded in Known limits.
  - Note (tests): `join_loading` was in the fault-case list, so page exceptions and console errors were not checked. Batch: removed from the list. The case then showed one console line: the stand-in has no invite, so `/api/invites/preview` is a 404. The runner accepts only that exact 404 line for this case, and the case checks that no other path is a 404.
  - Note (tests): `net::ERR_INTERNET_DISCONNECTED` was accepted in all fault cases. Batch: only in `offline_sign_in` and `offline_signed_out`.
  - Note (tests): `code_fault` waited a fixed 250 ms. Batch: see repair 8. Red with the `platform.ts` flag reverted: `code_fault` fails at 7 of 17 sizes (the reviewer saw 1). The fault is a race, so a size can still pass on the old code; the `merge.test.ts` pattern holds the repair line.
  - Note (tests): a case that does not run at a size printed PASS. Batch: a case that skips a whole size returns `'skip'`, and the runner prints `SKIP <size> <case>` and records no result (`offline_sign_in`, `offline_signed_out`, `join_loading`, `home_resize`, `notice`, `result_reload`). A case that skips only some steps at a size keeps PASS.

## Repair check and playtest (2026-11-26)

- Repair check: an agent that did not build the change or the repair read `ede901b79`. Pass. The blocking finding is closed: the new order test fails on the reviewed code. One note: the third new order assertion also passes on the reviewed code.
- Playtest: one tester with two accounts on the local stack, head `ede901b79`, 28 minutes. Result: pass, no Blocker, no High. Met: repairs 3, 4, 5 and 7 (an invite shows on an open Home in 5 s; a decline in 5 s; "Invite sent" goes after 6 s in the neutral colour; "Loading the invite…" shows in less than 0.3 s). Not run: repair 1 (a game has 3 days for each move, so no game reached its deadline; the unit tests hold it) and repair 8 (the check case holds it).
- One fault of this batch from the playtest, repaired by the lead after the check: with a stored session and a failed load of the account code, repair 6 removes "Sign in", and the note "Online play cannot load" was only in the screen-reader region. The failed-load path of `loadPeople` (`src/interface/play/main.ts`) now draws Home again, so the note shows. The case `offline_sign_in` of `tools/verify-next-menus.mjs` has a new assertion, "Home shows the load note": red without the line at both sizes, green with it.

More known limits, from the playtest:

- A handle of 20 letters (the longest) still breaks with a last line of one letter in a Home row at 844x390 and 667x375, and the status breaks inside the name at 360x640. No overlap. A cut with "…" is a design choice that the lead did not make in this batch.
- The first move of a friend game showed on the other screen after 25 s; the next moves in about 1 s. Not examined.
- In "Invite by name", Enter in the name field does nothing; the Invite button of the result row sends.

- CI on `00caf0127` was red in one unit shard: `src/interface/platform.test.ts` has no `window`, and the new boot-flag line of repair 8 used it (`ReferenceError: window is not defined`). The line now sets the flag on `globalThis`, which is the same object in a browser. No local gate of the build or of the review ran that file; the lead then ran each test file under `src/interface` (61 files, 1,121 tests) and `npm run test:changed`.
- CI on `942e7b1b5` was red in `browser-webkit-board (input)`: `web-online`, "Offline play logs no errors". The log does not hold the error text. The same check passes here in WebKit with the CPU canvas (117 s) and in Chromium. The process notes of 2026-11-22 hold one earlier red of this offline part in WebKit that a rerun cleared. The assertion now prints the console lines, so the next red names its cause. Cause not proven.

## Staging pass and release (2026-11-26)

- Staging pass on `05c8fa9c8`: one tester, two signed-in profiles (desktop and phone), 24 minutes. Pass, no Blocker, no High. All eight repairs were seen. The time-up lock came 1.9 s after the deadline of a real game; "Claim win" by the other player gave the same result on both screens in 12 s. The offline note shows on the page. The report is in the lead's run folder `runs/web-faults-485/` (`staging.md`).
- Release: `tools/release/release.sh`, exit 0; the live check passed. A signed-out look at the live site in Chromium and WebKit: no console error.
- What the pass found and this change does not repair is in ticket [16](16-staging-pass-followups.md).
