# Test a player change during a lesson

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
The lesson says: keep the live Game separate from the lesson Game, and test the lifecycle controls. src/screen/play.ts:114 keeps lessonReturn, and src/screen/play.test.ts has 'control: partial cloud recovery leaves a lesson and saves the recovered match'. No unit test changes a player (or a side) while a lesson runs, then returns to the match. The browser check lesson-return is byName, so CI does not run it.

## Change
Add a case in a new file beside src/screen/play.test.ts (for example src/screen/play-lesson.test.ts; src/screen/play.ts is not protected). Start a match, open a lesson, change a player, close the lesson, and expect the match Game, sides and turn start that lessonReturn saved (src/screen/play.ts:383 and :399). Failure text: 'a player change during a lesson changed the live match: keep the lesson Game apart from lessonReturn in src/screen/play.ts'.

## Test that fails first
Fake: in a scratch copy, make the player control write to the live game while lessonReturn is set. The test fails.

## Known limits
A unit test with the screen helpers of play.test.ts does not prove the browser layout. The test must use the same mocks as play.test.ts.

## Work record
Not started.
