# Cards and powers: tap then target, 2x2 grid, art, names, pick four, 197 px coins

Status: done (review fixes checked; board work stays open)

Lane: od-cards (outside the board screen). Track: ui. Depends on: 12.

Each part names the owner's pick (approval page, 2026-10-15) and the work that the code map found.

## J6

- Pick: a: Tap card, then target
- Today: not-built. In integration, screens/board.ts coinRead() opens a sheet with a 'Use' button, which sets armedCard or armed. Then select(), cardChoices() and named() take the target tap, and refresh() shows the 'armed' line 'Choose a piece, then a marked square.' The cost words are in cardText() and powerText() in src/powers-ui.ts (F2 is done). No code has 'Uses your turn' or 'Free, then move', and no line stays after a use. The Collection is screens/collection.ts.
- Build: A tap on your own usable card or power coin arms it at once and puts its rule, cost words and targets in the context line. Opponent coins and spent coins keep the read sheet. Add a cost-words helper (from markFree) to powers-ui.ts and use it in the Collection. Keep one result line after the use, for example 'b7 cannot move on Black's next turn.', and update the card tests in tools/plugin-*.test.ts.

## C3

- Pick: b: A 2 × 2 grid, no chest (recommended c)
- Today: not-built. The current card choice is the inline Cards section in src/plugin/screens/setup.ts. All 21 DEAL_CARDS show art and name in a box that scrolls. A tile opens its full card sheet. A separate checkbox changes the pool. The styles are app.css .card-grid and label.card-face. The Lively deal (board.ts is-dealt) is a moment on the board and is not this choice.
- Build: With Cards on, New game shows the four cards in place as a 2 × 2 grid. Each face shows the name, the effect and the cost, and the chosen card lifts (transform only, 120–150 ms). Build the grid on the D4 a modes (Pick four, Use all). For faces with no painting, use powerArt() from src/power-motion.ts. But only Strike, Haste and Flight have a scene. Nine deal cards have no face and no scene (MirrorB, Firewall, EarthQuake, Burn, FireStarter, Control, Rally, MorphP, Curse), so they need a plain named face or new scenes.

## L1

- Pick: a: Art and power scenes
- Today: partly. In the integration branch, the card-coin loop in src/plugin/screens/board.ts strips() uses ui/cards/<card>.webp when a face exists. For a missing face it uses back.webp and a 2-letter .cc-word (app.css). coinRead() opens a sheet with the card name as its title, so the name on tap exists. The F8 screen reader names ('Your …', 'Opponent's …') are in. setup.ts and collection.ts use cardArt() for each face. Only the web file new-game.ts uses powerArt() from src/power-motion.ts.
- Build: Replace the back image and the 2-letter word with powerArt() scenes in the board coins, the Cards sheet and the Collection. Only Strike, Haste and Flight have scenes. Nine deal cards have no face and no scene, so they need a plain named face, new scenes or the L1 c paintings. Give the two hands a different look in app.css .coin.card-coin, for example a gold ring on your coins and a dark ring on the opponent's coins.

## W10

- Pick: a: names with no letter ('Mirror', 'Morph')
- Today: not-built. src/plugin/screens/board.ts cardName() (line 27; used in the coin aria-label line 210, the coin letters line 212, the armed line 236, the card sheet title); src/plugin/screens/setup.ts cardName() (line 16); src/plugin/screens/collection.ts line 39; src/powers-ui.ts POWER_NAME.
- Build: Add one card-name helper in powers-ui.ts that gives 'Mirror' for MirrorB and 'Morph' for MorphP, and use it in the three copies. The deal (DEAL_CARDS) has no plain Mirror or Morph, so no two dealt cards share a name. The two-letter coin text ('Mi', 'Mo') goes with L1 a.

## D4

- Pick: a: Pick four, or use all (Use all cards deals a random 4; Pick four starts empty and deals exactly those four)
- Today: not-built. src/plugin/screens/setup.ts (inline pool and lock note); src/plugin/screens/setup-model.ts withCard(); src/match/setup.ts validate() and draw() need no change.
- Build: The inline Cards section has Use all cards and Pick four. Pick four starts empty and stops at four. Use all cards locks the last four checked cards. Start checks the pool before Create. No server change: a 4-card pool already deals exactly those four.

## F38

- Pick: (none); owner: fix all, so a
- Today: partly. Rounds 4, 5 and 7 fix M1, M3, M4, M5, M7-M11 and M13 (the W mark). Open: src/plugin/screens/board.ts:212 shows a two-letter .cc-word on card coins with no face (src/plugin/app.css .cc-word), at about 1.4:1 on the art.
- Build: Only the card coin letters stay open. L1 a replaces the letters with real art and power scenes. After L1, measure the coin contrast again. M6 and M12 (names cut with '…') stay as they are.

## OPEN-coins197

- Pick: owner: fix all
- Today: not-built. src/plugin/app.css player strip coin rows (#strip-me, #strip-them .coin-row). At 197 x 426 with all features, card-w-2 and card-w-3 are off screen in both strips. The preview rule in d464ca91 uses 5 columns of 44 px (236 px), which is wider than 197 px, so the preview also has this fault.
- Build: When the table is narrower than about 250 px, let the coins wrap onto as many 44 px lines as necessary, so that each coin stays on screen. Under 320 px the screen already scrolls. Add a check at 197 x 426 that each coin is inside the screen and that a tap on it works.

## Done when

- Each part above works as its Build line says, with a test for each behaviour.
- npm test passes; the plugin-ui browser check passes on the M1.
- Two independent reviewers find no open fault.

## Comments


### Lane scope and plan

The owner assigns this lane C3 b, D4 a, W10 a outside the board, L1 a in the Cards sheet and Collection, the hand ring colours, and F38 measurement.

J6, including the Collection cost words, the board coins and OPEN-coins197 belong to the board lane. C3 uses `cardCost()` on the New game choices only. This lane does not edit `src/plugin/screens/board.ts`. The board lane must use the shared card name there. F38 stays open if the board still shows letters over art.

1. Add shared card names, card art and cost words. Check each deal card.
2. Add the two card modes, a sheet draft and the four slots in New game. Save valid pools with Done. Test Close, Escape and the scrim.
3. Add unit and browser tests. Measure text contrast and the hand rings on the M1. Run the type check, all tests and plugin-ui. Run plugin-ui-http only if server code changes.
4. Get two independent code reviews. Fix confirmed faults. Record results and commit on `claude/od-cards`.

Checks: Pick four starts empty and stops at four. Use all cards accepts any pool of at least four. Start accepts only a valid pool. Both modes show all cards in a short grid that scrolls. Each tile has art and name. Its full sheet has the rule and cost. A selected face lifts in 140 ms. Missing faces use three existing scenes or nine plain names.


### Build and review

- C3 b: New game shows all deal cards in two columns, in a box that shows about two rows. Each tile has art and name. A tap opens a full card with its rule and cost. A selected face lifts in 140 ms. Each card has a separate pool checkbox. The game still draws at random.
- D4 a: Use all cards permits any pool of at least four. Pick four starts empty and stops at four. Pool edits apply inline. Use all cards locks the last four cards. Start refuses an incomplete Pick four pool. An exact four-card saved pool opens as Pick four. A mode round trip keeps the all-card pool. A saved Pick four pool switches to all 21 cards.
- W10 a: `cardName()` in `powers-ui.ts` gives Mirror and Morph. Setup and Collection use it. The board lane must replace its local copy.
- L1 a: Setup and Collection use one `cardArt()` helper. It shows nine paintings, three existing power scenes and nine plain names. Your card ring uses dark gold (`--gold-ink`). The other hand uses dark stone (`--stone-700`). Both rings keep the armed state.
- Costs use the current rules. Mirror says “Same cost as the copied card” because the target card sets the cost.
- Two independent readers review the change. They find two CSS faults: the shared button rule sets the lift to 80 ms and makes both outer rings dark stone. Stronger selectors fix both. The second reader confirms the fixes and finds no further fault. Browser checks must confirm the computed styles.

Taste choices: first-four examples for the random deal; a 3 px lift at 140 ms; plain named faces for nine cards; dark gold and dark stone rings; the copied-card cost words for Mirror. No new art, card rule or server field is required.


### Check evidence

- `npx tsc --noEmit` passes (exit 0).
- M1 `npm run -s check:browser plugin-ui` passes on `c59ec888` in 240.2 s. Run folder: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-cards-yBfxe4`. The new card checks pass: the grid at 197, 393 and 1000 px; names; art; costs; both modes; the four-card limit; and all three cancel paths.
- The M1 capture `plugin-ui/cards-picked-four.png` shows the four faces, rules and costs. The two scenes and two plain named faces fit the phone frame.
- F38: `plugin-ui/card-contrast.json` measures the remaining board “Mo” text at 1.38:1 and 1.40:1. The check samples the background under the text box, before the text shadow. Your ring measures 6.14:1 against vellum. The other ring measures 8.80:1. F38 stays open for the board lane until it replaces the letters and checks the final faces.
- No server code changes. `plugin-ui-http` is not required for this lane.
- The first M1 run finds a test fault: a source-harness helper does not exist in the built page. The test now opens Collection through the visible Profile button. The second run passes.
- `npm test` waits for the shared test lock. The final result goes below when the run ends.


### Final source check

The plain face name is decorative. It uses `aria-hidden="true"` so a screen reader reads the caption name once. Its unit test checks the attribute. The art reviewer checks the change and finds no open fault. Both independent readers confirm that their earlier findings are fixed.

M1 `npm run -s check:browser plugin-ui` passes again on `90411247` in 249.4 s. This run includes the screen reader fix. Final run folder: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-cards-JDcKJF`. The capture, contrast report and log are copied to `/tmp/kd-od-cards-picked-four.png`, `/tmp/kd-od-cards-contrast.json` and `/tmp/kd-od-cards-plugin-ui.log` on this Mac.


### Full test follow-up

The first full Mac run passes 165 of 166 files (2,561 tests pass; 8 skip). The unchanged `src/rules/power-fixes.test.ts:470` exceeds its 5 s limit at 5.942 s. The engine and that test have no diff from `fc45bd6f`. A single-file `npm test` run is queued with the same limit.

The first full M1 run also passes 165 of 166 files (2,561 tests pass; 8 skip). The only failure is `tools/plugin-app.test.ts:1013`: the Start recovery test counts two Create calls instead of one. Recovery compares virtual browser time with the fixture server's real date. The test now starts its virtual clock at the epoch, before the server clock. The 5 s wait, 10 s timeout, Retry path and one-Create assertion stay intact. An independent reader checks this repair and finds no open fault. No product recovery code changes.

The old M1 rerun on `582a5f53` is cancelled while it waits, before it starts tests. The final browser check and full M1 suite are queued together on `49e84afd`. The final Collection change contains only shared names and art. No test or check time limit changes.


### Checks on the final source

M1 `npm run -s check:browser plugin-ui` passes on `49e84afd` in 242.1 s. Run folder: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-cards-ZfoACK`. This is the final source: the Collection has shared names and art; J6 cost words stay with the board lane. The full M1 `npm test` now runs on the same head. The Mac single-file check still waits for its lock.


### Lane complete

- Checked source head: `49e84afd39ed205254e5bb30e052805306b98f61`.
- `npx tsc --noEmit` passes on this Mac. The final M1 full test run also passes its type check.
- M1 `npm test` passes: all 166 files; 2,562 tests pass and 8 skip. Vitest takes 157.81 s. All 50 drawing tests then pass. The run uses the owner's test database URL and the existing limits.
- Final M1 `plugin-ui` passes in 242.1 s on that same source head. Its log, phone capture and contrast report are copied to this Mac under `/tmp/kd-od-cards-plugin-ui.log`, `/tmp/kd-od-cards-picked-four.png` and `/tmp/kd-od-cards-contrast.json`. Full test log: `/tmp/kd-od-cards-m1-final-tests.log`.
- The initial Mac full run has one unchanged 5 s engine timeout. The final full M1 suite passes that same engine file without a limit change. The redundant Mac single-file check is stopped while it still waits for the test lock, after the full M1 pass.
- Added tests cover shared names, unique deal names, current costs, all three art routes, decorative names, the four-card cap, pool validation at Done, all three cancel paths, both modes, the grid and its lift duration. The final browser check measures the hand ring colours and remaining coin text.
- Both independent readers find no open fault after the fixes. No engine, server, test-limit or check-limit file changes.
- J6, including Collection cost words, the board coin faces, the board's name-helper caller, and OPEN-coins197 stay with the board lane. F38 remains open there: the old coin text measures 1.38:1 to 1.40:1. The board lane must replace it and measure the final faces.

The source and tests are committed. This final ticket update records the checks and handoff only.

### Review repair plan

1. Check A1 to A5 and B1 to B2 against the source and the owner's picks.
2. Stop card scene loops. Keep the saved pool through a mode round trip. Keep an open sheet and its draft through a host refresh.
3. Give the New game card tap a useful action. Check the 3 px lift after its transition. Measure the rings against the coin face and each other. Update Q20.
4. Add a test for each confirmed fault. Run `npm test` on this Mac and `plugin-ui` on the M1 with the current limits. Run `plugin-ui-http` if server code changes. Record each result and commit.

Checks: no infinite card animation in New game, Cards or Collection; the same six-card pool after a mode round trip; the same sheet, focus and draft after a host refresh; a useful card action; a measured 3 px lift; measured ring contrast; Q20 states both modes. Use all cards locks the last four checked cards. Start checks the pool.

### Review findings and repairs

| Finding | Source check and repair | Check |
| --- | --- | --- |
| A1 | Confirmed. Card faces use the shared scenes, which loop. A rule under `.cf-art` stops their animations. | Check New game, Cards and Collection for running infinite animations. |
| A2 | Confirmed. A switch to Use all cards replaces a saved pool with all 21 cards. The inline section keeps its all-card pool for that switch. A saved Pick four pool still switches to all 21. | Save six cards, switch to Pick four and back, then save the same six. Keep the existing four-to-all check. |
| A3 | Confirmed. `selectedCard` changes no setup or deal. Remove that state and `aria-pressed`. A tap now opens Cards at that card. Close returns focus to the card. | Tap Haste, check the dialog and focus, then close and check focus again. |
| A4 | Confirmed. The old checks read only a duration, different colour strings and vellum. The lift check now reads the final transform. Your ring uses gold on a dark stone face. The other hand keeps a dark ring on a pale face. | Check a 3 px lift, no lift on other cards, and the return after an uncheck. Require 3:1 between rings and against the face under each ring. Read the face pixels with the ring and art hidden. |
| A5 | Confirmed. Q20 gives both inline modes, the four-card lock and the Start check. | `tools/plugin-cards.docs.test.ts` checks the deal row. The browser check tests the inline lock and an incomplete Pick four pool at Start. |
| B1 | Confirmed. `setupScreen()` opens a saved sheet again on each host read. It now restores a saved sheet only when no sheet is open. | Uncheck Haste, send another `kingdown_open({screen: 'play'})` result, then check the same dialog, focus and five-card draft. Done saves that draft. |
| B2 | Confirmed. This is the lift-test fault in A4. | The same transform check covers it. |

The repair uses the proposed picks: a card tap opens Cards, and your hand has a gold ring on a dark stone face. No card rule, engine code or server code changes. The type check and commit checks pass on repair head `60202605`.

### Repair check checkpoint

- The full Mac `npm test` run finishes in 180.49 s. It passes 165 of 167 files: 2,561 tests pass, 8 skip and 2 fail. The new Q20 test passes.
- `src/rules/power-fixes.test.ts:470` exceeds its 5 s limit at 5.945 s. Both the test and `engine.ts` have no diff from `fc45bd6f`. The earlier card build has the same full-suite fault. The single-file `npm test` rerun passes all 35 tests in 6.84 s with the same limit. Its type check and all 50 drawing tests also pass.
- `tools/plugin-motion.test.ts:79` exceeds its 15 s wait for `.is-spending`. The pulse code and this test have no diff from the starting head. The single-file `npm test` rerun passes all 14 tests in 26.31 s with the same limits. Its type check and all 50 drawing tests also pass.
- Full-suite log: `/tmp/kd-od-cards-review-tests.log`. Single-file logs: `/tmp/kd-od-cards-review-power-tests.log` and `/tmp/kd-od-cards-review-motion-tests.log`.
- M1 `npm run -s check:browser plugin-ui` passes in 229.0 s on `602026057430e635985944a3450c23f7a3c95270`. It uses `~/projects/kd-od-cards` and releases `~/projects/.check.lock` on exit. Run folder: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-cards-a5417H`.
- All new card checks pass: the six-card mode round trip, the host refresh with an open draft, the card action and focus return, the 3 px lift and its return, and no running scene loop in New game, Cards or Collection.
- The ring report measures 3.66:1 between the rings. Your gold ring measures 3.66:1 against its dark coin face. The other ring measures 5.24:1 against its pale coin face. Each check requires at least 3:1. The old board letters measure 1.40:1 in both hands. F38 stays with the board lane.
- The phone capture shows all four names, rules and costs inside their faces. It is saved with the ring report and all logs in `/tmp/kd-od-cards-review-evidence/` on this Mac.
- The full Mac suite has two timing failures; both files pass separately. No test or check time limit changes. `plugin-ui-http` is not required because no server code changes.

All findings in A1 to A5 and B1 to B2 are confirmed and fixed. B2 repeats the lift-test fault in A4. This final ticket change records the check results only; the checked source stays at `60202605`.

### Integration review (claude/owner-decisions, 2026-10-16)

The merged build showed two names for one card: Setup said "Morph", but the board sheet, coin label, armed line and short last-move line said "Morph P". `board.ts` and `move-text.ts` now use the shared `cardName()`, so W10 a holds on every screen of the submission build. Step 07-board does not repeat this change. F38 (letters over the card back) stays with step 07-board.
