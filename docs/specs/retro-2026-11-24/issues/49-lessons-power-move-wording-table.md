# Key the move wording of src/move-text.ts on PowerTag

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
src/move-text.ts:87 describeMove and src/read.ts give power moves their wording through if chains with a general fallback. No key set over PowerTag exists, so a new move kind gets the general text with no failure. The screen-reader line and the move list can then name the wrong mover or no power. Ticket 03 (docs/specs/retro-2026-11-24/issues/03-card-tables.md) leaves these files out on purpose.

## Change
Add a new test file, for example src/move-text-tags.test.ts, with a table `const WORDING = { ... } satisfies Record<PowerTag, { fen: string; lan: string } | 'fallback'>`. A new PowerTag then fails npm run typecheck at this table. The test iterates the entries that are not 'fallback' and expects describeMove() to contain cardName(TAG_POWER[tag]) and the side that spends the power. Failure text names the tag and says 'add wording in src/move-text.ts describeMove or mark it fallback'. No product change.

## Test that fails first
Type part: add a fake member to PowerTag in a scratch copy; npm run typecheck fails at WORDING. Behaviour part: remove one wording branch in a scratch copy of src/move-text.ts; the test fails for that tag.

## Known limits
About 30 tags each need a position fixture (fen and lan); that is more than 20 minutes of work. PowerTag lives in src/rules/** (engine fingerprint): the test may import it, but no commit may change it.

## Work record
Not started.
