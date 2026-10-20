# GUI previews 2026-10-19: cards: art, faces, coins, reasons, collection

Status: done
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-cards/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A5 One card art family

Problem: Strike, Haste and Flight have no painting, so they show “ST”/“FL” letters or a diagram where others show art.

Build: **Paintings for every card; diagrams in the detail**. New paintings for Strike, Haste and Flight (made with Codex image_gen).

Why this pick: Paintings everywhere look like one set; diagrams stay in the card detail where they teach.

Other options (do not build): Diagrams for every card (Clear, but less beautiful.)

### A16 Card detail shows the card back, not its face

Problem: Reading a card on the board shows the card back. On 2026-10-18 you parked card faces and costs for a later ticket (shared-screens-later 11 and 12).

Build: **Show the card face now, nothing else**. Use the same card art as the Collection.

Why this pick: Showing the face only (no new state words) is small and removes a clear confusion.

Other options (do not build): Keep it parked (It ships with tickets 11 and 12.); Face plus state words and cost now (Ready, spent, no target, cost.)

### A33 Card coins and blank card faces

Problem: Some workshop cards have empty faces, and hand coins show two-letter codes. Many cards repeat a lab ribbon. It touches your card coin and card art picks.

Build: **A symbol on each coin and a small move picture on blank faces**. One lab mark only.

Why this pick: A symbol on each coin and a small picture on blank faces fit your coin pick; new art needs a licence check.

Other options (do not build): New painted art for the blank cards (More cost; some old art needs a licence check.); Keep as it is (Letters and blank faces.)

### A35 Card sheet: why there is no Use button

Problem: When a card cannot be used now, its sheet shows no Use button and no reason. A fix needs new words.

Build: **Add one short line with the reason**. For example that the card is spent or has no move now.

Why this pick: One short line tells the player why, so they do not look for a button.

Other options (do not build): Show Use, but disabled (No new words; the reason stays unclear.); Keep as it is (No reason shown.)

### A40 Collection: the same status on every card

Problem: Each collection card repeats “Unlocked”, and the intro already says all are unlocked. A short index with one detail view is a larger redesign. It touches your collection layout.

Build: **Hide the status line while all are unlocked**. Show it again when locks come back.

Why this pick: To hide the line while all items are unlocked removes noise with no new look.

Other options (do not build): A short index with one detail view (A redesign with a new try-it control.); Keep as it is (Status on every card.)


## Build plan and checks

Build A5, A16, A33, A35 and A40 in that order. Use one commit per item. Keep each change in this branch for the owner to review.

For each item, add a test for its changed behavior. Save before and after views at device scale 2. Check phone and desktop views. Use light and dark for the plugin. Run the type check, unit tests and the named browser check. Record each result here.

## A5 preview

Add paintings for Strike, Haste and Flight. Keep the move diagrams in the detail view. Use the current card frames and coin sizes. The built-in image tool makes the art. The public files use 800 × 800 WebP. The prompt file records the three subjects.

Taste: use cream and burgundy for all three. Use warm amber for Strike and Haste. Use muted teal for Flight. Keep the current square crop and the current type.

Checks: the type check passes. The focused test command waits for the shared test lock. The base has 200 plugin captures and 14 web captures at device scale 2. The capture script uses visible image readiness for the web; hidden image loads must not hold a capture.

## A16 preview

The board sheet uses the same face function as Collection. It shows no card back. The rule text and Use action keep their current behavior. A board test compares a painted face and a face with no painting with Collection. No taste choice is needed.

A5 visual check: the phone and desktop views use the current frames with clean image edges. The art and the diagram fit the phone sheet. The new knight, rook and bishop stay clear at the small card size. The test command still waits for the shared lock.

## A33 preview

Cards with no painting use a clear symbol on the coin and a small rule picture on the face. The picture has no letters. Setup, Collection, the board sheet and the Workshop share these pictures. Painted coins keep their art, as L1 requires. The Cards tab keeps one LAB mark. The repeated ribbons and extra LAB marks leave the cards, the tray and the side note. No old source art enters this change.

Taste: use cream line symbols on the dark coins. Use stone and parchment for the small rule pictures. Keep the current coin sizes and card layout. A card variant keeps its base symbol. The full name and rule stay on tap.

Checks: the type check passes. New tests cover all dealt card symbols and pictures. The board test checks the symbol size and the spent state. The browser check requires twelve paintings, nine rule pictures and no letter pairs. A16 captures show that the sheet and Collection use the same face.

A33 visual repairs: the first 2x review finds low contrast on the opponent's pale coin. Its symbol now uses dark ink. Your dark coin keeps cream. Burn, Fire Starter and Control now show a knight, since those cards cannot use a pawn. Tests cover both repairs.

## A35 preview

A card sheet with no Use action shows one short reason. It covers a spent card, an opponent's card, a game that has ended, the other turn, an action in progress and no move now. A usable card keeps Use and has no reason line. Unit tests cover all seven states. A board test checks the no-move and opponent sheets.

Taste: use a plain sentence below the rule. Keep the current body type. Add no badge, cost or disabled button.

## A40 preview

Hide each status label and value while all entries are unlocked. Keep the intro and the rule text. After each draw, check the entries. If an entry is not unlocked, show the status rows again. A test covers each tab and a locked entry that becomes unlocked again. No taste choice is needed.

A35 visual check: the no-move and spent lines fit on phones and desktops, in light and dark. The Use action stays on a usable card. The base-page captures use the saved branch-base build.

Final picture review: Control uses two friendly pieces. Spawn 2 and Spawn K2 show two pawns. The Spawn K pictures show the king. Tests check these facts. These repairs are in the A33 commit.

## Check results

The five preview builds are done. Each item has one commit. The owner still approves each preview before a merge.

- `npx tsc --noEmit`: pass. Each commit hook also passes the type check and the staged gate.
- `git diff --check`: pass.
- `plugin-ui`: pass on the M1 at `9759ab27`, 284.7 seconds. The required check runner reports exit 0. The resource uses 764,030 JSON bytes, below the 1,000,000-byte limit. Server code has no change, so this lane needs no `plugin-ui-http` run.
- The first active browser run finds duplicate card entries. The picture SVGs use the card controls' `data-card` attribute. Pictures and symbols now use separate attributes. The existing browser check passes after this repair. The symbol tests guard this boundary.
- Full `npm test`: exit 75 after 900 seconds in the shared test-lock queue. No test starts. The changed-unit attempt also exits 75 after 60 seconds in that queue. No unit result is claimed. The unit checks remain blocked by the shared lock. This lane stops no other lane's process.
- Added tests cover paintings, detail diagrams, symbols, rule pictures, valid piece types, friendly Control pieces, Spawn pawn counts, shared sheet faces, use reasons, hidden status and its return for a locked entry.
- Proof: 430 PNG files, with 212 before/after pairs. Every image has device scale 2 and the required size. The shorter Collection needs six fewer scroll views. Each after view has a before view. The proof index is in the lane's `previews/INDEX.md`.

## Visual review

A5 keeps the current type, card frames, coin sizes and image windows. The three paintings have clear subjects and clean edges. The detail diagrams fit the phone sheet. A16 shows the same face as Collection. A33 removes the empty faces and repeated ribbons. The 2x review repairs low contrast on the opponent's symbols, wrong pawn pictures for three cards, an enemy piece in Control and the pawn count in Spawn 2. The Cards tab has the one LAB mark. A35 gives one clear reason in the current body type. A40 removes both the status label and its value while all entries are unlocked.

No requested part is left unbuilt. Unit execution is the check gap. The taste choices are in each item's preview note and in the art prompt file. The final record changes no game rule.

## Review repair plan

Both reviews confirm three faults in the code. A33 shows a swap between two knights for Control. A5 hides the Workshop diagrams on a phone. A35 gives the wait line for failed commands and reads.

1. Show a knight beside a friendly rook and one borrowed rook move. Check the picture and its move against the engine.
2. Put the Workshop diagram below the card heading on a phone. Check all three diagrams at phone and desktop sizes, and check the board sheet calls.
3. Pass the page lock state to the card reason. Test a failed command, a failed read, recovery, and an action in flight through the board.
4. Run `npm test` and the required `plugin-ui` runner. Commit before the browser check. Record the results here and in the lane report.

The checks must prove that the picture is legal, the diagrams are visible at a useful size, and each failed state names its recovery control. No game rule changes.

## Review repairs

- A33, both reviews: confirmed and fixed. Control shows one knight beside a friendly rook, with one move from a1 to a2. The picture has no swap arrows. The test reads the picture's squares and move, checks the move against the engine, and checks that the rook stays in place. Two knights cannot make the pictured move.
- A5, review A: confirmed and fixed. The diagram leaves the small art window. It has its own row below the card heading on a phone. The browser check covers Strike, Haste and Flight in Workshop and the board sheet, at 390 × 844 and 1280 × 800, in light and dark. Each diagram must be visible, have room to read, fit the view and have no cover.
- A35, both reviews: confirmed and fixed. The card reason reads the page state. A failed command names Retry. A failed read names Try again. An action in flight gives the wait line. The browser check fails a computer-game read and a friend-game draw offer, checks each sheet, retries, and checks that Use returns. It also checks that the coin stays off while the retry runs. The unit test checks the wait line.

The type check, script syntax check and diff check pass. Both `npm test` repair attempts exit 75 after 60 seconds in the shared test queue. No test starts. No other lane's process is stopped.

The required `plugin-ui` check passes at `fa29df39` on this Mac in 229.5 seconds. The runner reports `check-runner: mac exit 0 at fa29df39`. The new diagram, picture and recovery checks pass. The existing plugin checks also pass. The resource uses 764,518 JSON bytes, below its limit. The check changes no product server code, so `plugin-ui-http` is not required.

The first browser attempt stops in the new test because it tries to open a disabled coin during a command. The test now checks that the coin stays off. No time limit changes. The second attempt passes.

Logs: `scratchpad/lanes/gui-prev-cards/unit-fixes-1.txt`, `unit-fixes-2.txt` and `checks-review-fixes-2.txt` in the task scratch folder. The new 2× views use the `repair-` prefix in the lane's `previews/` folder. The final lane report records the final head. The final ticket update changes no code or art from the passed browser commit.

## Test repair (2026-10-19)

Plan:

1. Merge `origin/main`. Keep the main fault fixes and all five card previews.
2. Run the full unit suite on the M1 with `m1-unit.sh`. Run the local type check.
3. Class each failure as an old expectation (a), a missing fixture (b), a code fault (c), or a timed failure under load (d). Keep all guards and time limits.
4. Commit each repair kind. Run each repaired file on the M1. Then run the full M1 suite again.
5. Record the merge, repairs, counts and limits here and in the lane report.

Pass criteria: all M1 tests pass, except database tests that the M1 cannot run. The local type check and diff check pass. This repair step runs no browser checks or captures. CI checks the browser after the main session opens a pull request.

Merge: `origin/main` is `0a7ec40b`. The one conflict is at the end of `tools/plugin-board.test.ts`. Keep both sets of added tests: A16/A35 card sheets and N11 special-move sounds. The board and browser-check code merge without a conflict. Keep all main fault fixes and judge checks.

A5, kind a: `src/workshop/powers.test.ts` checks the old set of 11 WebP files. Add Flight, Haste and Strike to its exact expected file list. The check still covers the full directory and rejects missing or extra files. No art or code changes.

A40, kind a: `tools/plugin-profile.test.ts` expects the visible label `Status`. The existing card style renders it as `STATUS`. The M1 output proves that Locked, Unlocked and STATUS return. Change all three rendered status-label checks to `STATUS`, so the hidden-label checks also test the actual text. Keep the DOM text checks as `Status`. No product code or screen changes.

First M1 suite, merge commit `a1dab464`: 184 files pass, 2 fail, 12 skip; 3,133 tests pass, 2 fail, 164 skip. Time: 325.91 seconds. The two failures are A5 and A40 above. Search (18 tests) and judge (12 tests) both pass. The two earlier timed failures do not recur after the merge. Change no time limit or test work. Log: `scratchpad/lanes/prev-green-cards/unit-1.txt` in the task scratch folder.

Focused M1 checks at repair commit `987c6559`:

- `src/workshop/powers.test.ts`: 8 pass; no failure or skip. Time: 0.232 seconds. Log: `unit-powers-1.txt`.
- `tools/plugin-profile.test.ts`: 23 pass; no failure or skip. Time: 34.31 seconds. The locked-entry test passes. Log: `unit-profile-1.txt`.

Both logs are in `scratchpad/lanes/prev-green-cards/` in the task scratch folder. The local `npx tsc --noEmit` and `git diff --check` also pass. No guard, assertion, time limit or STEP is removed or reduced. The two test expectation repairs share one kind-a commit. No kind-b or kind-c repair is needed. No screen changes, new captures or new taste choices are needed in this step.

Final M1 suite at repair commit `987c6559`: exit 0. Files: 186 pass, no failure, 12 skip. Tests: 3,135 pass, no failure, 164 skip. Time: 347.74 seconds. Log: `scratchpad/lanes/prev-green-cards/unit-2.txt` in the task scratch folder. Search (18 tests), judge (12), card pictures (8), and Profile (23) all pass. The earlier search and judge timing failures do not recur in either full M1 run. This lane changes neither file.

Skip detail: 156 checks need PostgreSQL. Another 8 balance drift checks require `KINGDOWN_BALANCE_DRIFT`; the default suite leaves them off on both branches. No skip is added. This step uses only the required M1 unit helper. It runs no local `npm test`, browser check or capture. Browser checks remain with CI, as `prev-green` requires. The prior preview browser proof is recorded above.

All five previews remain built. No repair is left open. The merge keeps both test sets at its one conflict. The final check of the repair diff finds no smaller complete change: one exact art list and three rendered-label expectations. The final record commit changes this ticket only. The owner still approves the previews before a merge to main.

## Review fix plan: prev-green-cards

Review A has three confirmed faults. Review B has no finding text.

1. A35: read the saved turn and failed request before the draft turn. Test an ordinary move with an unused card and a failed send. The sheet must name Retry.
2. A35: update the open card action and reason when the page lock changes. Keep the sheet open through three failed background reads and a good read at the same revision. Use must leave and return in that sheet.
3. A33: put each Spawn K pawn on a different square next to the king. Test the shown squares against legal engine moves for Spawn K and Spawn K2.
4. Run the focused tests, then `npm test` on this Mac with the local test database. Commit the fixes before the required `plugin-ui` runner. Record the check results and final head. Change no server code, time limit or game rule.

Pass criteria: each new test rejects the old fault and passes with the fix. The full unit suite, type check, diff check and required browser check pass. The owner still approves each preview before a merge.

## Review fixes: prev-green-cards

- Review A, finding 1, A35: confirmed. A staged ordinary move changes the draft turn before the send. The reason now checks the request state first and uses the saved view for the other turn. The model and board tests cover a failed move send with an unused Haste card. The draft alone gives the finish-turn line.
- Review A, finding 2, A35: confirmed. The open sheet now updates its action and reason during a board refresh. It keeps its face, rule and diagram. Close clears the update function. A focused Use action that leaves puts focus on Close. Board tests keep a sheet open through three failed quiet reads and a good read at the same revision. They also cover a sheet first opened during the failure and check that the returned Use action arms the card. The browser check covers the timed background reads and the failed turn send.
- Review A, finding 3, A33: confirmed. Spawn K shows one pawn beside the king. Spawn K2 shows two pawns on different squares beside the king. The test maps the drawn coordinates to board squares, finds the legal engine drop and checks the new pieces after that move. The browser check saves both Workshop views at phone and desktop sizes in both themes.
- Review B: no finding text is supplied. There is no claim to confirm or refute.

The type check, script syntax check and diff check pass. The first focused test stays in the shared test queue and starts no test. This lane stops that one owned queue process and starts the required full `npm test` with the local test database. The full suite is in the shared queue. No other process, test limit or check limit changes.

The final code check finds no smaller complete fix. The sheet uses one update function and changes only its action or reason. The engine and game rules have no change. The unit and browser results follow below.
