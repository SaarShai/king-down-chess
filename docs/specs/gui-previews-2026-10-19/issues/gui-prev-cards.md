# GUI previews 2026-10-19: cards: art, faces, coins, reasons, collection

Status: in-progress
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
