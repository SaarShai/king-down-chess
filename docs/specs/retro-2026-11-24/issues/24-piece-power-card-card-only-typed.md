# Engine: type CARD_ONLY so that a new card-only CardName fails the type check

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

src/rules/rules.ts:147 declares `CARD_ONLY: readonly CardName[]`. ALL_CARDS (src/rules/rules.ts:192) is USES_RULE keys plus CARD_ONLY. A new CardName that is not a PowerName and is not in CARD_ONLY is missing from ALL_CARDS, from Muse explain (src/muse/board-words.ts) and from the pools. No type check or test sees it.

## Change

Build CARD_ONLY from a key set: `const CARD_ONLY_SET = { ... } satisfies Record<Exclude<CardName, PowerName>, true>` and `CARD_ONLY = Object.keys(CARD_ONLY_SET) as ...`, in the same order as today. The value of CARD_ONLY must not change. src/rules is the engine fingerprint: run the worker fingerprint check and the rules tests.

## Test that fails first

Add a new name to CardName in a scratch copy. `npm run typecheck` must fail at CARD_ONLY_SET. On the real tree, the fingerprint must stay the same and src/rules/rules.test.ts must stay green.

## Known limits

The order of the keys must stay the catalog order. A test must compare the new CARD_ONLY with the old list once.

## Work record

Not started.
