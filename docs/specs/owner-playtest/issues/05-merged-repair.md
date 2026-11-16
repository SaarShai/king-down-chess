# Repair the merged playtest paths

Status: claimed
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

The final broad checks remain open. Evidence is outside the repository in `runs/launch/owner-playtest/build/r3-shots/` and `r3-logs/`.
