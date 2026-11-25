# Guide notes: find a note for a piece, card or power that is not released

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

src/interface/play/learning-content.ts:156 ends `learningNotes` with `satisfies Record<PowerName | ReleasedCardId, Note> & Record<string, Note>`. The second part accepts each string key. When a card or a piece leaves the released set, its note stays and the type check does not see it. A probe with a stale `Growth` key stays green.

## Change

Cheapest repair: a type. Replace `Record<string, Note>` with a `GuideKey` union (released piece names, `ReleasedCardId`, `PowerName`), so that `satisfies` refuses an extra key. The file is a GUI session file, so a GUI session must do the type change. Until then, a behaviour test in a new tools/ file can do the check: allowed keys = the capitalised NAMES of the released pieces (P + CLASSIC_CHESS + POOL) + RELEASED_CARDS ids + POWER_NAME keys; expect `Object.keys(learningNotes).filter(k => !allowed.has(k))` to equal `[]` with the text 'learning-content.ts learningNotes: remove the stale note'.

## Test that fails first

Add a `Growth: { ... }` key to `learningNotes`. The test (or `npm run typecheck`, after the type change) must fail and name the key. On main it must pass.

## Known limits

The test does not find a note whose text is out of date. It only finds a key that has no released piece, card or power.

## Work record

Not started. The probe test is in the scratch file plugin-muse-instances.test.ts of 2026-11-25 (test 4).
