# The forms drift test states the hand size and the switch count as fixed numbers

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
tools/forms-drift.test.ts:32-35 compares the code hand size with the literal 4 and the code switch count with the literal 5. It then looks for the fixed words 'four shared cards' and 'the five feature switches' in src/plugin/server.ts:142. When a change makes the hand 5 cards and changes the tool text to 'five shared cards', the code and the text agree, but the test fails. This is a false red, not a hole: the test catches each drift today. A false red teaches people to change the test literals without a check of the tool text.

## Change
Change only the test. Get the hand size from draw(...).hand.length and the switch count from Object.keys(JSON.parse(switches(DEFAULT_OPTIONS))).length. Map each number to its English word with a small list in the test (['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']). Then expect the tool text to contain `${word} shared cards` and `the ${word} feature switches`. The failure text names src/plugin/server.ts and the words to write there. No product file changes.

## Test that fails first
1. In a scratch copy, change slice(0, 4) to slice(0, 5) in src/match/setup.ts:58 and 'four shared cards' to 'five shared cards' in src/plugin/server.ts:142. The test today fails (expected length 4). After the change the test passes.
2. Change only src/match/setup.ts:58 to slice(0, 3). The test after the change fails with a line that names 'three shared cards' and src/plugin/server.ts.
3. Revert both. The test passes on the real tree.

## Known limits
The word list stops at the largest number in the list. A number past the list gives undefined; the test must then fail with a clear text.

## Work record
Not started.
