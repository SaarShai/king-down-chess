# 17 · Play a design in a game (later)

Status: ready-for-agent
Size: L
Blocked by: 16; step 5 also needs 13 and 14
Later: not needed for v1; it needs ticket 16, a place in New game, a figure on the game board and an AI value.

## Scope

- A player brings one of their designs into a game against the computer or a friend.
- With ticket 16, powers and cards also work on designs in the Workshop (decision 31 ends).

## Plan

1. [ ] **New game:** a "Bring a design" choice that puts one design in place of one back-rank piece; `RULES.design` comes from the design. A link game carries the design code.
2. [ ] **Board and text:** the painted board draws `T` with the design's figure (`src/render/PaintedView.ts:85` has no figure for `T`); `src/read.ts:171`, `:197` describe the design, not the Templar.
3. [ ] **AI:** the worker sets the value of `T` from `judge(d, false).worth.point` after `setRules` (ticket 16, step 5).
4. [ ] **Refusals:** a design with `fromMove`, `beforeMove` or `afterCard` cannot play yet; the chooser says why.
5. [ ] **Workshop:** the King socket and the card slot (tickets 13 and 14) also work on copies and new pieces.
6. [ ] **Checks:** groups in `new-game` and `painted-game`; a self-play unit test of a few short games with a design (as `src/ai/search.test.ts:124-144`).

## Verification

- [ ] `npm test` passes.
- [ ] `npm run check:browser` (all checks) passes; the plugin checks by name, with the page size.
- [ ] Renders of New game and a game with a design at 1440 × 900 and 390 × 844; the owner sees them before the merge.
- [ ] No game run without the owner's go.

## Risks

- AI strength with a flat square table for `T` (`src/ai/eval.ts:287`).

## Does not do

- No two designs in one game. No history Whens in games.
