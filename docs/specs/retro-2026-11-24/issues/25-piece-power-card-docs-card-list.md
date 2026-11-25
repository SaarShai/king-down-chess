# Docs: card list and card count follow RELEASED_CARDS

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

The docs give the released cards as fixed text: docs/specs/chatgpt-mvp/spec.md:42-43 (Q20, "21 cards: ...", "Cards starts with all 21 selected"), docs/RULES.md:139 ("The 21 released cards"), docs/MATRIX.md card rows. tools/plugin-cards.docs.test.ts:7 checks the fixed string "all 21 selected" only. A new released card makes cards.test.ts and card-thumbs.test.ts fail, but no docs check fails.

## Change

A docs test in a new tools/ file (for example tools/released-cards.docs.test.ts): import RELEASED_CARDS and cardName. Expect the Q20 'Cards in "all"' row to contain `${RELEASED_CARDS.length} cards` and each public card name; the deal row to contain `all ${RELEASED_CARDS.length} selected`; docs/RULES.md to contain `The ${RELEASED_CARDS.length} released cards`; docs/MATRIX.md to have a row for each released card. The failure text names the doc and the card. Then change the fixed '21' in tools/plugin-cards.docs.test.ts:7 to use the count.

## Test that fails first

Add Rage to RELEASED_CARDS in a scratch copy. The test must fail and name each doc. On main it must pass.

## Known limits

The public names differ from the IDs (Mirror = MirrorB, Morph = MorphP, Hop = Vault); the test must use cardName. The MATRIX row form must be read first.

## Work record

Not started.
