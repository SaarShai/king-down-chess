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

1. [ ] **`src/workshop/moves.ts`: refusals.** `takes()` (`:62`) returns null or a reason: `{ why: 'cannotTake', rule }` or `{ why: 'guardImmune' }` (a table rule, `RULES.guardImmune`). `movesOf(d, board, from, st, refused?)` takes an optional sink of `{ sq, why, rule? }` and fills it at the takes on squares (`:68`), on lines (`:75`), the shots (`:104`), the chain "never a king" (`:93`) and push and swap "never a king" (`:123`). With no sink, nothing changes.
2. [ ] **`src/workshop/why.ts` (new), pure: `traceOf(d, board, from, st): Trace`.**
   - Runs of `movesOf`: all rules; each rule removed (at most 3); each pair removed (at most 3).
   - The signature of a square: its kinds (move, take, shot, push, swap) and flags (`selfRemove`, `promo`, chain step), with each move keyed by `clickPath` (`src/marks-model.ts:40-48`).
   - `by`: the rules whose removal changes the signature, with `+` (adds the mark), `-` (refuses or removes it) or `~` (changes it, for example "removed too").
   - `base`: the painted square (the offset, mirrored for Black) or the painted line through the square.
   - `refused`: from the sink, with the rule or the table rule.
   - `knots`: gold when one square needs two rules; cracked when one rule changes nothing while another rule is in, and changes a square when that rule goes (the Beast: "removed too" stops "takes again").
   - The forced-When runs for asleep marks stay in `scene.ts` (ticket 01).
   - Cost: 7 runs for the Paladin take about 0.022 ms in all (measured 2026-10-10 on this Mac). No timing test.
3. [ ] **`src/workshop/scene.ts`:** `sceneOf` adds `by` on marks, `impressions` (the stamps; two, then "+N"), `blocked` marks and the rail end `blocked`, `knots`, and `chalk` (the When's zone).
4. [ ] **`src/workshop/marks.ts`:** port `impression` and `impsOnSquare` (`marks.js:476-503`), `knot` (`:758`) and `chalkMarkup` (`:619-647`, the zone chalk). The refused forms stay in this port, because the legend (`src/render/legend.ts`) has none: `bar` (`:242`), the `blocked` and `blocked-move` tiles, and the rail's barred end.
5. [ ] **`src/workshop/ground.ts`:**
   - Stamps on the marks; grey barred marks for refused targets.
   - Isolate: hover or focus on a rule line or seal shows only that rule's marks (the others at 25 %), with the zone chalk; a tap keeps it (the other lines at 45 %); a second tap or Esc stops it.
   - Knots in the 22 px gutter of the lines, with a hit area of 24 px or more (spec decision 9). A tap on a knot shows its words as a toast (`proving-ground.html:1941`). On the desktop, isolating a rule that has a gold knot also shows that knot's words (`:1640-1643`); the mockup does not do this on the phone.
6. [ ] **Tests:**
   - `src/workshop/why.test.ts` (new): with the `scenes.js` boards (loaded as in ticket 01), the `blocked` marks of the scenes (`get(id).marks`; `check()` holds them equal to G22: Paladin g7, `scenes.js:357`; Beast g7, `:362`; Ogre c3, `:364`); the `by` fields of the Paladin, Beast and My Beast scenes; a gold knot on the Paladin; a cracked knot on `mybeast-any` (the `beast-cancel` state, `scenes.js:208-214`); no knot for two rules that never meet.
   - `src/workshop/moves.test.ts`: with a sink, the move list is the same as with none.
7. [ ] **Check groups:** `refused` (the Paladin's g7 is grey with a bar and the "cannot take a king" stamp), `isolate` (hover dims the others; a tap keeps it; Esc), `knots` (a tap shows the words; on the desktop, isolating the Paladin's rule III shows its gold knot's words; the knot's hit area is 24 px or more).
8. [ ] **W14 states:** `hero`, `hero-i1`, `hero-i2`, `hero-i3`, `beast-cancel`.

## Verification

- [ ] `npm test` passes, with `why.test.ts` and the sink case in `moves.test.ts`.
- [ ] `npm run check:browser proving-ground` passes three times.
- [ ] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `hero`, `hero-i1` and `beast-cancel` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- A removal shows influence, not order: a rule that works only with another rule shows on both.
- The engine's own refusals (shelters, capital, marks) are not in `movesOf`; they need `captureRefusal()` (spec, "Later").

## Does not do

- No Why tag (05). No engine change. No threats (06).
