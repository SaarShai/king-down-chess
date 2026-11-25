# Small faults from the retro are repaired or explained

Status: ready-for-review

Source: [retro](../retro.md), item 6. The section "Faults found on the way".

## Problem

The retro lists four open small faults:

- `tools/verify-motion-concepts.mjs` gives `POWERS_BALANCED` only when a king has a power. It also sets hands. Decision 188 says that a game with a hand or a king power plays under `POWERS_BALANCED`.
- A comment in `src/card-symbol.ts` says that a released card can have no painting. All 21 released cards have one.
- Two dealers write the hand size 4: `src/match/setup.ts` and `src/interface/play/new-game.ts`. No test fails when they differ.
- `src/render/effects/power-overlays.ts` casts an action ID to a kind with no check.

## Change

- `tools/verify-motion-concepts.mjs`: the condition is now the same as in `src/online/launch.ts`. A fixture with a hand or a king power loads under `POWERS_BALANCED`.
- `src/card-symbol.ts`: the comment of `motion` now says what the table is: the quiet loop of some cards in the rule picture.
- `src/match/one-reading.test.ts`: one new assertion in the test that builds both dealers. It compares the hand sizes of the solo dealer and the match dealer. The dealers do not change.
- `src/render/effects/power-overlays.ts`: no change. `walkAction` returns an action only when `keepsRealMotion` is true. That is true only for Strike, FireStarter, Haste, Rally, March and Flight. These six IDs are the type `Kind`. Thus no other ID gets to the cast.

## Checks

- Red first: `slice(0, 4)` changed to `slice(0, 3)` in `new-game.ts` locally. `KINGDOWN_TEST_FILE=src/match/one-reading.test.ts KINGDOWN_TEST_NO_TYPECHECK=1 npm test`: 2 failed, 4 passed. `AssertionError: expected [ 3, 3 ] to deeply equal [ 4, 4 ]` at `one-reading.test.ts:37`. The number is back to 4.
- `KINGDOWN_TEST_FILE=src/match/one-reading.test.ts KINGDOWN_TEST_NO_TYPECHECK=1 npm test`: 6 passed.
- `npm run check:browser motion-concepts`: passed (50.4 s). It also ran once before, but that run failed because files changed in the checkout while it ran.
- `npm run typecheck`: passed.
- `npm run test:docs`: passed.

## Known limits

- The cast in `power-overlays.ts` stays. A new ID in `WALKS` in `card.ts` that is not in `Kind` gets past the type check. The `TAIL` and `SPACING` tables then give `undefined`. A type on `WALKS` can prevent this, but that is not a five-line guard with a test, so it is not done here.
- `src/workshop/ground.ts` shows `cardPicture` for a card with no painting. That case does not occur for a released card. The rule is not to edit `src/workshop/**`, so the code stays.
- The full suite did not run.
