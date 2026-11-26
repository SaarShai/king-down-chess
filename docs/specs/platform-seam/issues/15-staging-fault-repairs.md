# Repairs of the eight staging faults (tickets 13 and 14)

Status: done on branch web-faults; waits for the review.

Class: C. Size: M.

Source: ticket [13](13-result-reload-boot-fault.md), ticket [14](14-staging-pass-faults.md), and the staging report `runs/seam-staging-479/pass.md` of the lead's run folder. One scout read each fault. The lead set the scope: client repairs only, no server, no ops change.

Line numbers are on this branch.

## 1. An ended game shows as a live game (ticket 14, item 1)

- Cause: the server ends a missed move only at the next command or at the sweep (`src/match/service.ts`, by design). Until then the view says `playing` and `ready`. The web client trusted it: `mine()` in `src/interface/people/controller.ts` gave a live draft, the received turn and Send, and `personGame()` in `src/interface/people/host/games.ts` gave "Your move" and the first place on Home.
- Change: `controller.ts:106-109`: `mine()` is false when the move time has passed (`late`, the same rule as `boardActions`, no solo games). `clock.mine` keeps the turn (`myTurn`), so the clock still reads "Your move · Time is up". `controller.ts:211` and `:239`: the read time is set before the first `mine()` of a new view, so `late` uses the time of the new read. `games.ts:25-32`: a late game is not `mine`; its status is "Time is up". `games.ts:62`: the turn line is "Your time to move is up. The game ends soon." `src/interface/play/main.ts:1468`: the help line is empty in that state, not "Your opponent now plays."
- Red (old code): `controller.test.ts` "time up on your own move": `expected { phase: 'your-move', … } to match object { draft: undefined, … }`. `online.test.ts` "a game whose move time ran out on your turn is not "Your move" on Home": `expected { id: 'g', name: 'bo', … } to match object { mine: false, status: 'Time is up' }`.
- Green: both pass (unit run 22:21-22:22).

## 2. Landscape Home breaks a friend name into pieces (ticket 14, item 2)

- Cause: `src/interface/play/menus.css:385` (old) gave the status column `minmax(0, auto)`, so the status took its full width (up to 22ch) before the name. The name has `overflow-wrap: anywhere`, so it broke after 2 or 3 letters.
- Change: `menus.css:386`: the name and the status share the free width (`minmax(0, 1fr) minmax(0, 1fr)`) at all sizes. The scout proposed a rule for landscape only; the scene check showed the same fault at 320x568 and at 150% text in portrait and on the desktop, so the rule is for all sizes.
- Check: new scene `home-games` in `src/interface/play/scenes.ts` (signed in, three person games, names `test-b`, `midnight-rook-42`, `swift-guard-86`). `tools/verify-play-scenes.mjs` also runs it at 667x375 and 844x390.
- Red (old rule, play-scenes 22:25-22:31): 7 cases fail, for example `home-games 667x375 100%: word "midnight" breaks over two lines in strong`, and at 320x568 100%, 360x640 150%, 390x844 150%, 1280x800 150%.
- Green (new rule): see the gate list. Three cases at 150% text keep the fault and have a known mark in `tools/play-scenes-known.mjs` (320x568, 667x375, 844x390).

## 3. The sender does not see a declined invite (ticket 14, item 3)

- Cause: the server and the data work. On Home, `gameOrder` (`games.ts`) put a declined update after all "Your move" rows, and Home shows 3 rows (`src/interface/play/home.ts:64`), so the row was under "Show all games". The toast handler (`main.ts:263`) kept "Invite sent to X. X sees it on Home." as `onlineNote`, which nothing clears, so it stayed for the whole visit.
- Change: `games.ts:44-47`: an invite row ranks first. `home.ts:136`: invite rows carry `invite: true`. `src/interface/people/screens/copy.ts`: `passingNote()` names the sent texts (link copied, link sent, invite sent by name). `main.ts:263`: these texts use the short status line (6 s), not the note. The landing text "Invite sent to X." (`copy.ts`, `landingText.inviteSent`) does not match and keeps the old path.
- Red: `online.test.ts` "game order …": `expected 'a' to be 'declined'`; "a sent invite or link is a short status …": `TypeError: undefined is not a function`.
- Green: both pass.

## 4. An invite does not show on an open Home (ticket 14, item 4)

- Cause: Home has one poll (`main.ts:2311-2313`), and its wait comes from the first live game (`src/plugin/poll.ts`, `pollDelay`). A daily game with the opponent to move gives 30 s.
- Change: `poll.ts:31-32`: a target can set `maxMs`. `poll.ts:53`: the wait is at most `maxMs`. `main.ts:2313`: Home sets `maxMs: 15_000`. No other caller sets it.
- Red: `poll.test.ts` "a target maxMs caps the wait": `expected [ 1, 1 ] to deeply equal [ 2, 1 ]`.
- Green: passes.

## 5. The join page is blank for about 5 s (ticket 14, item 5)

- Cause: the join route (`main.ts:2278-2281`) left `#app` empty while `loadPeople()` ran the account start, and `landingPage` (`src/interface/people/screens/landing.ts`) gave an empty section until the invite preview came.
- Change: `main.ts:2280` and `landing.ts:151`: a line "Loading the invite…" (`landingText.loading`) shows at once; the first render replaces it.
- Red: `pages.test.ts` "The link landing shows a loading line at once": the loading line is not found; `next-menus` case `join_loading` (390x844, 1280x720): "the join page shows a loading line at once".
- Green: both pass (next-menus 22:33).

## 6. Offline, a signed-in player sees "Sign in" (ticket 14, item 6)

- Cause: the account code is not in the offline cache (by design, `vite.config.ts:26`). The load fails, `peopleStatus` is `failed`, and `showHomeSignIn` (`main.ts:230`) treated `failed` as signed out.
- Change: `main.ts:230`: Sign in shows only when the people code is `ready`. Settings > Account still has Sign in.
- Red: `next-menus` case `offline_sign_in` (390x844): "no Sign in while the account cannot load".
- Green: passes at 390x844 and 1280x720.

## 7. "Link sent" shows in red and stays (ticket 14, item 7)

- Cause: the toast handler (`main.ts:263`, old line 262) sent only "Invite link copied" to the neutral line; "Link sent" went to the red `.home-note`.
- Change: the same `passingNote()` condition as repair 3.
- Red and green: the `passingNote` unit test of repair 3.

## 8. A failed board load on a result reload shows the boot fault (ticket 13)

- Cause: confirmed as ticket 13 says. The file is now `src/interface/entry.ts:9-11`: it set `kdBooted` after `startPlatform()`, which waits for the first child of `#app`. On a result reload that child comes late, and a failed board file can come first.
- Change: `src/interface/platform.ts:42-43`: the flag is set when the main module has loaded. `entry.ts` does not change.
- Check: `tools/verify-next-menus.mjs`, case `code_fault`, now waits 250 ms before it counts `#boot-fault`. `src/interface/play/merge.test.ts`: platform.ts sets the flag right after the import. No known mark for `code_fault` exists in the repository.
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

## Where a scout was wrong

- Repair 1: the scout did not name that `mine()` false makes the phase `their-move`, which gave the help line "Your opponent now plays." (`main.ts:1468`). The scout's `late` also read `readAt` before the new read set it, which would lock every first read of a game; this branch sets the read time first.
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
- With more than 3 invite rows, the game rows go under "Show all games".
