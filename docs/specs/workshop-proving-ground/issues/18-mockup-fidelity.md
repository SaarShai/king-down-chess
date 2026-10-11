# 18 · Mockup fidelity

Status: ready-for-agent
Size: M
Blocked by: 02 to 08

## Scope

- A pass over tickets 02 to 08: the build must look and read as the approved mockup A (`mockups/proving-ground.html`).
- The rule for this pass (by delegation, owner, 2026-10-09: the approved mockup wins on looks and words): match the mockup. Two exceptions: the mockup's mark is wrong for the real rules (then the engine wins, and this ticket says why), or a Comment of an earlier ticket records a reason that still holds.
- The gaps come from the W14 renders beside the mockup states (the render pairs of the owner's review, 2026-10-10).
- Keep: the auto name of a new piece (names must be distinct on the ledge; ticket 07), the 7 items of the phone's ⋯ menu (today's features), the tray with 2 tokens until tickets 13 and 14.
- States to compare, at 1440 × 900 and 390 × 844: `paint`, `painted`, `stamp-preview`, `stamped`, `hero`, `why-g7`, `beast-cancel` with a tap on e5, `beast-hover` (the mockup's `beast`), `asleep-b4`, `awake-e2`, `new-piece` (the mockup's `open`, then NEW), `phone-why`.

## Plan

1. [x] **The stamps of a line rule** (gap 1; ticket 04, change 10). `src/workshop/scene.ts`: on the board, a square that a line crosses but does not end on gets no stamp. A rule that wakes lines ("moves like" while its When holds) puts its stamp on the piece; on the last square of its line, its stamp shows only beside the stamp of another rule (d8 and h8 with "becomes"). The Why tag reads every rule of a mark from its `by`, so its sum keeps each rule (the mockup's d6 and g4 tags).
2. [x] **Stamps that the mockup does not show** (gap 4). The Paladin's d6: step 1 removes it. "Takes again" on the Beast: a next take of a chain gets no stamp of "takes again" (the hop and the order pip show the chain); the first take (e5) and the refused next take (g7) keep it, as the mockup's `beast` scene does. For the same reason a push or a swap gets no stamp on a mark that it does not refuse (its arrow shows it; the mockup's `ogre` has no stamp on d5).
3. [x] **The Why tag captions** (gap 2). `src/workshop/why.ts`: the captions of the mockup's Why data (`proving-ground.html:735-751`, `scenes.js` `why`): "passes own pieces", "cannot take a king", "removed after anything", "removed too", "takes again", "like a queen, on a center square", "becomes", "swaps with a friend"; a painted square next to the piece is "step", a painted shot is "shot: 2 away"; the mark of "steps 2" is the base "step 2" (dashed) with the caption of its When ("on its start rank"); a mark on a line of "moves like" has the base "line"; a move that becomes a piece is "moves, then becomes".
4. [x] **The notes** (gap 3). The Beast's e5: "It takes e5, then f6. Never the king on g7." My Beast (removed after anything), e5: "It leaves at once, so Takes again never fires." (a cracked knot: one rule stops the other).
5. [x] **Promotion** (gap 5). `scene.ts`: a `becomes` effect on each square where a move becomes a piece, with the pieces of those moves. `src/workshop/marks.ts`: the faint fan of their icons at the foot of the square (`becomesFan`, `marks.js:596`). `src/workshop/ground.ts`: the key row's "Becomes" tile (`proving-ground.html:1210`).
6. [x] **The knots of Try with** (gap 6). The knots belong to the design: `ground.ts` takes them from the design on its example board, so a lift to b4 or e2 keeps the gold bracket between "moves like" and "becomes" (the mockup's `asleep-b4` and `awake-e2`).
7. [x] **The phone's Why sheet** (gap 7). `src/workshop/ground.css`: the actions ("Move here") come 14 px under the note, as the mockup (`proving-ground.html:504`), not at the foot of the sheet.
8. [x] **Undo and Weigh** (gap 8). W14 `beast-cancel` reaches My Beast by a rule change (the pill "a piece, not a pawn" to "anything"), as the mockup's state does, so the top bar says "Undo rule". The name row keeps "My Beast", its Yours tag and Weigh on one line at 1440 × 900.
9. [x] **The look row** (gap 9). On the desktop, the look row (3 figures and More) shows only for a piece that the player made with NEW (no pool piece in its `from`), as the mockup (`proving-ground.html:1052`). A pool piece and its copy reach Look in the ⋯ menu.
10. [x] **Mirror of a new piece** (gap 10). A design with no pool piece starts on "Mirror", as the mockup (`S0`, `mirror: 'lr'`).
11. [x] **The "Try board" tag** (gap 11). The plaque also shows after the first edit (the mockup's `painted` and `stamped`). NEW does not count as an open item, so the plaque waits on NEW in brush mode (the mockup's `S.opened` does not change on NEW, `proving-ground.html:2008`).
12. [x] **The chalk of a preview** (gap 12). While the shelf or a choice previews a rule, the board shows the chalk of each zone that the preview adds: the 4 center squares for "moves like a queen, on a center square" (`proving-ground.html:1146`, `:829`), on the desktop and on the phone.
13. [x] **The paint pips under "moves like"** (seen in the `stamp-preview` and `stamped` pairs). `diffOf` compares a mark that "moves like" does not make with the pool piece's paint without that rule, so My Pawn's c5 and e5 keep their quill pips when the queen lines wake (the mockup's `paintDiff`, `proving-ground.html:875`: a mark that a rule makes has no pip).
14. [x] **W14 states.** `stamp-preview`, `stamped` and the other states of the rules (ticket 03) start from My Pawn with Both painted on c5 and e5, as the mockup's states do. `beast-cancel` as in step 8.
15. [x] **Tests and checks.** `why.test.ts`: the full captions and notes of the hand Why data. `scene.test.ts`: the stamps of My Pawn with "moves like a queen" (d4, d8 and h8), the Paladin (d7, a1 and g7), the Beast (e5 and g7) and the `becomes` fan. `tools/verify-proving-ground.mjs`: the assertions that read the changed words, stamps, look row and Mirror.

## Verification

- [x] `npm test` passes (through the lock script).
- [x] `npm run check:browser proving-ground` passes three times.
- [x] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's states; the differences that stay are in the Comments with their reasons.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The stamps on a line are a look choice: the Why tag must keep every rule, or a player loses the reason for a mark.
- A knot from the example board can name squares that are not on the Try board now (the mockup does the same).

## Does not do

- No game rule change. No change to the legend (`src/render/legend.ts`).
- No new item in the phone's ⋯ menu, no new token in the tray, no change to the auto name.

## Comments

### 2026-10-10 · built on `claude/proving-ground`

Evidence (the logs and the renders are outside Git, in `S` = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/18-fidelity/`):

- `npm test` through the shared lock: `S/npm-test-3.log` (the final code): exit 0; 115 test files pass (1 skipped), 1,894 tests pass (21 skipped); the node tests, 50 of 50.
- `npm run check:browser proving-ground`: run 1 (`S/logs/check-1.log`) failed on the new assertion of the look row: a piece made with NEW has its own figure pressed, so the row has 1 pressed figure, not 0. The assertion now expects 1 and picks the first figure that is not pressed. Then 3 runs pass on the same code: `S/logs/check-2.log`, `check-3.log` and `check-4.log` (54.6 s, 55.1 s and 54.8 s; "proving-ground: all groups pass" in `check-N.proving-ground.log`).
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5183/ S/w14`: 84 renders, 0 with a fault (`S/logs/w14.log`).
- Beside the mockup, at 1440 × 900 and 390 × 844, from the same server with reduced motion: `S/pairs/<state>-1440x900-build.png` beside `S/pairs/<state>-1440x900-mock.png` (and `390x844`), and both in one image, `S/pairs/side-<state>-1440.png` and `side-<state>-390.png` (the build on the left). The states: `paint`, `painted`, `stamp-preview`, `stamped`, `hero`, `why-g7`, `beast-cancel` (the tag of e5 is open in both), `beast-hover` (the mockup's `beast`), `asleep-b4`, `awake-e2`, `new-piece` (the mockup's `open`, then NEW) and `phone-why` (the mockup's `open`, then a tap on d6). The script: `S/probe/pairs.mjs`; the pairs come from the final code, with no page error (`S/logs/pairs.log`).
- The words of the Why tag for the squares of the mockup's Why data: `S/probe/why.js` (run by `S/probe/mod.mjs` on the dev server). The stamps of each hand scene against the build: `S/probe/imps.js`: all 16 scenes are the same.

Changes, each with its reason (the gap numbers are those of the task):

1. Gap 1. The board stamps of a line rule follow the mockup's `mypawn-queen` scene (`scenes.js`): "moves like" stamps the piece on d4, and on the line ends only d8 and h8, beside "becomes". A square that a line crosses has no stamp. The Why tag still sums each rule of the mark's `by`: the tag of g4 has "like a queen, on a center square", as the mockup's Why data.
2. Gap 4. The Paladin's d6: the trace is right ("its lines pass" makes d6), but the mockup stamps only the last square of a line (`scenes.js`, `paladin`: d7, a1 and g7). So the stamp goes, and the tag of d6 keeps "passes own pieces", as the mockup's `d6` data. "Takes again" on the Beast: the mockup's `beast` scene stamps e5 (the first take) and g7 (the refused king, on e5), so these stay. Only f6 loses it: its hop and its order pip show the chain. With the same reason, a push or a swap has no stamp on a mark that it does not refuse (the mockup's `ogre` has no stamp on d5). The scene test now compares the stamps of each hand scene.
3. Gap 2. The captions are the words of the mockup's Why data (`proving-ground.html:735-751`): "passes own pieces", "cannot take a king", "removed too" ("a piece, not a pawn") and "removed after anything", "like a queen, on a center square", "becomes". A painted square next to the piece is "step"; a painted shot is "shot: 2 away", and its mark now "takes, stays on d4". The base of "steps 2" is the dashed step, "step 2", with the When as the rule's caption ("on its start rank"). The base of a mark on a "moves like" line is that line ("line"); the trace takes the base from the piece that the rule names. A move that becomes a piece is "moves, then becomes".
4. Gap 3. The Beast's e5: "It takes e5, then f6. Never the king on g7." My Beast, removed after anything, e5: "It leaves at once, so Takes again never fires." (from the cracked knot). The note "It takes a knight and stays." of a shot goes: the mark now says it ("takes, stays on d4"), and the mockup's Archer has no such note.
5. Gap 5. The fan of "becomes" on d8 and h8, at the foot of the square (`becomesFan`, `marks.js:596`), and "Becomes" in the key row after Line, as the mockup's key row (Sometimes, Line, Becomes). The engine wins on the pieces: the fan shows the pieces of the moves, so "a piece you choose" shows the queen, the rook, the bishop and the knight (as the mockup), and a pill with one piece shows that piece only (the mockup always shows four).
6. Gap 6. The knots come from the design on its example board. A lift to b4 or e2 keeps the gold knot "Both shape d8 and h8." between "moves like" and "becomes", as the mockup's `asleep-b4` and `awake-e2`.
7. Gap 7. On the phone, "Move here" is 14 px under the note (`proving-ground.html:504`).
8. Gap 8. W14 `beast-cancel` opens My Beast (removed after a piece), changes the pill to "anything" and taps e5: the top bar says "Undo rule". The name row has a 6 px gap and Weigh 8 px sides: "My Beast", its Yours tag and Weigh fit the 328 px band (170 + 6 + 61 + 6 + 80).
9. Gap 9. On the desktop, the look row shows only for a piece with no pool piece in its `from` (made with NEW). A pool piece and its copy have Look in ⋯ (desktop: Look, Copy as text, Make a copy). The phone's ⋯ keeps its 7 items.
10. Gap 10. A design with no pool piece starts on Mirror.
11. Gap 11. The plaque also shows after the first edit. NEW does not count as an open item, so the plaque waits on NEW in brush mode, as the mockup.
12. Gap 12. While the shelf or a choice previews a rule, the chalk of the zone that the preview adds shows (`data-pv`), on the desktop and on the phone.
13. Seen in the pairs, not in the gap list: after "moves like a queen", My Pawn's c5 and e5 lost their quill pips (with the queen lines, the Pawn's own paint also gives Both there). The mockup keeps them (`paintDiff`: a mark that a rule makes has no pip; the paint's change keeps it). `diffOf` now compares a mark that "moves like" does not make with the pool piece's paint without that rule.
14. W14: `stamp-preview`, `stamped`, `pill-open`, `when-open`, `three-of-three`, `phone-sentence`, `asleep-b4` and `awake-e2` start from My Pawn with Both painted on c5 and e5, as the mockup's states. `beast-cancel` as in change 8. On the desktop, `design-menu` now has Look in ⋯.
15. The changed assertions of `tools/verify-proving-ground.mjs` have `Removed-check:` trailers in the commit (spec rule 7).

Differences that stay, with the reason:

- The rule lines with a pill or a chip are taller than the mockup's: each pill and chip keeps a 44 px target (spec decision 9).
- An enemy on a take square shows the owner's legend tile (decision 2), not the mockup's red ring on a dark square.
- The Why tag has no step boards (the mockup's Paladin d7): spec "Later" (ticket 05, "Does not do").
- The desktop's top bar has ⋯ (decision 16, ticket 07). The ledge has no Kings, Cards and Rules tabs, and the tray has 2 tokens (tickets 12 to 14).
- The new piece keeps its auto name ("Dawn Spirit", ticket 07) and the look row of 3 figures and More (decision 17); the mockup shows "New piece" and 8 figures.
- `phone-why`: "Show on d2", not the mockup's "Show on e2": the engine wins (`wakeSquare` takes the same file first, ticket 06). The mockup shows an empty frame as the icon of an empty square; the build shows no icon.
- During the preview, the build keeps the quill pips on c5 and e5; the mockup's preview scene is a hand scene with no pips. A copy always shows how it differs (`proving-ground.html:871`).
- My Beast removed after a piece (not a W14 state): the mockup's Why data of e5 adds "removed after f6", but the scene's e5 has only "takes again" in its `by` (`scenes.js`, `mybeast`). The tag keeps the `by`, and the note says "After the knight on f6, it is removed too."
- The Ogre's d5 (not a W14 state): the mockup's tag has 1 part ("takes", "or pushes to d6"); the build's tag sums the push rule of its `by` (2 parts).
- In the `stamped` render, the pointer is still over a rule line after Stamp, so that line shows its × (a hover state of ticket 03).

Open problems:

- The owner has not seen the renders (the last Verification box).
