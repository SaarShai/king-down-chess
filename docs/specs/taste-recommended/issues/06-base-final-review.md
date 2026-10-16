# Base: the last three review fixes

Status: resolved
Type: task
Lane: od-base

## Scope

Follow ticket 01-base and the owner's three review items. D2 a says:
"Play now uses Beginner and an automatic army; saved custom options stay."
Pictures and game tokens keep their own shape. Controls use stone.

## Plan and checks

1. Make each Play now game use Beginner and an automatic army. Keep the
   saved setup for New game. Test a new player and a saved friend setup
   with Strong and Arrangement on. Update QA step 2 and its doc test.
2. Exclude king pictures from the stone rules. Check their face, selected
   state and size in the browser.
3. Limit the preset exclusion to the name pictures. Check that a preset
   button outside the name page keeps its stone face.
4. Run `npx tsc --noEmit` and `npm test` on this Mac. Run `plugin-ui` on
   the M1 in `~/projects/kd-od-base`, with the shared lock. Run
   `plugin-ui-http` only if server code changes. Raise no time limit.
5. Get two independent reviews. Fix each confirmed fault. Commit on
   `claude/owner-decisions`. Do not push, merge or deploy.

## Build

- `quickSetup()` reads the saved options, then sets Computer, Beginner
  and Arrangement off. It does not change the saved setup. `launch()`
  already skips the settings write for Play now. That guard stays.
- QA step 2 and its doc test state the same rule. Unit tests cover a new
  player and saved friend and random choices with Strong and Arrangement.
  The browser check also opens New game and checks its saved choices.
- Each stone selector excludes the king pictures. The browser checks
  their face, selected mark, disabled face and 44 px size.
- Only `#presets .preset` gets the name picture styles and stone
  exclusion. A browser check adds a preset control outside that group.
  Its face is stone, and its shape is a control.

## Reviews

- Reader A finds no fault in the setup, saved choices or QA changes
  on the first pass.
- Reader B finds a test gap: the disabled stone rule has no image or
  inset shadow, so the first assertion can miss it. The repair checks
  that three disabled king pictures have transparent faces and borders.
  Reader B checks the repair and closes the finding. Both reviews have
  no open fault.

### Part 01-followup-2: failed Play now starts

The next two reviews find faults at `b28f4caa`. Both faults match the code.
Reader A finds that a failed Create changes the New game draft to Computer.
The hall then shows Strong and Arrangement, although Retry starts Beginner
without Arrangement. Reader B finds that a failed king choice keeps Retry
inside the hidden frame. The final read has the same route fault.

Plan and checks:

1. Mark pending Play now commands in private widget state. Keep the saved
   New game draft. Show the quick game's choices while its start waits.
2. Send choice and read failures to the same visible hall as Create.
   Test lost replies, time-outs, remounts, and Retry with the same command.
3. Run `npm test` here with the given local test database. Run `plugin-ui`
   on the M1 in `~/projects/kd-od-base` with the shared lock. Change no
   time limit. No server code needs a change.
4. Record the results and commit the fix on `claude/owner-decisions`.

Repair at `45a38657`:

- Review A: fixed. Pending Play now commands carry `quick: true` in
  private widget state. The hall shows the quick game's choices while
  the command waits. The saved draft and opponent stay separate. After
  a completed Create remounts, the restore path sets the saved opponent
  with the draft. The default Computer choice cannot replace it.
- Review B: fixed. A failed choice or final read opens the hall, with
  the error and Retry in view. Retry keeps the command ID. A remount
  also keeps the quick marker and the saved New game choices.
- The unit test checks marker storage. The app tests check lost Create
  with Retry and remount, Create time-out and remount before completion,
  choice time-out, and read time-out and remount. The browser check fails
  Create, choice and read, then retries each one. It also remounts a
  completed Create. Each path checks the saved A friend, Strong and
  Arrangement choices after the quick game starts.

Checks for this repair:

- The M1 app tests with the old source fail five recovery cases. The
  other 64 tests pass. The job then restores the fix.
  Log: `/tmp/kd-od-base-followup2-red.log` on the M1.
- `npm run typecheck`, the browser script syntax check, and the code
  commit's hooks pass. The gate uses empty secret sources, as the owner's
  file rule requires. It does not check current secret values.
- M1 `npm run -s check:browser plugin-ui` at `45a38657`: pass, 229.5 s.
  The lane's worktree is clean after the check. The job releases its lock.
  Log: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-base-JrXmML/plugin-ui.log`.
- Local `npm test` at `45a38657`, with four workers and the given local
  test database: pass. All 165 files pass; 2,570 tests pass and 8 skip.
  All 50 scene checks pass. The suite takes 282.65 s. The run waits for
  the shared test lock before it starts. No time limit changes.
  Log: `/tmp/kd-od-base-followup2-tests.log`.
- `plugin-ui-http` does not apply: no server code changes.

## Checks before the recovery fixes

- `npx tsc --noEmit`: pass.
- `node --check tools/plugin-ui-check.mjs`: pass.
- `npm test`, with four workers and the given local test database: pass.
  All 165 files pass; 2,566 tests pass and 8 skip. All 50 scene checks
  pass. The suite takes 213.06 s. The run waits for the shared test lock
  before it starts.
  No time limit changes.
  Log: `/tmp/kd-od-base-final-tests-20261016a.log`.
- M1 `npm run -s check:browser plugin-ui` at `ecc91fc6`: pass, 225.5 s.
  All new assertions pass. The job releases the shared lock.
  Log: `/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-base-LkZwXz/plugin-ui.log`.
- Phone and desktop king sheet captures: pass. The pictures keep their
  shape and selected border. The power buttons, Close and Done keep stone.
- `plugin-ui-http` does not apply: no server code changes.
- The code commit's type check and staged repo gate: pass.

## Taste choices

No new taste choice is necessary. The owner's picks set the result.

## Result

The three initial review items and both Play now recovery findings are
fixed. Each finding has a test. All required checks pass. All commits stay local on
`claude/owner-decisions`.
