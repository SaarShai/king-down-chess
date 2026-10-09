# 19 · Tricks and seals

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 02c (the press and the send), 05

## Scope

- Owner choice: Menu and Extra C, the Tricks part: a wax seal for each trick a player finds, a riddle for the rest, the Tricks row only after the first trick, one gold dot once.
- Demo: `feat-menu-extra` (`TRICKS` 15–34, `trickOf` 36–58, `awardSeal` 470–505).
- Files: new `src/tricks.ts` and test; `src/main.ts` (the press handler; call lines only); `src/ui/menu.ts`; `src/account/sync.ts` and test; `src/style.css`; `tools/verify-menu-extra.mjs`.

## Plan

1. [ ] Six tricks: a bite chain (a Beast with 2 or more captures); a shot over a piece (an Archer shot with a piece between the Archer and its target, under the Archer reading in force); shove a guard (an Ogre shoves a Guard); a far swap (a Maester swaps with its king at a distance of more than 1); a king takes a guard; a second life (the Sacrifice power). Each detector reads the position before and the move, and the rules in force (spec rule 11).
2. [ ] Give a seal at the press, for the plies this device's player hands over: against the computer, your side; on one device, both sides; in a link game, your side, and only after the send succeeds. Never for the computer, in a lesson, in a replay, a link load or review. Undo before the press never leaves a seal.
3. [ ] Store found tricks in `kingdown.lessons` as `tricks`, and an unseen mark. Always write `done` too (`done: []` when no lesson is learned): the account takes a lessons copy only when it has a `done` list. The account merges `tricks` as a union, as it merges `done`.
4. [ ] On a find: the seal stamps on the Moves line, flies to the Menu button, and one gold dot stays there until the Menu opens. In the Menu, the Extra row and the Tricks row carry one dot and the line "New seal: <name>." for that visit. Motion Off: no flight; the dot still shows.
5. [ ] The Tricks page: found rows (figure, the seal with the piece icon, the name, where it was found) and riddle rows (a grey shape, the riddle). The row shows in Extra only after the first trick.

## Verification

- [ ] `src/tricks.test.ts`: each detector is true for one built move and false for its near miss (an Archer shot with no piece between; a swap beside the king; a shove of a piece that is not a Guard; a king that takes a piece that is not a Guard; a Beast move with one capture); the shot detector under each Archer reading.
- [ ] `src/account/sync.test.ts`: `done` and `tricks` merge as unions; a store with only `tricks` writes `done: []` and comes down to another device; `noteLesson()` keeps `tricks`.
- [ ] `menu-extra` check, extended: a scripted bite chain and a press give a seal, the gold dot, the Tricks row and one found row; the dot goes when the Menu opens; a reload keeps the seal; an Undo before the press gives none; a cancelled link send gives none.
- [ ] `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844 and 1440×900: the stamp, the dot, the Tricks page. The owner's yes, with the date, in Comments.

## Risks

- A false find hurts trust; the near-miss tests guard it.

## Does not do

- No crowns, no unlocks, no sharing of a trick ("Try this turn" is parked).

## Comments

- W10 phase 1 is complete: six detectors and a seal store in `kingdown.tricks`.
- Test seams: `trickOf(position, move)` and the seal store. Use legal moves and one near miss per detector.
- Plan: add each test before its code; check types; run `npm test`; commit the phase.
- Checks: all six finds pass; near misses give no seal; saved seals and the unseen mark survive a load.
- Phase 2: add the press calls, Menu dot, Tricks page, browser cases and rendered samples after W1 and W2.
- Cut: account sync and seal motion.
- Result: the type check and all 19 W10 tests pass.
- Full suite: 81 files pass, 1 skips; 1,459 tests pass, 13 skip; all 50 board tests pass. One worker and a 30 s test limit pass on the loaded Mac; normal limits give timeouts.
- Browser checks and samples wait for phase 2. The temporary test runner is removed.
