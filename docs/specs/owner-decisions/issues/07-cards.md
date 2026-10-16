# Cards and powers: tap then target, 2x2 grid, art, names, pick four, 197 px coins

Status: in-progress

Lane: od-cards (outside the board screen). Track: ui. Depends on: 12.

Each part names the owner's pick (approval page, 2026-10-15) and the work that the code map found.

## J6

- Pick: a: Tap card, then target
- Today: not-built. In integration, screens/board.ts coinRead() opens a sheet with a 'Use' button, which sets armedCard or armed. Then select(), cardChoices() and named() take the target tap, and refresh() shows the 'armed' line 'Choose a piece, then a marked square.' The cost words are in cardText() and powerText() in src/powers-ui.ts (F2 is done). No code has 'Uses your turn' or 'Free, then move', and no line stays after a use. The Collection is screens/collection.ts.
- Build: A tap on your own usable card or power coin arms it at once and puts its rule, cost words and targets in the context line. Opponent coins and spent coins keep the read sheet. Add a cost-words helper (from markFree) to powers-ui.ts and use it in the Collection. Keep one result line after the use, for example 'b7 cannot move on Black's next turn.', and update the card tests in tools/plugin-*.test.ts.

## C3

- Pick: b: A 2 × 2 grid, no chest (recommended c)
- Today: not-built. Today the card choice is src/plugin/screens/setup.ts poolSheet('cards'). It is a sheet that shows all 21 DEAL_CARDS in .card-grid with check boxes and back.webp for the missing faces. New game has a 'N cards ›' row from build()/render(). The styles are app.css .card-grid and label.card-face. The Lively deal (board.ts is-dealt) is a moment on the board and is not this choice.
- Build: With Cards on, New game shows the four cards in place as a 2 × 2 grid. Each face shows the name, the effect and the cost, and the chosen card lifts (transform only, 120–150 ms). Build the grid on the D4 a modes (Pick four, Use all). For faces with no painting, use powerArt() from src/power-motion.ts. But only Strike, Haste and Flight have a scene. Nine deal cards have no face and no scene (MirrorB, Firewall, EarthQuake, Burn, FireStarter, Control, Rally, MorphP, Curse), so they need a plain named face or new scenes.

## L1

- Pick: a: Art and power scenes
- Today: partly. In the integration branch, the card-coin loop in src/plugin/screens/board.ts strips() uses ui/cards/<card>.webp when a face exists. For a missing face it uses back.webp and a 2-letter .cc-word (app.css). coinRead() opens a sheet with the card name as its title, so the name on tap exists. The F8 screen reader names ('Your …', 'Opponent's …') are in. setup.ts poolSheet() and collection.ts show back.webp for the missing faces. Only the web file new-game.ts uses powerArt() from src/power-motion.ts.
- Build: Replace the back image and the 2-letter word with powerArt() scenes in the board coins, the Cards sheet and the Collection. Only Strike, Haste and Flight have scenes. Nine deal cards have no face and no scene, so they need a plain named face, new scenes or the L1 c paintings. Give the two hands a different look in app.css .coin.card-coin, for example a gold ring on your coins and a dark ring on the opponent's coins.

## W10

- Pick: a: names with no letter ('Mirror', 'Morph')
- Today: not-built. src/plugin/screens/board.ts cardName() (line 27; used in the coin aria-label line 210, the coin letters line 212, the armed line 236, the card sheet title); src/plugin/screens/setup.ts cardName() (line 16); src/plugin/screens/collection.ts line 39; src/powers-ui.ts POWER_NAME.
- Build: Add one card-name helper in powers-ui.ts that gives 'Mirror' for MirrorB and 'Morph' for MorphP, and use it in the three copies. The deal (DEAL_CARDS) has no plain Mirror or Morph, so no two dealt cards share a name. The two-letter coin text ('Mi', 'Mo') goes with L1 a.

## D4

- Pick: a: Pick four, or use all (Use all cards deals a random 4; Pick four starts empty and deals exactly those four)
- Today: not-built. src/plugin/screens/setup.ts poolSheet() (cards branch, lock note); src/plugin/screens/setup-model.ts cardLocked(), withCard(); src/match/setup.ts validate() and draw() need no change.
- Build: Add a 'Use all cards' / 'Pick four' choice to the card sheet. Pick four starts empty and stops at four. Remove the lock on each tap (cardLocked) and check the pool at Done only; Close, Escape and the scrim keep the last valid pool. No server change: a 4-card pool already deals exactly those four.

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

J6, the board coins and OPEN-coins197 belong to the board lane. This lane does not edit `src/plugin/screens/board.ts`. The board lane must use the shared card name there. F38 stays open if the board still shows letters over art.

1. Add shared card names, card art and cost words. Check each deal card.
2. Add the two card modes, a sheet draft and the four slots in New game. Save valid pools with Done. Test Close, Escape and the scrim.
3. Add unit and browser tests. Measure text contrast and the hand rings on the M1. Run the type check, all tests and plugin-ui. Run plugin-ui-http only if server code changes.
4. Get two independent code reviews. Fix confirmed faults. Record results and commit on `claude/od-cards`.

Checks: Pick four starts empty and stops at four. Use all cards accepts any pool of at least four. Done saves only a valid pool. Other exits keep the last valid pool. Both modes show four slots in a 2 × 2 grid. Every face has its name, effect and cost. A selected face lifts in 140 ms. Missing faces use three existing scenes or nine plain names.
