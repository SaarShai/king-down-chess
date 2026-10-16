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

## Review repair plan and checks

1. Check each finding from Review A against the code and ticket 01-base.
   Play now must keep the saved friend or random setup. Add unit tests
   for quickSetup and a browser check that reads the saved setup.
2. Restore 390 × 844 after the coin checks. Check the phone size before
   the setup mixes and first seat checks.
3. Correct QA step 2 for a new player, saved options and the friend code
   field. Change the doc test to check these cases.
4. Replace the board structure assertions with computed face checks.
   Keep the Menu face check as a control.
5. Run npm test here with the given test database. Run plugin-ui on the
   M1 with the shared lock. Run plugin-ui-http if server code changes.
   Record the results and commit on this branch.

## Build

- Each stone selector excludes coins, Profile badge buttons and name
  picture choices. `:where(...)` adds no selector weight.
- The general button size rule also excludes coins. Desktop card coins
  keep 34 × 34 px; power coins keep 40 × 40 px. Touch coins keep 44 × 44 px.
- Browser assertions cover the ten phone coins at 393 × 852, the ten
  desktop coins with touch off, transparent badge and picture faces,
  the board and parent faces, and the stone Menu button. Size checks wait for
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
- Review A finds four faults. Each fault is confirmed against the code.
  The repairs and their checks follow below. Review B finds no fault.

## Review repairs

1. Saved setup: confirmed. quickSetup makes a solo copy, and launch saves
   that copy over last_setup. Play now starts without saving the copy.
   Start game still saves the selected setup. Unit tests cover a new
   player and saved friend and random choices, including Arrangement.
   Browser checks read the whole saved setup after Play now for friend
   and random, and check the new computer game's level and options.
2. Phone checks: confirmed. The coin check sets the page to 1000 × 1000
   and leaves it there. It now restores 390 × 844. Assertions check this
   size before the 16 setup mixes and before the first seat and king sheet
   checks. The desktop coin check keeps its separate page.
3. QA words: confirmed. Step 2 treats all Play now starts as new-player
   starts and does not say how to show Join with a code. It now states
   both saved and new-player cases, the saved Arrangement route, and the
   friend selection. The doc test checks each statement.
4. Board assertions: confirmed. A canvas count and a button count do not
   check the board's face. A computed background-image check now excludes
   stone-control from the board and its parent. The Menu assertion checks
   that the stone face is present on a control.

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

## Review repair checks

- `npm test`, with four workers and the given local test database: pass.
  All 165 files pass; 2,566 tests pass and 8 skip. All 50 scene checks pass.
  The suite takes 214.13 s. No time limit changes.
  Log: `/tmp/kd-od-base-review-tests.log`.
- `node --check tools/plugin-ui-check.mjs`: pass.
- The commit's type check and staged repo gate: pass.
- M1 `npm run -s check:browser plugin-ui` at `f9311cdc`: pass, 226.1 s.
  The saved friend and random setup checks, phone size assertions and
  computed board face check pass. The job releases the shared lock.
  Log: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-base-0C5VG8/plugin-ui.log`.
- `plugin-ui-http` does not apply: no server code changes.

## Result

All four review findings are fixed and pass their checks. No new taste
choice is necessary. All commits stay local. No push, merge or deploy
takes place.
