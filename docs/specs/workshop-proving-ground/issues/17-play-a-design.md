# 17 · Play a design in a game (later)

Status: done
Size: L
Blocked by: 16; step 5 also needs 13 and 14
Later: not needed for v1; it needs ticket 16, a place in New game, a figure on the game board and an AI value.

## Scope

- A player brings one of their designs into a game against the computer or a friend.
- With ticket 16, powers and cards also work on designs in the Workshop (decision 31 ends).

## Plan

1. [x] **New game:** a "Bring a design" choice that puts one design in place of one back-rank piece; `RULES.design` comes from the design. A link game carries the design code.
2. [x] **Board and text:** the painted board draws `T` with the design's figure (`src/render/PaintedView.ts:85` has no figure for `T`); `src/read.ts:171`, `:197` describe the design, not the Templar.
3. [x] **AI:** the worker sets the value of `T` from `judge(d, false).worth.point` after `setRules` (ticket 16, step 5).
4. [x] **Refusals:** a design with `fromMove`, `beforeMove` or `afterCard` cannot play yet; the chooser says why.
5. [x] **Workshop:** the King socket and the card slot (tickets 13 and 14) also work on copies and new pieces.
6. [x] **Checks:** groups in `new-game` and `painted-game`; a self-play unit test of a few short games with a design (as `src/ai/search.test.ts:124-144`).

## Verification

- [x] `npm test` passes.
- [x] `npm run check:browser` (all checks) passes; the plugin checks by name, with the page size.
- [x] Renders of New game and a game with a design at 1440 × 900 and 390 × 844; the owner sees them before the merge. Owner, 2026-10-11: "yes" (the painted board; the clay look is parked, owner the same day).
- [x] No game run without the owner's go.

## Risks

- AI strength with a flat square table for `T` (`src/ai/eval.ts:287`).

## Does not do

- No two designs in one game. No history Whens in games.

## Comments

### 2026-10-11 · built on `claude/pg-design`

The owner approved this work on 2026-10-11 ("3. resolve all"). The New game choices below are delegated UX choices, not the owner's yes; the owner sees the renders before the merge.

What the build does, step by step:

1. **New game:** a "Bring a design" choice under the computer level, in the look of the dialog's army choice: a labelled select (44 px high, reached by Tab from the level) and a grey line under it. The list holds "No design" and the designs on this device (the Workshop shelf). `Setup.design` holds the share code; `parseSetup` keeps it only when the code still parses and plays, so a setup from before this ticket has no design. On Start, `newGame` (`src/screen/play.ts`) sets `RULES.design` with `parseRule('design=<code>')`, and `withDesign` (`src/new-game.ts`) puts `T` in place of one back-rank piece on each side. A rematch keeps the rules and the army. The army strip shows the design's figure in its place. A game link carries `?design=<code>` (`gameUrl`); `main.ts` sets the rule before the first game, and opens the Workshop for `?design=` only without a game link.
2. **Board and text:** the painted scene gets `setFigure(type, urls)`: a lab type with no painted art draws the given figure in place of its lettered token (`docs/2d-first-pieces/board/scene.mjs`). `PaintedView.sync` gives it the design's Workshop figure (`selectedFigure`). The clay board draws the same figure as a billboard (`spriteMesh` takes an image URL). `nameOf(t)` (`src/rules/engine.ts`) gives the design's name for `T`; the read, the move words, the turn summary, the screen-reader square words and the table use it. `pieceGuide(T)` and `readText` describe the design with the Workshop's own sentences (`describe`, `src/workshop/text.ts`).
3. **AI:** the worker already set the worth of `T` (ticket 16). The page's own search (no worker, `src/game.ts`) now does the same.
4. **Refusals:** a design with a When that counts moves or cards is in the list, disabled, with the reason: "Late Queen (not yet: a rule counts moves or cards)". `HISTORY_WHENS` (`src/rules/rules.ts`) is the one list that `setRules`, New game, the game link and the Workshop read.
5. **Workshop:** the King socket and the card slot work on copies and new pieces. The design plays as `T` inside `withRules` (`powerMarks`, `cardMarks`, `playPower`, `playCard` take the design). A design whose rule counts moves or cards keeps the socket and the slot shut, with "Powers wait: a rule of this piece counts moves or cards." and "Cards wait: …".
6. **Checks:** see Evidence.

Changes from the plan, each with its reason:

1. **Which piece the design replaces:** the back-rank piece (not the king) whose worth is nearest the design's judge worth, the left one on a tie; both sides get one (the army is the same for both sides). Reason: the shortest rule that keeps the material near even, with no new control in the dialog. A random army thus changes which piece goes, and the line says "in place of the piece nearest its worth". An Ogre practice position (`?fen`) takes no design.
2. **The figure, not the body:** in a game the design always stands as its Workshop figure (`selectedFigure`), also when the player chose a pool body in the Workshop. Reason: a design with a queen's body would look like the real queen on the same board.
3. **The share code rides in the rule:** `DesignSpec` gets an optional `code` (set by `parseRule`); the engine does not read it. Reason: the autosave, the account save, a rematch and a game link then keep the name and the figure with no new save field. `playedDesign()` (`src/rules/rules.ts`) parses it once per code.
4. **The Try board stays out of a game's design** (review of ticket 16, items 9 and 10): `tryBoard` (`src/workshop/moves.ts`) clears `RULES.design` while `movesOf` and the threat eye run, so a game's design never changes the Try board. The main-thread search sets the worth of `T` (step 3).
5. **Leap and Vault on a design are an echo:** the engine's Leap and Vault move only a rook, a bishop or a queen (`engine.ts`, case 'Leap'). On a copy the Workshop shows "= Leap adds nothing", as a game plays it. Freeze, Ice Wall and the other powers that do not ask the piece type work.
6. **`src/sim/game.ts` still does not set the worth of `T`** (ticket 16, change 10): no simulation runs a design yet, and a run needs the owner's go.
7. Not done: the painted letter labels (`?labels=1`) show `T` for a design, not its own letter; the "All rules" card has no design card. Both are small follow-ups.

Evidence (the logs are outside Git, in `/tmp`):

- `npm test` through the shared lock: run 1 (`/tmp/pg17-test1.log`) had 4 failures, all in the new tests or in a test that the new `code` field changes: two test designs had no `letter`, so `parseDesign` refused their share codes; `design.test.ts` expected a spec with no `code`; and Leap on a copy gave no mark (change 5). Run 2 (`/tmp/pg17-test2.log`): exit 0; 117 test files pass (1 skipped), 1,910 tests pass (21 skipped); the node tests, 50 of 50. Run 3, with this ticket text (`/tmp/pg17-test3.log`): exit 0; the same counts.
- `npm run check:browser` (all): all 25 pass (`/tmp/pg17-checks-all.log`, `pg-design-KVI1lS`). An earlier run by name (`/tmp/pg17-checks1.log`) found one fault in the new `new-game` group (`startGame` picks the Random army by default, so the group now names the army) and stopped `workshop` only because a file changed during the run; its groups all passed.
- `npm run check:browser plugin-ui plugin-ui-http`, with the local test database: both pass (`/tmp/pg17-plugin.log`). The plugin page (`node tools/plugin-ui-build.mjs`): 4,306,624 bytes before (HEAD), 4,311,661 bytes after (+5,037), below the 4,350,000-byte line.
- `npm run balance:check`: 98 rule axes, 0 errors (`/tmp/pg17-balance.log`).
- Renders (outside Git): `scratchpad/build/owner4/play-design/`: `01-new-game-1440x900.jpg` and `02-new-game-390x844.jpg` (before left, after right), `03-game-1440x900.jpg` and `04-game-390x844.jpg` (a game with Old Ward, painted left, clay right; no before, as no game could play a design). The owner sees them before the merge.
- No game ran. The self-play unit test (6 short games with a design) is a unit test.

### 2026-10-11 · Reviews

The review (`scratchpad/build/review-17.md`) had 9 findings. I checked each against the code.

1. **must-fix, confirmed:** a design with no move was an enabled choice, but `parseDesign` refuses its code, so Start threw after the dialog closed. Fix: `refusal` says "it has no move" first (`src/new-game.ts`); the option is then disabled and `parseSetup` drops it. A unit test in `src/new-game.test.ts`.
2. **should-fix, confirmed:** with a design link, Cancel on "Open the game from this link?" still gave `urlRules` true, and `restore` dropped the saved game, because `GAME_RULES` held the link's design. Fix: `urlRules` counts the design only when the link opens (`openLink && linkDesign`, `src/main.ts`).
3. **should-fix, confirmed:** the clay `sync` kept a `T` mesh when the design changed and the code and square stayed. Fix: `spawn` keeps the figure id in `userData.design`, and `sync` compares it (`designFigure`, `src/render/renderer.ts`).
4. **should-fix, confirmed:** the Custom prompt starts from the current back rank, which holds `T` after a design game, and `withDesign` changed a second piece. Fix: `withDesign` keeps a back rank that holds `T`. A unit test.
5. **should-fix, confirmed:** the painted-game check waited only for the figure's network request. Fix: the check counts the pixels of the white token's disc (#efe9d8) on b1 and asserts fewer than 26 of 256. Evidence: with `figureOf` broken on purpose, the group fails with 160 of 256 (`/tmp/pg17r-broken.log`); with the real code it passes.
6. **nit, confirmed, fixed (one line):** with Ogre practice the line now says "Ogre practice takes no design."
7. **nit, confirmed, not fixed:** the worth of `T` is set in two places (`src/ai/worker.ts`, `src/game.ts`). One shared helper costs more than one line; a follow-up.
8. **nit, confirmed, not fixed (a decision):** "The My Rook …" and "This Old Ward …" keep the article. Removing it touches each sentence in `read.ts` and `previously.ts`; the owner can ask for it.
9. **nit, confirmed, not fixed:** a game link with a design that this version cannot read opens as no game, with no message. This version cannot make such a link; a follow-up.

Evidence of the review fixes: `npm test` through the shared lock (`/tmp/pg17r-test.log`): exit 0; 117 test files pass (1 skipped), 1,910 tests pass (21 skipped); the node tests, 50 of 50. `npm run check:browser painted-game new-game workshop` (`/tmp/pg17r-checks.log`, `pg-design-XoC6oQ`): all 3 pass.

### 2026-10-11 · Render review fixes

The lead reviewed the renders `03-game-1440x900.jpg` and `04-game-390x844.jpg` and found two items.

1. **must-fix: the design's side did not show.** On the clay board, Black's Old Ward on b8 was a pale painted figure, as White's on b1; on the painted board, it was lighter silver than the other black pieces. Fix:
   - Clay: the design stands as White's figure, made grey and painted with the side's light clay colour (`CLAY_PALETTES`, now one shared list in `src/render/ClayFigure.ts`): cream for White, blue for Black. `spriteMesh` takes an optional `tint` (`src/render/sprites.ts`). Reason: the clay pieces are one sculpt in two clays, so one figure in two clays reads the same way. A pixel loop makes the grey, not the canvas `filter`, which older Safari does not draw.
   - Painted: the scene darkens Black's figure to a mean of at most 70 a channel (the median of the 34 black Workshop figures; `token`, `docs/2d-first-pieces/board/scene.mjs`). A figure that is already dark stays as it is. Reason: the black figures span a mean of 45 to 163, so one fixed factor makes some of them black and leaves others light.
2. **should-fix (review nit 8): "The My Rook …".** A design's name now takes no article. `theName(t, article)` (`src/rules/engine.ts`) gives "the rook" for a pool piece and "My Rook" for the design. These sentences use it: `whyNot` and the "has no legal move" note (`src/read.ts`), the shove, swap, take, morph, leave and Haste words (`src/move-text.ts`), the Rescue, push and promotion words (`src/previously.ts`), and the Workshop's echo note (`src/workshop/ground.ts`, the article stays for a pool piece; the `workshop` check expects "= Leap adds nothing to My Paladin."). The colour phrases ("freezes the black Old Ward on b8") keep the article, as it goes with the colour. Unit tests: `src/read.test.ts` asserts "My Rook cannot reach e5." and "White rook d1 to d4, taking My Rook on d4."

Renders (outside Git, `scratchpad/build/owner4/play-design/`): `03-game-1440x900.jpg` and `04-game-390x844.jpg` again (same states, same labels), and `05-rows-7-8-zoom.jpg` (rows 7 and 8, before left, after right, painted top, clay bottom). The owner sees them before the merge.

Evidence (the logs are outside Git, in `/tmp/pg17c/`):

- `npm test` through the shared lock, run 1 (`test1.log`): exit 0; 117 test files pass (1 skipped), 1,910 tests pass (21 skipped); the node tests, 50 of 50. Run 2, with this ticket text and the check change (`test2.log`): exit 0; the same counts.
- `npm run check:browser painted-game new-game workshop visual-design`, run 1 (`checks.log`): 2 of 4 failed. `painted-game` stopped only because this ticket changed during the run. `workshop` expected the old sentence "= Leap adds nothing to the My Paladin."; the check now expects "= Leap adds nothing to My Paladin." (`tools/verify-workshop.mjs`); the pool piece's "the Paladin" stays. Run 2 (`checks2.log`, `pg-design-d0irid`): all 4 pass.

### 2026-10-11 · Review of the render review fixes

The review (`scratchpad/build/review-17b.md`) had no must-fix item, one low item and two nits. I checked each against the code.

1. **low, confirmed, fixed:** the Sacrifice sentence said "brings back a My Rook there", and pool pieces got "a archer" and "a ogre" (`src/move-text.ts`). Fix: the `article` helper moves from `src/previously.ts` to `src/rules/engine.ts` as `aName(t)` ("a rook", "an archer", or the design's name). The Sacrifice, morph and promotion words use it. Unit tests in `src/read.test.ts`: "brings back My Rook there." and "brings back an archer there."
2. **nit, confirmed, not fixed:** the clay tint for Black's design is `CLAY_PALETTES[1].light`, paler than the black sculpts. The reviewer says it reads as Black, and a new colour is a visual change that needs new renders for the owner. A follow-up if the owner asks.
3. **nit, confirmed, fixed:** `validName` accepts a name in lower case, so "old ward cannot reach e5." started with a small letter. Fix: `theName` makes the first letter of the design's name a capital when the article starts with a capital ("The", "This"). Unit test: "Old ward cannot reach e5."

Renders: not made again. The fixes change only screen-reader and notice sentences, and no image in `owner4/play-design/` shows them.

Evidence (the logs are outside Git, in `/tmp`): `npm test` through the shared lock (`/tmp/pg17d-test1.log`): exit 0; 117 test files pass (1 skipped), 1,910 tests pass (21 skipped); the node tests, 50 of 50. The new asserts are in an existing test, so the count stays the same. `npm run check:browser painted-game workshop` (`/tmp/pg17d-checks.log`, `pg-design-z2n6cq`): both pass.
