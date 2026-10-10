# 04 · Why-trace and refused targets

Status: ready-for-agent
Size: M
Blocked by: 01

## Scope

- The pure why-trace: for each square, the rules that make, change or refuse its mark (`REVIEW.md` §6 items 2 and 3).
- Refused targets with the rule that refuses them: grey with a bar, and a rail end with a bar.
- On the board: the stamps of the rules on each mark, isolate a rule, and the knots (gold, cracked; decision 12).
- Mockup states `hero`, `hero-i1`, `hero-i2`, `hero-i3`, `why-g7`, `beast-cancel`; functions `isolate` (`proving-ground.html:1633`), `placeKnots` (`:1009`).

## Plan

1. [x] **`src/workshop/moves.ts`: refusals.** `takes()` (`:62`) returns null or a reason: `{ why: 'cannotTake', rule }` or `{ why: 'guardImmune' }` (a table rule, `RULES.guardImmune`). `movesOf(d, board, from, st, refused?)` takes an optional sink of `{ sq, why, rule? }` and fills it at the takes on squares (`:68`), on lines (`:75`), the shots (`:104`), the chain "never a king" (`:93`) and push and swap "never a king" (`:123`). With no sink, nothing changes.
2. [x] **`src/workshop/why.ts` (new), pure: `traceOf(d, board, from, st): Trace`.**
   - Runs of `movesOf`: all rules; each rule removed (at most 3); each pair removed (at most 3).
   - The signature of a square: its kinds (move, take, shot, push, swap) and flags (`selfRemove`, `promo`, chain step), with each move keyed by `clickPath` (`src/marks-model.ts:40-48`).
   - `by`: the rules whose removal changes the signature, with `+` (adds the mark), `-` (refuses or removes it) or `~` (changes it, for example "removed too").
   - `base`: the painted square (the offset, mirrored for Black) or the painted line through the square.
   - `refused`: from the sink, with the rule or the table rule.
   - `knots`: gold when one square needs two rules; cracked when one rule changes nothing while another rule is in, and changes a square when that rule goes (the Beast: "removed too" stops "takes again").
   - The forced-When runs for asleep marks stay in `scene.ts` (ticket 01).
   - Cost: 7 runs for the Paladin take about 0.022 ms in all (measured 2026-10-10 on this Mac). No timing test.
3. [x] **`src/workshop/scene.ts`:** `sceneOf` adds `by` on marks, `impressions` (the stamps; two, then "+N"), `blocked` marks and the rail end `blocked`, `knots`, and `chalk` (the When's zone).
4. [x] **`src/workshop/marks.ts`:** port `impression` and `impsOnSquare` (`marks.js:476-503`), `knot` (`:758`) and `chalkMarkup` (`:619-647`, the zone chalk). The refused forms stay in this port, because the legend (`src/render/legend.ts`) has none: `bar` (`:242`), the `blocked` and `blocked-move` tiles, and the rail's barred end.
5. [x] **`src/workshop/ground.ts`:**
   - Stamps on the marks; grey barred marks for refused targets.
   - Isolate: hover or focus on a rule line or seal shows only that rule's marks (the others at 25 %), with the zone chalk; a tap keeps it (the other lines at 45 %); a second tap or Esc stops it.
   - Knots in the 22 px gutter of the lines, with a hit area of 24 px or more (spec decision 9). A tap on a knot shows its words as a toast (`proving-ground.html:1941`). On the desktop, isolating a rule that has a gold knot also shows that knot's words (`:1640-1643`); the mockup does not do this on the phone.
6. [x] **Tests:**
   - `src/workshop/why.test.ts` (new): with the `scenes.js` boards (loaded as in ticket 01), the `blocked` marks of the scenes (`get(id).marks`; `check()` holds them equal to G22: Paladin g7, `scenes.js:357`; Beast g7, `:362`; Ogre c3, `:364`); the `by` fields of the Paladin, Beast and My Beast scenes; a gold knot on the Paladin; a cracked knot on `mybeast-any` (the `beast-cancel` state, `scenes.js:208-214`); no knot for two rules that never meet.
   - `src/workshop/moves.test.ts`: with a sink, the move list is the same as with none.
7. [x] **Check groups:** `refused` (the Paladin's g7 is grey with a bar and the "cannot take a king" stamp), `isolate` (hover dims the others; a tap keeps it; Esc), `knots` (a tap shows the words; on the desktop, isolating the Paladin's rule III shows its gold knot's words; the knot's hit area is 24 px or more).
8. [x] **W14 states:** `hero`, `hero-i1`, `hero-i2`, `hero-i3`, `beast-cancel`.

## Verification

- [x] `npm test` passes, with `why.test.ts` and the sink case in `moves.test.ts`.
- [x] `npm run check:browser proving-ground` passes three times.
- [x] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `hero`, `hero-i1` and `beast-cancel` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- A removal shows influence, not order: a rule that works only with another rule shows on both.
- The engine's own refusals (shelters, capital, marks) are not in `movesOf`; they need `captureRefusal()` (spec, "Later").

## Does not do

- No Why tag (05). No engine change. No threats (06).

## Comments

### 2026-10-10 · built on `claude/pg-why`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/04-why-trace/`):

- `npm test`: exit 0. 114 test files pass (1 skipped); 1,863 tests pass (21 skipped). Logs: `logs/npm-test-1.log` to `logs/npm-test-3.log` (the last one on the final tree).
- `npm run check:browser proving-ground`: passes three times, with the new groups `refused`, `isolate` and `knots`. Logs: `logs/final-check-1.log` to `logs/final-check-3.log`, and each run's `final-check-N.proving-ground.log`.
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5184/ /private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/04-why-trace/w14 desktop,phone` makes 26 renders with 0 faults (`logs/w14-capture.log`).
- Beside the mockup, at 1440 × 900 and 390 × 844: `pair-hero-1440.png`, `pair-hero-390.png`, `pair-hero-i1-1440.png`, `pair-hero-i1-390.png`, `pair-hero-i2-*.png`, `pair-hero-i3-*.png`, `pair-beast-cancel-1440.png`, `pair-beast-cancel-390.png` (the mockup on the left, the W14 render on the right). The single renders: `mock-<state>-<width>.png`, `build-<state>-<width>.png` and `w14/<state>-<size>.png`.

Changes from the ticket, each with its reason:

1. The sink entry is `{ sq, why, caps }`, not `{ sq, why, rule? }`. `why` names the ability of the rule (or the table rule `guardImmune`), so `why.ts` finds the rule index. `caps` holds the earlier takes of a chain. A refusal with `caps` is a chain's next take, and it shows on hover only (ticket 05).
2. The rule indexes in `by`, in the knots and in the chalk are the indexes of `canonical(d).rules`: the order of the seals I, II and III.
3. The trace checks every pair of rules, so no knot is "unknown". The mockup's "Not checked yet" knots do not show. The mockup moves a knot from rule I to rule III 8 px to the left, to make room for those knots. The build keeps a single knot in the 22 px gutter; a knot from rule I to rule III beside another knot moves 24 px to the left, into a second gutter (review finding 4).
4. A stamp goes on each mark whose `by` holds a rule. So the Paladin's d6 gets the stamp of "its lines pass", and the Ogre's d5 the stamp of "push". The hand scenes leave these two out.
5. A refused mark's `by` holds only the rule that refuses it, as in the hand scenes (the Ogre's c3 has no `by` and shows only the stamp of the table rule).
6. A refused chain take (the Beast's g7) waits for its hover (ticket 05). A refused push or swap of a king shows as `blocked-move`.
7. The rail end `blocked` comes from the sink: a line ends on the first refused enemy after its reach. The rail end `none` is gone. As in the mockup, the barred end is the line to the middle of the refused square; the bar is on the mark.
8. A rail gets `by` only from an asleep or an awake rule, and an arch from "its lines pass". An isolate dims a plain line, as in the mockup.
9. The W14 state `hero` is the same as `paladin` until the why panel (ticket 05). `beast-cancel` puts My Beast (removed after anything) on the shelf with the free letter Y.
10. Only a keyboard focus (`:focus-visible`) isolates a rule. A tap also focuses the seal; if that focus isolated the rule, the rule would stay isolated after the second tap.
11. Esc uses the dialog's `cancel` event, so Esc stops the isolate wherever the focus is. A second Esc closes the Workshop.
12. On the phone, each seal is a 44 px button with the label "Rule II: <the rule's sentence>. Show only its marks." Under 360 px the seal shows at 34 px in its 44 px button.
13. Knots show on the wide layout only, because the phone has no rule lines (as in the mockup). The phone shows the stamps of the kept rule only (`boardOpts`, `proving-ground.html:1149`).
14. `tools/verify-proving-ground.mjs`: the Paladin's marks add `g7 blocked`, and the 44 px target rule leaves out `.knot`; a new rule holds each knot at 24 px or more. The commit has a `Removed-check` trailer for each.

Open problems:

- The owner has not seen the renders (the last Verification box).
- Tickets 02 and 03 (`claude/proving-ground`) change the plinth too. This ticket changes the rule line markup (`data-seal` on the line, the seal in a `.sl-seal` button) and the phone seals (buttons), so the merge touches `renderPlinth`.
- Ticket 05 shows the hover-only marks: the sink's `caps` already give the refused chain takes.


### 2026-10-10 · Reviews

An independent reviewer found four should-fix defects in `bded2847`. Each one is confirmed: a read-only script shows the failure before the fix. The scripts and the renders are in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/04-why-trace/review/`.

1. **The trace loses a capture path (`why.ts`).** Confirmed (`diag.mts`). The design has the lines north and east, "its lines pass over its own pieces" and "takes again". The piece is on d4, a friend on e4, and enemies on d6, f4 and f6. Before the fix, the `by` of f6 holds only "takes again", but the path f4-f6 needs "its lines pass". Cause: the signature of a square kept the kind of each move, not its whole click path. Fix: each square of a move gets the whole click path of that move, and a refusal gets the chain's takes before it (`caps`). Now f6 has "its lines pass" (`~`) and "takes again" (`+`). Test: `why.test.ts`, "keys each square by its whole click path".
2. **One refusal hides another (`why.ts`, `scene.ts`).** Confirmed (`diag.mts`). The design has "push" and "swap with a friend". The piece is on d4, a friendly king on e4, and f4 is empty. Before the fix, `refused` holds only the swap, the mark on e4 has only the swap stamp, and an isolate of "push" dims it. Cause: the key that removes a double refusal had no `why`. Fix: the key has `why`; `sceneOf` puts the rules and the words of each refusal of one target on one mark. Test: `why.test.ts`, "keeps each rule that refuses one target" (the refused list, the mark's `by`, the two stamps, and `drawString` isolates the mark for each rule).
3. **Esc and a second Enter leave the board isolated (`ground.ts`).** Confirmed in the browser (`repro.mjs`): Tab to the seal of rule III, Enter, Enter. `aria-pressed` is "false", but d7 stays `kdm-iso` and g7 stays `kdm-dim`. Enter and then Esc give the same result. Cause: the release cleared `focus`, but not `hover`, which the keyboard focus sets. Fix: a second tap and Esc also clear `hover`; the next hover or focus isolates a rule again. Check: the `isolate` group tests the mark classes after the second Enter and after Esc.
4. **Knots overlap and block clicks (`ground.ts`).** Confirmed in the browser (`repro.mjs`, `before-knots-1440.png`). A Paladin copy that moves like a queen on a center square, whose lines pass, that is removed too, and that has no lines of its own, has three gold knots. The knot I-III covered all of the knot I-II (`elementFromPoint` at a quarter, a half and three quarters of its height). Fix: a knot from rule I to rule III beside another knot moves into a second 24 px gutter (`.pg-lines.far`, 46 px), so each knot has its own 24 px hit area (`after-knots-1440.png`, `after-knots-1024.png`). The Paladin has one knot, so it does not change. Check: the `knots` group opens this copy, tests the 24 px targets, and taps each knot (`aria-pressed` and its words).

Evidence after the fixes (the logs are in `logs/`):

- `npm test`: exit 0. 114 test files pass (1 skipped); 1,865 tests pass (21 skipped). Logs: `logs/review-npm-test-1.log`, and `logs/review-npm-test-2.log` on the final tree.
- `npm run check:browser proving-ground`: passes three times on the final tree. Logs: `logs/review-check-1.log` to `logs/review-check-3.log`, and each run's `review-check-N.proving-ground.log`.
- W14: 26 renders with 0 faults (`logs/review-w14-capture.log`, `w14-review/`). Each desktop render is the same as before the fixes, pixel for pixel. Each phone render of the ticket's states (`hero`, `hero-i1`, `hero-i2`, `hero-i3`, `beast-cancel`) is the same within a color tolerance of 8 %. The `archer`, `beast`, `maester` and `ogre` phone renders differ only at a few anti-aliased edges (`review/ogre-diff-crop.png`).
