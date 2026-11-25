# Muse: a spoken word for each card that acts through m.via

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

src/muse/match-words.ts:45 adds the spoken word for Mirror and MirrorB by hand: `power(cardName('Mirror'), 'mirror'); power(cardName('MirrorB'), 'mirror');`. These cards act through `Move.via` (src/rules/engine.ts:125, `via?: 'mirror' | 'mirrorb'`), not through POWER_TAG or TAG_POWER. A new card that acts through `via` gets no spoken word, and no check fails.

## Change

Replace the two calls with a typed table in match-words.ts: `const VIA_WORDS = { mirror: 'Mirror', mirrorb: 'MirrorB' } satisfies Record<NonNullable<Move['via']>, CardName>`, and loop over it. A new `via` value then fails `npm run typecheck` at the table. This changes how the file builds DICT (same result), so it is not a type-only change and needs a Muse test run (src/muse/match-words.test.ts).

## Test that fails first

Add a third value to `Move['via']` in a scratch copy. `npm run typecheck` must fail at VIA_WORDS. On the real tree, src/muse/match-words.test.ts must stay green.

## Known limits

The engine type `Move` is in src/rules (engine fingerprint, protected). The scratch fault is only for the proof. The table covers `via` cards only; cards with a POWER_TAG already come from shared tables.

## Work record

Not started.
