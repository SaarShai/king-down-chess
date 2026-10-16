# Base: repair Join after a remount

Status: in-progress
Type: task

## Scope

Build ticket 01-base in lane od-fixjoin. The base build is at e1adc933.
The prior tickets record J2, J3, D2, L0, L3, C1, J8 and F40.
The owner reports that plugin-ui-http hides Join after a remount.
Keep the approved hall, layout B, stone a and Lively motion.

## Plan and checks

1. Check each base part against ticket 01-base. Add each missing behaviour
   and its test. Keep prior changes that meet the ticket.
2. Reproduce the join fault with a short test. Find the cause in the code.
   Add a test before the fix. Change no check to hide a code fault.
3. Run npx tsc --noEmit and npm test with the given local test database.
   Run plugin-ui and plugin-ui-http on the M1 in kd-od-fixjoin.
   Use the shared browser lock. Change no time limit.
4. Get two independent reviews. Fix each confirmed fault. Record the
   results and commit on claude/od-fixjoin. Do not push.

## Verification criteria

- Join shows the preview after the player enters a code after a remount.
- Decline makes no join. Confirm joins the offered game.
- Each base part has a test. Both M1 browser checks pass.
- The type check and full test suite pass. Two reviews have no open fault.

## Result

Work is in progress.

## Base parts

- J0 needs no code. It is not an approved combined pick.
- J2 and D2 keep the quick route and the saved friend or random setup.
  The prior base ticket records their unit and browser tests.
- J3 adds the turn to Resume. The selected game stays selected on a home
  remount. The end screen also stays selected while another game waits.
  A move reads the games list again before Next game uses it.
- L0 and F40 keep layout B, the board floors and the two coin rows at
  320 px. The existing size tests cover these rules.
- L3 adds the Sound device words. A mount restores the final card state;
  a live start can still deal. Tests cover both paths and Reduce Motion.
- C1 keeps stone a and round coins. The prior base ticket records the
  face and size checks. Disabled controls now keep their stone image;
  they keep the same disabled colours and flat edge. A unit test covers
  this state. Ticket 03-hall owns the chest with the D3 presets.
- J8 keeps the Beginner notes and their read tests.
- Ticket 02-home owns J10. Ticket 06-end owns the full C4 actions and
  Skip. These parts stay in their named lanes.

## Reviews

Reader 1 finds two faults in the first diff. Both have code fixes and
tests. An empty home read must not leave a flag that blocks the next
card deal. An explicit end-screen Resume must not name another game.
Reader 1 checks the repairs and finds no open fault.

Reader 2 confirms that the held-read Join test matches a player who
enters a code before mount handlers are ready. Reader 2 also asks for
end-screen restore after an inline remount. The code and test cover it.
Both readers check the final diff. Neither finds an open fault.

## Join cause and repair

The static code field accepts text before the mount read ends. Join
handlers are not ready. When the read ends, joinScreen fills the field
from empty page memory. The entered code is lost and Join stays hidden.
The field now follows the same blocked state as the screen buttons.
It accepts input after the handlers are ready. The browser check stays
unchanged. No taste selector hides Join.

The focused M1 reproduction uses the new app test in a temporary single
test file, with the starting code at e1adc933. Command: npm test, with
KINGDOWN_TEST_FILE=tools/plugin-join-remount-repro.test.ts. It fails in
8.71 s: one test fails; #join-confirm stays hidden after the held read.
The temporary test file is removed before the base HTTP check starts.

## Checks in progress

- npx tsc --noEmit: pass.
- The local app file runs 72 tests. Seventy pass, including the Join,
  Next game and disabled stone tests. Two new Resume tests fail because
  their games still need Arrangement. The test-only repair in afb2db39
  starts Classic games with Arrangement off. Both readers check it.
- The M1 reproduction fails on the base. The base HTTP check fails at
  the earlier Menu face assertion in 42.0 s. A computer turn disables
  Menu. The disabled background shorthand removes the stone image.
  The repair sets background-color and keeps that image. The check stays
  unchanged. The M1 uses a loopback tunnel to the given test database.
- No check time limit changes. No new taste choice.
- The two corrected Resume tests pass in a temporary local single file:
  2 tests and 50 scene checks pass; the test file takes 6.95 s. The
  temporary file is removed. Log: /tmp/kd-od-fixjoin-resume.log.
- The M1 final batch at afb2db39 holds the shared lock. It runs
  npx tsc --noEmit, npm test with four workers, plugin-ui and
  plugin-ui-http. Its job log is /tmp/kd-od-fixjoin-final-checks.log on
  this Mac. Its test log is /tmp/kd-od-fixjoin-tests.log on the M1.
- The M1 type check passes.
- M1 npm test: pass. All 165 files pass; 2,572 tests pass and 8 skip.
  All 50 scene checks pass. The test suite takes 277.95 s. The given
  local test database applies through the loopback tunnel. No time
  limit changes.

## Browser follow-up repairs

The first final batch at afb2db39 finds two more faults before Join.
The browser check file stays unchanged.

- plugin-ui fails in 76.8 s at the Settings footer assertion. The Sound
  note now sits beside Sound, with aria-describedby. The account footer
  keeps its words. The unit test reads the note beside its control.
- plugin-ui-http fails in 43.9 s at Abort. The tool caller sends no
  revision. The server reads one, then the computer moves before the
  write. The server-selected revision is stale. The optional command
  path now reads again and retries once with the same command ID.
  An explicit revision, another refusal and a second race do not retry.

The new server unit cases fail before the repair: 2 fail and 12 pass,
in 405 ms. After the repair all 14 pass in 371 ms. All 50 scene checks
also pass. The tests cover an automatic revision, an explicit revision,
a definite refusal and a second race. Logs stay on the M1 at
/tmp/kd-od-fixjoin-server-red.log and /tmp/kd-od-fixjoin-server-green.log.
Both readers check these changes and find no open fault.
