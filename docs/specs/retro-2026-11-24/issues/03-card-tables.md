# A new card, power or piece with a missing table entry fails a check

Status: ready-for-human

Source: [retro](../retro.md), item 3. Branch `retro-env-cards`, merged into `retro-env`. Not pushed. This is a class B change: it needs an independent review before a pull request.

## Problem

One card has entries in about nine tables in four forms of the game. Nothing names a table that a new card misses. PR 431 repaired Guide and Help lines that were false.

## Change

Type-only edits and one test. No text that a player reads changes, and no behaviour changes.

- `src/content/cards.ts`: `RELEASED_CARDS` is `as const`; the new type `ReleasedCardId`.
- These tables now state their key set, so a missing entry fails `npm run typecheck`: `powerLines` and `opponentLines` (`src/interface/play/texts.ts`), `steps` (`src/interface/play/learning.ts`), `learningNotes` (`src/interface/play/learning-content.ts`), `cardText` (`src/powers-ui.ts`), `HOLD_DEFAULT` (`src/ai/search.ts`).
- `tools/forms-drift.test.ts`: the piece test starts from the released pieces (the pawn, the classic army and the pool). Before, it started from the web table, so a piece with no web name passed. A new test checks the Guide note of each released piece.

## Stays partial on purpose

`POWER_TAG` (only a power that a player spends leaves a tag), the motion and duration tables of the effects (only some cards move), and the sentence chains in `src/move-text.ts` and `src/previously.ts` (each has a general fallback sentence).

## Stays manual

The engine (`src/rules`), art and fixtures, the plugin and Muse tool text, `docs/RULES.md` and `docs/MATRIX.md`.

## Checks

- `npm run typecheck` passes. A scratch card added to `RELEASED_CARDS` gives errors at `learning-content.ts`, `learning.ts` and `texts.ts`; a removed `cardText` case and a removed hold each give one error.
- The forms drift test with one piece removed from the web table: it passed before the change and fails after it.
- `KINGDOWN_TEST_FILE=tools/engines.test.ts npm test` passes. The compiled worker has the same fingerprint before and after.
