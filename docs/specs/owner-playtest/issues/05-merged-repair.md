# Repair the merged playtest paths

Status: resolved
Type: task

The owner asks for the eight findings from the independent review and decisions 120 and 121. Work stays on `owner-playtest-1`. The approved design stays in use.

## Answer

- Keep an armed card or power in the normal reader. A board target acts. X and Escape cancel. Outside input closes an information panel only.
- Share the short reader with the history strip. The status and strip fit at rest. A piece, action or choice uses the space above the board. Keep Menu in reach. Cancel and Undo return the strip.
- Put the newest action in history once. The reader gives the state and next step.
- Bind a king to the account, game and seat when an invite starts or a player joins. Use the panel's legal king. Keep the next-game preference for the cards-off return. Remove this account's saved bindings on account deletion.
- Keep a confirmed Manual order resumable before its first move. A new game gives the active-game warning.
- Use the common history and anchored panel updates before Ready and in the online wait.
- Use the plain home piece X with a specific name and focus return.
- Remove the unused game-page replay controller and calls. Keep the shared history data and module.

## First repair checks

| Check | Result |
| --- | --- |
| Focused `npm test` | 168 pass in 7 files: saved, arrange, layout, new-game, controller, seat-king and host/online. |
| Full `npm test` | 7,038 pass and 385 existing skips; then 114 renderer cases pass. No failures. Run once after the browser checks. |
| `npm run test:docs` | 195 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass. |
| `npm run check:browser owner-playtest-b` | 18 groups pass: card and power target turns, choices and panels at 4 sizes, then board, portrait, Undo and scroll motion. |
| `npm run check:browser next-arrange` | Pass: 4 solo sizes, Ready then home and reload, Continue, the new-game warning, 2 pending invites with different kings, both invite controls, bound joining kings, Black first and wait panels at 4 sizes. Mud · Leap with cards confirms Mud · March. |
| Hand browser check | All 193 assertions pass. |
| Selected `next-menus` browser cases | All 16 pass: panel, refresh, home piece X and Menu at 4 sizes. |
| Lead's four-game check | All 144 assertions pass across 16 game and size pairs against the check build. |
| UI scan and diff check | No findings or whitespace faults. |

The focused selector is `src/interface/{play/{saved,arrange,layout,new-game},people/{controller,seat-king,host/online}}.test.ts`.
The browser runner accepts `PLAYABLE_PORT=5445`. The Hand and local stack checks use `PLAYABLE_URL` at that port.
The checks run in sequence. Focused and full tests, and browser checks, use the machine lease. Release work keeps its lease.

Evidence is in `runs/launch/owner-playtest/build/r1-shots/` and `r1-logs/` outside the game repository. All 20 required state and size captures are present. The check also covers promotion controls and reduced motion. The local online stack and preview stop after the checks.

## First repair limits

Chromium checks use mouse, touch and keyboard. No physical phone or WebKit check runs. The existing database-gated skips remain. No live account, old-page browser regression, push, pull request or deploy runs.

## Second repair run

The owner asks for seven confirmed faults in the first repair. Check each fault before and after the change. Keep the merged deletion email and sign-in code changes. Use port 5445 and run one test or browser check at a time.

### Changes

1. A confirmed zero-move FEN save resumes without a setup marker. Ready no longer writes a second identity. A confirmed game stays in memory when its save fails. An unchanged confirmed order ignores the unfinished marker.
2. Required online actions take the shared reader area. This includes draw replies, Check again, Sign in again and a claim. History returns after the action ends.
3. Resting-reader rules exclude floating panels. A power panel sizes its body to the full text. All four opponent card rows stay visible and each opens its rule.
4. Manual instructions use the history reserve on the short phone. The instruction and both rule warnings fit in a game with resources. The online wait keeps history.
5. All five invite paths capture the account and session generation before the request. A late reply binds that account only. It cannot update the next account's game list or open its game. The fallback link request has the same guard.
6. A repeated acceptance keeps the first valid king for the account, game and seat. Ready confirms that king after the next-game preference changes.
7. A failed king write keeps the successful server game and the accepted king in memory. The page gives a local-save notice. A later read retries the same binding. Games with no king powers write no king record.

### Second repair checks

The new unit cases fail before the repairs. The short-phone browser cases also fail before the layout repairs: hidden card rows, a clipped draw reply and a clipped two-line Manual warning. The logs keep these failures and the later passes.

| Check | Result |
| --- | --- |
| Focused `npm test` | 411 pass in 9 files. This includes the old page's real save controller. |
| `owner-playtest-r2` | Pass at 360x640, 390x844, 844x390 and 1440x900. Text and 44 px controls fit their visible boxes and clipping ancestors. Manual covers powers, cards and both, for either side. The 360x640 save group uses two live tabs and a refused write. |
| `owner-playtest-b` | All 18 groups pass. An armed non-target tap then a valid target works. Enter and Space each play a target for a card and a power. |
| New game panel check | All 11 cases pass. |
| Hand browser check | All 225 assertions pass. Each opponent card row is visible and opens its rule. |
| Selected `next-menus` cases | All 16 pass: panel, refresh, home piece X and Menu at four sizes. |
| `next-arrange` | Pass with a fresh local fixture database. Four solo sizes, saved restart, Ready, home, Continue, two online seats, separate pending kings and wait panels remain green. |
| Lead's four-game check | All 144 assertions pass across 16 game and size pairs. |
| Full `npm test` | 7,095 pass and 387 existing skips in 375 files; then all 114 renderer cases pass. Run once after all browser checks. |
| `npm run test:docs` | 197 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass with the local check configuration. |
| UI scan and diff check | No findings or whitespace faults. |

The focused selector is `src/{interface/{play/{saved,arrange,layout,new-game,reading-b},people/{controller,seat-king,host/online}},screen/play}.test.ts`.
The browser evidence is in `runs/launch/owner-playtest/build/r2-shots/` and the logs are in `r2-logs/`, outside this repository. The 48 main captures include opponent cards, a draw offer and Manual rule warnings at all four sizes. The screenshots show the settled page.

The first local-stack check finds an old open-invite conflict in the reused fixture database. Resetting this worktree's local data clears it. The unchanged check then passes. No check accepts that conflict as a valid result.

The code commits are `2d51a5adf` and `978c6cf66`. The merged deletion email and sign-in code changes remain in place.

### Second repair limits

The checks use Chromium with touch, pointer and keyboard. No physical phone, WebKit or live account check runs. The old page has a real save-controller unit check, but no browser check. The existing database-gated skips remain. The build keeps the runtime art-manifest warning.

A refused local write keeps the accepted king for this visit only until storage works. A reload can lose that choice. The page states this limit. All preview and local online processes stop after the checks. No push, pull request or deploy runs.

## Third repair run

Repair the eight confirmed faults from the owner brief. Decision 122 gives one online action group at a time. Keep each earlier check and add a failing check before each repair. Use port 5445 and one test or browser command at a time.

### Third repair changes

1. Keep an unfinished FEN rematch in Manual setup. Clear its marker only after the guarded Ready save succeeds. Resume an in-memory game with its own setup state. A stale tab reads the newer save on Continue. Keep the empty-back-rank rule for the Continue row.
2. Decision 122 gives send recovery or Sign in again first, a claim next, then the draw reply. Each group returns when the earlier one ends. History returns after the actions end.
3. An open subject panel takes the reader before online status. Keep the opponent's card stack and power coin in reach in the shared header. All four card rows open their rules.
4. Use a distinct obsolete-action error for an old account reply. Every caller of the guarded invite actions ignores it. The next account keeps its page and layers.
5. Join and Accept pass a failed king-write notice to the game page. It shows once there, clears for another game and does not leave a home notice. The online wait can show it too.
6. Manual needs 152 px to keep history: 44 for the header, 24 for the instruction, 40 for two warning lines and 44 for history. Use the shared reader below that limit. The board does not move.
7. Create the opponent's card badge with the hand size and its accessible name. Ready keeps four; a card use reduces it to three.
8. Bind and remember the created game before the optional link fallback. Keep the account guard after the fallback too. A failed fallback keeps the game and chosen king.

### Third repair evidence so far

Each fault has a check that fails on the prior code. The unit logs cover FEN setup, obsolete account replies, the game notice on Join and Accept, and the failed link fallback. Browser logs show clipped online groups, the wrong subject panel, the Manual warning, the empty badge and a late Accept that leaves the next account's game.

The four-size reader and save check passes. It includes all four Manual rematches on both sides, an invalid draft, both live tabs' orders, a refused save and the old recovery cases. Draw-plus-claim and a failed draw reply keep their draw offer during the check. Card and power panels open over draw, check and sign-in states. Text and 44 px controls fit their visible boxes and clipping ancestors.

All 48 Manual boundary cases pass: powers, cards and both, on both sides, at 360x720, 360x727, 360x728, 390x745, 390x751, 390x752, 390x753 and 393x759. History fits at the 152 px boundary. The New game panel passes 11 cases. Hand passes 225 assertions. The local-stack arrangement check passes both seats and four sizes, including the initial online card badge. The local stack stops after the check.

The board check passes all 18 groups. The selected menu cases pass all 16 cases at four sizes. The lead's four-game check passes all 144 assertions across 16 game and size pairs. The one full `npm test` run passes 7,099 tests with 387 existing skips in 375 files; all 114 renderer cases pass. The focused run passes 142 tests in four files. The old page's save-controller cases remain green.

The final checks pass:

| Check | Third repair result |
| --- | --- |
| Focused `npm test` | 142 pass in four files: arrange, saved, layout and host/online. |
| `owner-playtest-r2` | All four sizes pass. The separate boundary run passes all 48 Manual cases. The final account run checks both real callers and both game notices. |
| `owner-playtest-b` | All 18 groups pass. |
| New game panel | All 11 cases pass. |
| Hand | All 225 assertions pass. |
| Selected `next-menus` | All 16 cases pass: panel, refresh, home piece close and Menu at four sizes. |
| `next-arrange` | Pass with the local online stack, both seats and four sizes. |
| Lead's four-game check | 144 pass, 0 fail. |
| Full `npm test`, run once at the end | 7,099 pass, 387 existing skips; all 114 renderer cases pass. |
| `npm run test:docs` | 197 pass, 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass with the local check configuration. |
| UI scan; `git diff --check` | No findings or whitespace faults. |

The code commit is `726e122d5`. Evidence is outside the repository in `runs/launch/owner-playtest/build/r3-shots/` and `r3-logs/`. The required draw-plus-claim, failed draw reply, open card panel, Manual warnings and initial card badge captures are present. The preview and local online stack stop after the checks.

### Third repair limits

Chromium checks use pointer, touch and keyboard. No physical phone, WebKit or live-account check runs. The old page has its save-controller unit checks, but no browser check. The existing database-gated skips remain. The build keeps the runtime art-manifest warning. A persistent storage refusal can lose the king choice after a reload; the game notice states this limit. No push, pull request or deploy runs.

## Fourth repair run

The owner asks for six faults after the third repair. The checks must fail before each change and pass after it. Work stays on this branch. Use port 5445 and one test or browser command at a time.

### Changes

1. A selected piece, open choice or armed action takes the reader before the online group. A subject panel keeps its own content. Cancel clears the choice and selection. The draw buttons return after completion or Cancel.
2. The king-save line shows in the first waiting or board frame only. A server notice takes priority. A notice keeps the first check line and the opponent action sentence.
3. Open clears the prior live-game state before it starts a kept game. A Manual draft cannot carry over to that game. The kept position and moves remain.
4. Resign clears the Manual marker only when the guarded game save succeeds. A stale tab changes neither the newer save nor its setup marker.
5. The 152 px limit applies to Manual only. Normal play keeps 144 px. Ready refreshes the layout when setup ends. At 390x751 the newer-tab warning and its button fit, and Manual still fits.
6. All five invite actions check the account on rejection too. The link fallback has the same check. An obsolete failure reaches the existing ignore path. A current account still receives a real network, server or sign-in error.

### Fourth repair checks

All six faults have failing checks on the prior code and passing checks after repair. Each Low fault is reproduced before the code changes. The final browser cases run against the prior main file once more and fail for the named faults. The logs keep both results. No test is deleted, skipped or weakened.

The focused test selector is `src/interface/{play/{saved,arrange,layout,reading-b},people/host/online}.test.ts`: 163 pass in five files. Six new account cases cover 72 held failures: network, 503 and 401; sign-out, another account, a new sign-in to the same account, and an unchanged account. The home Accept and landing Join callers keep the next account's game and layers after a rejected request.

The new `owner-playtest-r4` browser check passes at 360x640, 390x844, 844x390 and 1440x900. It covers selection, promotion, capture or push, an armed card and power, Cancel and completion, one save notice, server notice with check, a kept game, stale Resign and the 390x751 warning. The Ready boundary has a failing check before its layout refresh.

Earlier checks pass: `owner-playtest-r2` with the third repair cases and both rejected callers; all 48 Manual boundary cases; 18 `owner-playtest-b` groups; 11 New game panel cases; 225 hand assertions; 16 selected `next-menus` cases; and `next-arrange` with the fresh local online stack. The four-game check passes 144 assertions across 16 game and size pairs against the check build. The stack and preview stop after use.

Evidence is in `runs/launch/owner-playtest/build/r4-shots/` and `r4-logs/`, outside the repository. The required draw-choice, armed-card and newer-tab captures are present. The full test run passes once after the browser checks. Final checks pass:

| Check | Result |
| --- | --- |
| Focused `npm test` | 163 pass in five files. |
| `owner-playtest-r4` | Own actions pass at four sizes. Notice and save cases pass at their selected sizes; includes the 390x751 warning and Ready limit. |
| `owner-playtest-r2` | All prior cases pass, including the third repair cases and both rejected callers. |
| Manual boundary check | All 48 cases pass at eight sizes, with powers, cards or both, for both sides. |
| `owner-playtest-b` | All 18 groups pass. |
| New game panel | All 11 cases pass. |
| Hand | All 225 assertions pass. |
| Selected `next-menus` | All 16 cases pass at four sizes. |
| `next-arrange` | Pass with a fresh local online stack, both seats and four sizes. |
| Four-game check | 144 pass, 0 fail across 16 game and size pairs. |
| Full `npm test` | 7,105 pass and 387 existing skips in 375 files; then all 114 renderer cases pass. |
| `npm run test:docs` | 197 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass with the local check configuration. |
| Commit hooks and whitespace | Pass. |

The code commit is `573b15ac`. The final doc check also runs on this ticket text. The first browser attempts expose fixture navigation and selector faults; the corrected cases reproduce each product fault on the prior code and pass after repair. The before and after logs remain.

### Fourth repair limits

The checks use Chromium with pointer, touch, keyboard and reduced motion. No physical phone, WebKit, live account or old-page browser check runs. The old page keeps its save-controller unit checks. The existing database-gated skips remain. The build keeps the runtime art-manifest warning. If storage keeps refusing the king write, a reload can lose the in-memory choice. No push, pull request or deploy runs.

## Fifth repair run

The owner reports two faults after the fourth repair:

1. Send keeps the selected piece after a Haste move or another turn that can stop. A failed send at the same revision hides Check again, Discard send and the reader's Sign in again.
2. A refused king write gives a notice that setup consumes before the player can read it. Automatic Ready replaces the waiting box. Manual setup takes the line but does not show it.

The new browser check reproduces both faults before repair. The Haste network and sign-in cases fail because the reader actions are absent. Automatic and Manual setup each lose the save line before the play frame. The first Haste fixture attempts lack the development server's engine identity; the corrected fixture reaches the saved send and reproduces the fault.

Send now clears selection and inspection before the online request. Thinking input cannot set a selection: a board inspection clears it, and Undo is blocked. No extra reader rule is needed.

The local king-save line stays pending through setup. The first play frame shows it and takes it once. A stable player-waiting page can still show it once, as the earlier check requires. A server notice wins and keeps the local line for a later visible frame.

### Fifth repair checks

Each fault has a failing browser check before repair and a passing check after it. No test is deleted, skipped or weakened. The new check waits for all four transport attempts in each failed Check. It allows only the network and 401 console errors that the named cases cause. Its text bounds check uses the notice text in every layout.

| Check | Result |
| --- | --- |
| `owner-playtest-r5` | All 40 cases pass at 360x640, 390x844, 844x390 and 1440x900. Haste keeps its selection before Send. The failed send exposes Check again, then Discard after two failed checks. Discard keeps the draft and restores the normal reader. The 401 reader shows Sign in again before Escape. |
| King-save cases in that check | Join and Accept pass for both seats, with automatic or Manual setup. The second seat waits through a setup poll. The first play frame keeps the line until the next state. Two later reads do not show it again. |
| `owner-playtest-r4` and `owner-playtest-r2` | All cases pass at their selected sizes. Server notices and check lines remain. The stable waiting notice still shows once. |
| `owner-playtest-b` | All 18 groups pass. |
| Four-game check | 144 pass, 0 fail across 16 game and size pairs against the check build. |
| Full `npm test`, run once after browser checks | 7,105 pass and 387 existing skips in 375 files; all 114 renderer tests pass. |
| `npm run test:docs` | 197 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass with the local check configuration. |
| UI scan and whitespace check | No findings or faults. |

Evidence is outside the repository in `runs/launch/owner-playtest/build/r5-shots/` and `r5-logs/`. The 40 new captures include the failed Haste send at 360x640 and 844x390, and the save line after each setup path. The text and 44 px controls fit their boxes and clipping ancestors. The reader stays clear of the board. The required captures also pass a visual check.

The first four-game attempt starts before the preview responds and records eight connection refusals. A confirmed HTTP 200 precedes the full rerun, which passes all 144 assertions. Both logs remain. The first new-check attempts expose fixture identity, invitation initialization, transport timing and layout-selector faults; the corrected checks pass without a further product change.

### Fifth repair limits

The checks use Chromium and local server fixtures. No physical phone, WebKit, live account or old-page browser check runs. The old page retains its unit checks. The existing skips and runtime art-index build warning remain. A device that keeps refusing storage can lose its in-memory king choice on reload. The preview stops after the checks. No push, pull request or deploy runs.

## Sixth repair run

The owner asks for three faults and three gaps in the fifth repair checks. Decision 123 gives the king-save line its new life: from the first play frame until the revision changes.

1. Both automatic Ready paths stop when the state has a refused notice. A receipt write that fails cannot start another Ready from its own update. The waiting box keeps the refusal and Home works. With storage restored, a reload starts the game.
2. While the game sends or checks a command, online recovery can take the reader with a piece still selected. Offer draw, Resign and End with no result each show Check again and Discard send after a failed request. Discard restores the selected piece and the normal reader.
3. The king-save line records its first play revision. Two polls at that revision keep it. A server notice takes priority; the local line returns when that notice clears at the same revision. A move at a new revision ends it. Another game drops it. Setup still keeps it pending.
4. The Discard check now reads `.play-detail .play-b` and its turn state. It no longer treats the history strip beside the reader as proof of reader content.
5. The setup checks read the waiting box and arrangement reader before and after a poll. A frame observer also checks each waiting box, including short frames. The save line appears in none of them.
6. A real refused server command tests notice priority while the local line waits in setup and while it shows in play. The line returns after the notice and stays through an unchanged poll.

### Sixth repair evidence

The new checks fail on the prior product code: a refused receipt makes 12 attempts before the fixture safety limit, Menu hides Check again, and an unchanged poll removes the save line. With the Ready guard alone, the old notice code also fails to show the pending line after a setup server notice. The fixture limit lets each old loop finish; the passing check requires exactly one Ready and one receipt write in 750 ms, and no new attempt after a poll.

Deliberate faults prove the stronger checks. An empty reader after Discard fails the reader assertion at 390x844. A line in the setup waiting box fails its assertion. A line in the arrangement reader fails its assertion too. Each deliberate fault is removed. No test is deleted, skipped or weakened. The changed registered assertions have commit trailers: the reader-content replacement and the new lifetime from decision 123.

The expanded `owner-playtest-r5` check passes all 72 cases at 360x640, 390x844, 844x390 and 1440x900. The final fixture checks pass 20 more cases: all writes recover, a refused send stays stopped after a poll, and the next-game assertion waits for that game's response. The unchanged r4 check passes 40 rows at its selected sizes; r2 passes 24 groups and all six account paths.

Evidence is outside the repository in `runs/launch/owner-playtest/build/r6-shots/` and `r6-logs/`. The captures include refused-storage waiting boxes and Menu recovery at both required sizes, plus the save line after two unchanged polls. The text and 44 px controls pass bounds checks. The required phone and landscape captures pass a visual check.

### Sixth repair final checks

| Check | Result |
| --- | --- |
| `owner-playtest-r5` | 72 pass, 0 fail; the 20 final fixture cases also pass at all four sizes. |
| `owner-playtest-r4` | 40 rows pass at their selected sizes. |
| `owner-playtest-r2` | 24 groups pass, including the six account paths. |
| `owner-playtest-b` | All 18 groups pass against the check build. |
| Lead's four-game check | 144 pass, 0 fail across 16 game and size pairs. |
| Full `npm test`, run once after browser checks | 7,105 pass and 387 existing skips in 375 files; all 114 renderer cases pass. |
| `npm run test:docs` | 197 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass with the local check configuration; 480 modules transform. |
| Whitespace check | Pass. |

### Sixth repair limits

The checks use Chromium and local server fixtures. No physical phone, WebKit, live-account or old-page browser check runs. The old page keeps its unit checks. Existing skips and the runtime art-index build warning remain. If storage keeps refusing the king write, a reload can lose the choice held for this visit. The preview stops after the browser checks. No push, pull request or deploy runs.

## Seventh repair run

The owner reports three faults after the sixth repair. Decision 123 now ends the local king-save line on board input or a later successful save too.

1. Both automatic Ready paths use one guard for each game. It records the attempt before Ready starts. No emitted state or early poll can start another attempt for four seconds. The next scheduled setup poll can retry. The guard does not read the notice. The refused notice stays visible.
2. A board tap drops the local king-save line. A same-revision poll cannot restore it over a staged turn hint. The line also ends when the accepted king saves. The seat-king module exposes its existing unsaved state; it clears this state on a saved binding too. The revision, server-notice and other-game rules remain.
3. While sending or checking, the online action group can take the reader over a selected piece, an armed card or power, or an open choice. A subject panel still shows its own content. Discard restores the armed step or choice with Cancel.

### Seventh repair evidence

The new browser checks fail on the prior product code. Storage and RATE_LIMITED refuse Ready and setup stalls. A refused Cancel blocks the first Ready. A receipt for another game that cannot settle and the offline path each reach the fixture's 13-call safety stop inside 750 ms. A board tap and a later king save each leave a false save line after a poll. Armed power, card and choice each hide Check again after a failed Menu command.

The expanded r5 check passes all 112 cases across four sizes, in two sequential batches of 56. This includes all sixth-repair cases. The storage and rate cases recover at the next scheduled poll on the same page, with no reload or manual Ready call. Both seats pass Join and Accept with refused storage; Home still works. The staged Haste hint stays through two unchanged polls. Recovery and restored choices pass bounds checks at 360x640 and 844x390. The required captures also pass a visual check.

The first fixture attempts use a waiting-box selector after sending mounts a setup board, and treat the board as proof that play starts. The corrected checks read both setup surfaces and wait for the controller's playing state. A subject-opening check clears a choice by design; the final choice check proves Discard recovery before that input. A choice-button selector also needs correction. These fixture faults require no further product change. The logs retain each attempt.

No test is deleted, skipped or weakened. The registered Ready check now proves recovery without a reload. Its early-poll assertion remains. A Removed-check trailer records the stronger replacement. The expanded default r5 check needs 660 seconds because the two real-poll batches take about 570 seconds in total.

Evidence is outside the repository in `runs/launch/owner-playtest/build/r7-shots/` and `r7-logs/`. Final checks follow below.

### Seventh repair browser results

| Check | Result |
| --- | --- |
| `owner-playtest-r5` | 112 pass, 0 fail across 360x640, 390x844, 844x390 and 1440x900. Two sequential batches pass 56 each. |
| `owner-playtest-r4` | 40 rows pass at their selected sizes. |
| `owner-playtest-r2` | 24 groups pass, including all six account paths. |
| `owner-playtest-b` | All 18 groups pass against the check build. |
| Lead's four-game check | 144 pass, 0 fail across 16 game and size pairs. |

There are 164 repair captures and 32 four-game captures. All preview processes stop after the browser checks. No push, pull request or deploy runs.

### Seventh repair final checks

The focused selector `src/interface/{people/{seat-king,controller,receipt},people/host/online,play/reading-b}.test.ts` passes 111 tests in five files. The seat-king checks also cover the saved binding after a prior failure and separate the account and game keys.

The full `npm test` runs once after all browser checks. It passes 7,106 tests with 387 existing skips in 375 files. All 114 renderer tests pass. The final checks pass:

| Check | Result |
| --- | --- |
| `npm run test:docs` | 197 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass with the local check configuration; 480 modules transform. |
| Whitespace check | Pass. |

### Seventh repair limits

The checks use Chromium and local fixtures. No physical phone, WebKit, live-account or old-page browser check runs. The old page keeps its unit checks. Existing skips and the runtime art-index build warning remain. A device that keeps refusing the king write can lose the in-memory choice on reload.

## Main merge (run 8)

Merge `origin/main` at `b53b99760` into `owner-playtest-1` with two parents. This brings PR 361 (launch repairs), PR 365 (iOS release) and PR 366 (iOS build 5). Keep the lane merges, all four game types, seat kings, both sets of tests and all browser check entries.

Seat-king writes use `accountData(...).write`. The controller shares the receipt's captured gate. A storage failure keeps the chosen king in memory and gives the decision-123 line. A closed deletion gate permits no write and gives no save line. Account cleanup removes this account's king records. The account epoch, obsolete-action, session and deletion guards remain together.

The save check uses main's Continue row and board preview with the branch's names. The merged home shows “Fierce computer” and “New game”; it has no “Play” main button or old type-and-turn row. The art check enters the merged New game panel. The full-storage Ready fixture starts with an existing signed-in generation; every later write still refuses.

Checks pass: 162 focused tests in eight files; 7,259 full-suite tests with 387 existing skips; all 114 renderer tests; r5 112 cases; r4 40 rows; r2 24 groups; board check 18 groups; save check; art-wait 18 cases; four-game check 144 assertions. The doc check passes 197 tests with one existing skip. Both type projects pass. The check build passes with 482 modules.

The first full suite finds an extra gate opening in the receipt lock test. Sharing the receipt gate repairs it without a test change. The first board check times out on random idle motion. A diagnostic shows both armies with no errors; the unchanged full check then passes. No test is deleted, skipped or weakened. Changed save assertions have commit trailers.

Evidence: `runs/launch/owner-playtest/build/r8-logs/` and `r8-shots/`, outside the repository. Captures cover 360x640, 390x844, 844x390 and 1440x900 and pass visual review. Checks use Chromium and local fixtures. No physical device, WebKit, live account, native build, push or deploy runs. A device that keeps refusing storage can still lose its in-memory king on reload.


## Ninth repair run

Repair the two Medium faults that both PR 367 reviews confirm. Keep the approved design and the run-8 merge. Work stays on `owner-playtest-1`; do not push.

1. A Person action captures its draft and panel action number before the request. Close and Back end its ownership. A late reply still adds the created game to Your games through the host. It cannot apply old options, change the route, close a newer panel view or stop the open game. An action that still owns the panel applies its submitted options and returns home.
2. The Manual reader shows the current controller notice before its setup instructions. Refused storage, offline Ready and a server refusal each leave the order editable and Ready available. An unchanged poll keeps the notice. Storage recovery and Ready end setup. The king-save line stays hidden during setup, as decision 123 requires.

The added r5 checks fail before the product repairs. Held link and name replies replace the newer game route with `#play`, change the stored game type and stop its controller. All three Manual refusals leave no visible cause. One early invite probe has a request-timing fault; the corrected probe reproduces both late-reply paths. The first after run finds a clipped Manual instruction at 360x640 and two fixture assumptions. The final text fits; the fixture checks controller revisions and permits a home list refresh when no game is open.

The new cases cover link and name invites after Close with a computer game and an online game, Back with new panel edits, and the normal open-panel path. They check route and stored options, keep the same game and online controller, play a computer reply, receive an online revision, and find the created game in Your games. Manual cases cover storage, offline and RATE_LIMITED, an unchanged poll, row edits and a successful Ready retry.

### Ninth repair checks

The two requested repairs pass their checks. The required local-stack `next-arrange` check fails after the joining player reloads: that page returns to Home instead of its Manual board. Two fresh-stack runs fail at the same assertion, line 210. A third run uses the unchanged run-8 `home.ts` and `main.ts` and fails at the same point. Both repair files are then restored byte for byte. The initial account-session callback can call Home before the host has its session. This separate base fault remains outside the owner's two-fault scope. The check and its assertions stay unchanged. The local stack stops after the checks.

No test is deleted, skipped or weakened. No existing registered assertion changes.

| Browser check | Result |
| --- | --- |
| `owner-playtest-r5` | 156 cases pass at four sizes, in two sequential batches of 78. |
| `owner-playtest-r4` | All 40 rows pass. |
| `owner-playtest-r2` | All 24 groups pass, including all six account paths. |
| New game panel | All 11 cases pass. |
| `owner-playtest-b` | All 18 groups pass against the check build. |
| `next-save` | All 10 save scenarios pass. |
| `next-art-wait` | All 18 cases pass. |
| `next-arrange` | Fails on the repair and on unchanged run-8 code at the joining-player reload. |
| Lead's four-game check | 144 assertions pass, 0 fail; 32 captures. |
| UI scan | No findings. |

The focused selector `src/{account/{data,apple,account-delete-dialog},interface/{play/{saved,arrange,new-game,reading-b},people/{seat-king,controller,receipt,host/online,screens/safety}}}.test.ts` passes 274 tests in 12 files. This includes the run-8 focused files.

The 33 new focused browser cases pass at 360x640, 844x390 and 1440x900 before the full r5 batches. The first after probe passes 13 cases and fails nine: one clipped instruction and eight fixture assumptions. All attempt logs remain.

### Ninth repair final results

| Command | Result |
| --- | --- |
| Full `npm test`, once after the browser checks | 7,258 pass, 1 fail and 387 existing skips in 390 files. |
| Focused renderer `npm test` | All 114 pass. The failed full run stops before this stage. |
| `npm run test:docs` | 197 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass with the local check configuration; 482 modules transform. |

The full-suite failure is `tools/anim/promote-painted-moves.test.ts`, the rebuild-cleanup case. Its production helper checks for 31 GiB free before it checks the test's missing sibling folder. This disk has about 18 GiB free. The test therefore stops before its intended assertion. This run's temporary files and captures total less than 0.5 GiB, so removing them cannot restore the required margin. The test and helper stay unchanged. The full suite runs once, as the owner requires. The renderer selector is `{docs/2d-first-pieces,src/render/painted}/**/*.test.mjs`.

The required refusal captures at 360x640 and 1440x900 and the open game after a late link reply are present. Captures also cover 390x844 and 844x390. All four Manual refusal sizes and the late-link phone capture pass a visual check. Preview and local online processes stop. Port 5445 has no listener.

Evidence stays outside the repository in `runs/launch/owner-playtest/build/r9-logs/` and `r9-shots/`.


### Ninth repair limits

The checks use Chromium and local fixtures. No physical phone, WebKit, live account, native build or separate old-page browser check runs. The old page keeps its unit checks. The local-stack reload fault prevents a full green browser gate. No push, pull request or deploy runs.


## Tenth repair run

The two requested faults are repaired. The full test gate remains red for the unchanged disk-space check only.

### Ready and the account session

The merge review holds Alice's account lock during Ready, then signs her out or signs Bob in. The old controller writes Alice's king after the change. With Bob active, it sends Alice's choice with Bob's token and marks Bob ready.

Each controller now captures the opening account, session key and host epoch. Its client checks those values before it gets a token. A refreshed token can keep the same session key. A replacement session cannot supply the token. Each controller king write checks this session under the shared account lock. An obsolete write raises `ObsoleteAction`; Ready ignores it without a save notice or command. The receipt lock checks the action too, so an obsolete Ready leaves no send to retry. Stop advances the controller epoch. Pending reads, joins, draft checks and sends check that epoch before they continue.

The normal host tests now include both review cases. Nine lock-wait cases cover sign-out, Bob, a new Alice session, Stop, and an account change with no event. They hold the king lock or the receipt lock. After the change, Alice has no king write or command, no new receipt waits, and both seats stay unready. The initial-session case checks the route separately. These ten tests use the local service fixture.

The two review cases, Stop and the initial-session case fail before the repair. The first new-Alice probe has a fixture deadlock: it tries to sign in under the held Alice lock. The corrected fixture changes the session without that extra sign-in. An added retry probe cannot reach a second hold because settlement changes the view first; the final case checks a missing account event at the receipt lock. All final cases pass. No existing test or assertion is removed, skipped or weakened.

### Manual setup after reload

Step 0 uses a detached worktree at `d9e184537`, before any product change. `next-arrange` passes all its local-stack cases there. The stack stops and the throwaway worktree is removed. A check at `2d1970f7f` is not needed because the pre-merge commit is green.

The merge adds the fault. The account's first session event calls Home while the host session is still empty. The host now calls Home only if it replaces an existing host session. It still closes account safety panels and clears old state on an account change. The deletion-receipt checks protect that path. The joining player now reloads into the online Manual game. The focused initial-session test and unchanged `next-arrange` pass. No follow-up ticket is needed.

### Tenth repair checks

| Check | Result |
| --- | --- |
| Focused `npm test` | 305 pass in 15 files. |
| `owner-playtest-r5` | All 156 cases pass at four sizes. |
| `owner-playtest-r4` | All 40 rows pass. |
| `owner-playtest-r2` | All 24 groups pass, including six account paths. |
| New game panel | All 11 cases pass. |
| `next-arrange` | Pass before the merge and after the repair. |
| `owner-playtest-b` | All 18 groups pass. |
| `next-save` | All 10 scenarios pass. |
| `next-art-wait` | All 18 cases pass. |
| Lead's four-game check | 144 pass, 0 fail; 32 captures. |
| Full `npm test`, once | 7,268 pass, 1 fail and 387 existing skips in 390 files. |
| Focused renderer `npm test` | All 114 pass. The full run stops before this stage. |
| `npm run test:docs` | 197 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass; 482 modules transform. |

The focused selector is `src/{account/{data,apple,account-delete-dialog,account-sign-out-session,account-host-sessions},interface/{play/{saved,arrange,new-game,reading-b,layout},people/{seat-king,controller,receipt,host/online,screens/safety}}}.test.ts`.

The full-suite failure is the rebuild-cleanup case in `tools/anim/promote-painted-moves.test.ts`. Its helper requires 31 GiB free. The disk has 30.996 GiB free before the full run and about 30.697 GiB after the checks. The test and helper stay unchanged. The full suite runs once. No space is freed outside this run's temporary folder.

Evidence stays outside the repository in `runs/launch/owner-playtest/build/r10-logs/` and `r10-shots/`. The 445 captures include all four required sizes. The four online wait captures and the narrow-phone Manual refusal pass visual review. All checks run in sequence with `/private/tmp/kd-r10` and preview port 5445. The local stack and preview stop. The throwaway worktree is removed.

### Tenth repair limits

Checks use Chromium and local fixtures. No live account, physical device, WebKit, native build or separate old-page browser check runs. The existing skips and runtime art-index warning remain. No taste or rule choice changes. No push, pull request or deploy runs. The disk gate above prevents an all-green full-suite result.
