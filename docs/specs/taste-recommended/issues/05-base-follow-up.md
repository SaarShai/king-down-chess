# Base follow-up: token shapes, chat result and Play checks

Status: resolved
Type: task

## Scope

Follow ticket 01-base and its last comment, lane od-base. The owner says
that card and power coins stay round. Profile badges and name pictures
keep their own shape. Controls, menu rows and toggles keep stone a.

## Plan and checks

1. Exclude coins, badge buttons and picture choices in each stone selector.
   Add browser checks for their shape and face. At 393 × 852, compare the
   painted board with `taste/stone-a` and `claude/fault-round-2`.
2. Use a real `kingdown_open` result in the move-in-flight test. Check that
   `_meta.board_id` names the current board and that the move completes.
3. Replace the old Play menu QA step with the quick-start hall. Add a doc
   test that checks the hall controls against the page.
4. Run `npx tsc --noEmit` and `npm test` on this Mac. Run `plugin-ui` on
   the M1 in `~/projects/kd-od-base`, with the shared browser lock.
   No server code changes: `plugin-ui-http` is not required.
5. Get two independent reviews. Fix each confirmed fault. Commit locally
   on `claude/owner-decisions`. Do not push.

## Build

- Each stone selector excludes coins, Profile badge buttons and name
  picture choices. `:where(...)` adds no selector weight.
- The general button size rule also excludes coins. Desktop card coins
  keep 34 × 34 px; power coins keep 40 × 40 px. Touch coins keep 44 × 44 px.
- Browser assertions cover the ten phone coins at 393 × 852, the ten
  desktop coins with touch off, transparent badge and picture faces,
  the painted canvas, and the stone Menu button. Size checks wait for
  the card deal motion to end.
- The move-in-flight test uses a real `kingdown_open` result. Open creates
  a new board. The test checks its private ID and the widget's adoption
  of that ID before the held move ends.
- QA step 2 describes the quick-start hall. Its doc test checks the home
  action words, setup footer and menu rows against the page. It reads
  step 2 from the test sequence, after the setup section.

## Reviews

- Reader 1 checks the CSS and browser assertions. The reader finds the
  desktop width fault in the general button size rule. The fix and its
  desktop assertion pass the second read. No confirmed fault stays open.
  The reader also checks the three phone captures. The board stays painted,
  the visible power coins stay round, and the controls keep stone.
- Reader 2 checks the chat result and QA changes. The reader finds that
  Open creates a new board ID. The fix passes the second read. The reader
  also checks the doc test's section fix. No confirmed fault stays open.

## Taste choices

No new taste choice. The owner's token shapes, stone controls and
existing coin sizes stay.

## Verification

- `npx tsc --noEmit`: pass.
- First `npm test`: 164 files pass. The new doc test reads setup step 2
  and fails. The section fix is complete.
- Second `npm test`: 164 files pass. One Darkness test exceeds its
  5-second limit. The test and engine code match the starting head.
- `VITEST_MAX_WORKERS=4 KINGDOWN_TEST_FILE=src/rules/power-fixes.test.ts npm test`:
  pass, 35 tests and 50 scene checks. The given local test database applies.
- `VITEST_MAX_WORKERS=4 npm test`: pass. All 165 files pass; 2,563 tests
  pass and 8 skip. All 50 scene checks pass. The suite takes 221.72 s.
  The given local test database applies. No time limit changes.
  Log: `/tmp/kd-od-base-tests-3.log`.
- M1 comparison at 393 × 852: pass. All three captures use the same
  gallery position. The native 448 × 448 px centre crop is identical on
  this branch, `taste/stone-a` and `claude/fault-round-2`. Image review
  confirms the painted board. No board repair is necessary.
- `npm run -s check:browser plugin-ui` on the M1 at `ab7da559`: pass,
  238.0 s. All new shape assertions pass. The job releases its lock.
  Log: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-base-sInQew/plugin-ui.log`
- `plugin-ui-http` does not apply: no server code changes.

## Result

All parts of this follow-up are complete. No new taste choice is necessary.
All commits stay local. No push, merge or deploy takes place.
