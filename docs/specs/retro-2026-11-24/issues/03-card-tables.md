# A new card, power or piece with a missing table entry fails a check

Status: done (PR 464 merged)

Source: [retro](../retro.md), item 3. Branch `retro-env-cards`, merged into `retro-env`. This is a class B change.

## Problem

One card has entries in about nine tables in four forms of the game. Nothing names a table that a new card misses. PR 431 repaired Guide and Help lines that were false.

## Change

Type-only edits, one changed test and one new test. No text that a player reads changes, and no behaviour changes.

- `src/content/cards.ts`: `RELEASED_CARDS` is `as const`; the new type `ReleasedCardId`.
- These tables now state their key set, so a missing entry for a card or a power fails `npm run typecheck`: `powerLines` and `opponentLines` (`src/interface/play/texts.ts`), `steps` (`src/interface/play/learning.ts`), `learningNotes` (`src/interface/play/learning-content.ts`), `cardText` (`src/powers-ui.ts`), `HOLD_DEFAULT` (`src/ai/search.ts`). `steps` covers the released cards and each king power with uses, because the hint of the power button reads it too. A missing entry for a piece fails the forms drift test, not the type check.
- `src/render/effects/card.ts`: one set gets the type `Set<CardName>`, because `RELEASED_CARDS` is now `as const`.
- `tools/forms-drift.test.ts`: the piece test starts from the released pieces (the pawn, the classic army and the pool). Before, it started from the web table, so a piece with no web name passed. A new test checks the Guide note of each released piece.

## Stays partial on purpose

`POWER_TAG` (only a power that a player spends leaves a tag), the motion and duration tables of the effects (only some cards move), and the sentence chains in `src/move-text.ts` and `src/previously.ts` (each has a general fallback sentence).

## Stays manual

The engine (`src/rules`), art and fixtures, the plugin and Muse tool text, `docs/RULES.md` and `docs/MATRIX.md`.

## Checks

- `npm run typecheck` passes. A scratch card added to `RELEASED_CARDS` gives errors at `learning-content.ts`, `learning.ts` and `texts.ts`; a removed `cardText` case and a removed hold each give one error.
- The forms drift test with one piece removed from the web table: it passed before the change and fails after it.
- `KINGDOWN_TEST_FILE=tools/engines.test.ts npm test` passes. The compiled worker has the same fingerprint before and after.

## Known limits

- `learningNotes` accepts a note for a card that is no longer released: its type also takes any piece name as a key.
- The per-card tables of the plugin and the Muse connector have no such guard.
## Review

- First review: an agent that did not build the change read head `a8c0b4183`. It found two false skips in the test selector and three smaller faults. Commit `1175061f7` repairs them.
- Main then moved 161 commits. Merge `9965586b0` resolves three conflicts: `package.json`, the check list, and the header of the play scenes check. The full suite passes on the merge: 410 files, 8,031 tests.
- Second review: five agents that did not build the change read head `9965586b0`, one for each area and one for the repairs and the merge. A skeptic tried to refute each blocking finding. Four findings stand and are repaired in one batch: for this ticket, the guard of `steps` covered the released cards only, but the hint of a king power reads the table too.
- Repair check: the reviewer of the repairs and the merge read commit `e4faf165e`. The repair holds. The full suite passes on that commit: 410 files, 8,031 tests.
- Open findings: none that block. The notes are in "Known limits".

