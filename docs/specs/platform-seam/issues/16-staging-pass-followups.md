# Follow-ups of the staging pass of PR 485

Status: done on branch web-followups; reviewed; waits for the staging pass.

Class: B. Size: S.

Source: the staging pass of 2026-11-26 (head `05c8fa9c8`) and the local playtest of 2026-11-26 (head `ede901b79`). Reports: the lead's run folder `runs/web-faults-485/` (`staging.md`, `local.md`).

## Points

1. **Medium. A name with a hyphen breaks before its last characters** in a Home games row at 844x390, 667x375 and 360x640: "BOLD-OGRE- / 97". A name of 20 letters breaks with a last line of one letter. Wanted: the name stays on one line and is cut with "…" when it does not fit; the full name stays available to a screen reader.
2. **Low. Home says "Time is up · less than 1 hour"** for a game whose move time ran out. Wanted: "Time is up" only.
3. **Low. The other player's Home says "<name> to move · less than 1 hour"** for the same game. Wanted: Home tells that player that the time is up and that a claim is possible (the game page already shows "Claim win").
4. **Low. A tap on a piece or a card after the time ran out says "Wait for your turn."** while the clock says "Your move · Time is up". Wanted: one message that agrees with the clock.
5. **Low. In "Invite by name", Enter in the name field does nothing.** Wanted: Enter sends the invite when one result matches, or moves focus to the Invite button.
6. **Low. "Skip to content" shows after a mouse click** on "Show all games" (desktop). Wanted: it shows only for keyboard focus.
7. **Not examined. The first move of a friend game showed on the other screen after 25 s** (local stack); the next moves in about 1 s. Find the cause before a repair.
8. **Not examined. Staging has no sweep for games that run out of time** (`supabase/ops/cron.sql` posts to the live address only). Operations; not a client change.

## Build (branch web-followups)

Scope: points 1 to 6 built; point 7 examined; point 8 not touched. Client only. Line numbers are on this branch.

### 1. A name breaks in a Home games row

- Cause: `src/interface/play/menus.css:367` gives the row name `overflow-wrap: anywhere` and no `white-space` rule, so the name wraps at a hyphen or inside a word when the half column is too narrow. The scene check did not see a break at a hyphen: `tools/lib/cut-text.mjs` counts a hyphen as a legal break.
- Change: `menus.css:369`: the row name is `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. `src/interface/play/home.ts:119`: the name has a `title` with the full name; the text node keeps the full name for a screen reader. `menus.css:403`: the status uses `overflow-wrap: break-word` (not `anywhere`): it breaks at a space first. Check: `tools/verify-play-scenes.mjs:214` (`homeNameFaults`): a row name that takes more than one line, or has no title with the full name, is a fault. `tools/lib/cut-text.mjs:20`: the ellipsis cut of `.home-game-row > strong` (and only this element, with `nowrap` and `ellipsis`) is not a cut fault. The three known marks of `home-games` at 150% text are removed from `tools/play-scenes-known.mjs`.
- Red (old rule, play-scenes 02:26-02:33): 12 cases fail, for example `home-games 360x640 100%: name "midnight-rook-42" takes 2 lines in a Home game row` and `home-games 844x390 150%: name "midnight-rook-42" takes 4 lines`.
- Green: see Gates.

### 2. "Time is up · less than 1 hour"

- Cause: `src/interface/people/host/games.ts` `deadlineLine` gave `timeWords` of a negative time, which is "less than 1 hour"; `home.ts:118` adds it to every playing row.
- Change: `games.ts:55`: no words when the deadline has passed.
- Red: `online.test.ts:128`: `expected 'less than 1 hour' to be ''`.
- Green: passes.

### 3. The other player's Home says "<name> to move"

- Cause: `games.ts` `personGame` knew the late state only for the own move (`action === 'ready'`).
- Change: `games.ts:27-28`: a playing game whose other player missed the move time (`claim`, the same rule as `boardActions` in `src/plugin/screens/board-model.ts:206`) is `mine` (it sorts with "Your move" rows). `games.ts:34`: its status is "Time is up · you can claim the win", or "Time is up · you can end the game" while abort is open (the game page then shows "End game").
- Red: `online.test.ts:141`: `expected { mine: false, status: 'bo to move' } to match object { mine: true, status: 'Time is up · you can claim the win' }`.
- Green: passes.

### 4. A tap after the time ran out says "Wait for your turn."

- Cause: after the own time ran out the controller gives no draft, so `main.ts` sets `thinking`; `src/interface/play/help/reasons.ts:32` then refuses each tap with `not-your-turn`, "Wait for your turn.".
- Change: `reasons.ts:27,32`: an optional `lockedLine` replaces the line of that refusal. `games.ts:61-64`: `timeUpLine()` gives "Your time to move is up." (the same constant as the turn line of `personTurn`) when the phase is `their-move` and the clock is mine. `main.ts:209`: `lockedLine()`; `main.ts:799, 1050, 1965`: the three `refusalReason` calls pass it (Send, board tap, card tap).
- Red: `help.test.ts:82`: `expected { line: 'Wait for your turn.' } to deeply equal { line: 'Your time to move is up.' }`; `online.test.ts:132`: `timeUpLine` is not a function.
- Green: both pass.

### 5. Enter in "Invite by name" does nothing

- Cause: `src/interface/people/screens/person.ts` `nameSearch` had no key handler.
- Change: `person.ts:148, 152, 159`: `found` is true only while the rows are the search results of the text in the field. `person.ts:165-169`: Enter sends the invite (a click on the row's Invite button) when `found` and exactly one row shows. Else Enter does nothing new.
- Red: `pages.test.ts:145` (test "Invite by name: Enter sends the invite only when exactly one result row shows"): `expected [] to deeply equal [ 'invite:noor-k:pieces' ]`. The test also holds: 2 rows, no invite; a new search that is not back yet (an old single row), no invite.
- Green: passes (31 tests of the file).

### 6. "Skip to content" shows after a mouse click

- Cause: `menus.css:7` (old) showed the link on `:focus` as well as `:focus-visible`; a script focus after a mouse click matches `:focus`.
- Change: `menus.css:8`: `:focus-visible` only. The CSS line is in commit `da9293b78`.
- Check: `tools/verify-next-menus.mjs` case `skip_link` (390x844, 1280x720): a mouse click on the Home title, then a script focus on the link: the link stays hidden; after a key press the same focus shows it.
- Red (old rule): `FAIL 390x844 skip_link focus after a mouse click does not show the skip link` (and at 1280x720).
- Green: `PASS 390x844 skip_link`, `PASS 1280x720 skip_link`.

### 7. The first move of a friend game showed after 25 s (examined, not repaired)

- Evidence (`runs/web-faults-485/local/run-log.txt`): B joined at 08:06:54, A opened the game at about 08:07:27, B sent a2-a3 at 08:07:46, A saw it at 08:08:11 (25 s). The next moves came in about 1 s: after an own move `pollDelay` (`src/plugin/poll.ts:22`) reads every 3 s for 2 minutes.
- The client rule: `poll.ts:24`: with `fastStart` (`controller.ts:502` sets it) the game page reads every 3 s for 2 minutes after a `join` or `ready` command. Else, with the opponent to move and no presence (`last_seen_ms` null), a daily game reads every 30 s (`poll.ts:27`). 25 s fits the 30 s wait, so in A's read the `fastStart` test was false.
- Probe (a scratch unit test, not kept): the fixture service, alice creates a friend game, bob joins by link, alice opens it. Alice's view has `last_commands: [{ seq: 1, seat: 1, action: { type: 'join' } }]` and `pollDelay(view, 0, false, { fastStart: true })` is 3000. So the client rule is correct on the fixture server.
- Cause: not proven. The client code gives 3 s when the view holds the join command less than 2 minutes before `server_now`. On the local stack one of these must be false. The candidates: the join `at` (Postgres `created_at`) and `server_now` (the API clock) differ by more than about 70 s; or the view that the page read did not hold the join command. Next step: on the local stack, log A's `GET` reads of the game and the `last_commands` and `server_now` of the first read. No client repair is made.

## Repairs after the review

Two reviews gave PASS with no blocker. The lead decided these repairs:

1. **Point 1: the status repeats the name.** `games.ts:35`: when the other player is to move, the status is "Their move" (the game clock uses the same words), not "<name> to move". The name is in the row, and the row keeps the full name in its accessible name. A long name in the status broke at its hyphen at 844x390, 667x375 and 320x568 at 150% text. The large Continue card uses the same status. Red: the run before the code change stopped at the first changed line, `online.test.ts:141` (`"Time is up · you can claim the win"`). Check: `homeNameFaults` (`tools/verify-play-scenes.mjs:222-224`): a row status that holds the name of its row is a fault.
2. **Point 3: shorter claim words.** `games.ts:34`: "Time is up · claim the win" and "Time is up · end the game". Tests: `online.test.ts:141-142`.
3. **Point 6 in the scene check.** `tools/verify-play-scenes.mjs:230, 253`: the skip link counts as hidden while it has no `:focus-visible` (before: no `:focus`), the same rule as `menus.css:8`.
4. **Point 4 wiring.** `opp-playback.test.ts` (last test): it runs the real `tap` and `lockedLine` of main.ts with the real `refusalReason`. When the own clock is up, a tap on an empty square gives "Your time to move is up."; when the clock is not the own, it gives "Wait for your turn.".

## Gates (head 43a9bb797, 2026-11-26)

One at a time, after the last code edit:

- `npm run typecheck`, 03:03: pass.
- `npm run test:changed`, 03:03-03:08: 130 files, 2,353 tests pass, 1 skipped. A selection, not the full suite. Two earlier runs found two faults of this branch, both repaired: `src/interface/play/opp-playback.test.ts` runs main.ts functions in a new context and had no `lockedLine` (`ReferenceError`; commit `19c77544c`), and the new point 2 line in `online.test.ts` read the clock two times ("1 day" for "23 hours"; commit `43a9bb797`).
- `npm run test:docs`, 03:08: 21 files pass.
- `npm run check:browser play-scenes`, 03:08-03:14: pass, 494 cases (35 scenes). No known mark for `home-games` is left.
- `npm run check:browser next-menus`, 03:14-03:24: pass (355 PASS, 104 SKIP, 0 FAIL; `skip_link` at 390x844 and 1280x720).
- `npm run check:browser home`, 03:24: pass.
- `npm run check:browser web-online`, 03:24-03:26: pass.
- Focused unit runs while building: `online.test.ts` (81 tests), `help.test.ts`, `pages.test.ts` (31 tests): pass.

## Not verified

- No staging or two-account pass ran. Points 2, 3 and 4 are proven by unit tests only; the main.ts wiring of point 4 is not driven in a browser.
- Point 3: the claim row is `mine`, so it can be the big "Continue" card on Home when no local game exists; this is not pictured.
- Point 6: the check moves the focus with a script after a mouse click; it does not click "Show all games" (no check stand-in has more than three games).

## Known limits

- Point 1: a cut name shows only its start; the full name is in the title (mouse hover) and in the row's accessible name.
- Point 3: Home shows the claim row only from the first read after the deadline (Home reads at most every 15 s).
- Point 5: Enter with the "Players you know" rows (fewer than 2 letters) does nothing.
- Point 7: cause not proven; see above.
- Points 2 and 3: Home decides "Time is up" and the claim from the device clock; the game page uses the server time. A wrong device clock can make the two disagree (the old "late" rule had the same limit before this branch).
- Point 1: two friends whose names start with the same long text show the same cut name in a narrow row.
