# Base: repair Join after a remount

Status: resolved
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

Each confirmed review fault has a code fix and a test. The type check,
full local unit suite and both M1 browser checks pass. The current owner
request covers the code repairs and the check readiness waits.
Ticket 01 keeps the parts assigned to later tickets below.

## Base parts

- J0 needs no code. It is not an approved combined pick.
- J2 and D2 keep the quick route and the saved friend or random setup.
  The prior base ticket records their unit and browser tests.
- J3 adds the turn to Resume. The selected game stays selected on a home
  remount. The end screen also stays selected while another game waits.
  A friend or random move reads the games list after the command ends.
  That read does not lock the board. Solo moves need no list read.
- L0 and F40 keep layout B, the board floors and the two coin rows at
  320 px. The existing size tests cover these rules.
- L3 adds the Sound device words. A mount with saved page state restores
  the final card state. A first display from chat still deals. Tests cover both paths and Reduce Motion.
- C1 keeps stone a and round coins. The prior base ticket records the
  face and size checks. Disabled controls keep the approved flat face
  with no grain. A unit test covers this state. Ticket 03-hall owns the chest with the D3 presets.
- J8 keeps the Beginner notes and their read tests.
- Ticket 02-home owns J10. Ticket 06-end owns the full C4 actions and
  Skip. These parts stay in their named lanes.

## Remaining parts

- J10: ticket 02-home depends on 01. It changes the home actions and
  adds Play now to the hall. This lane keeps the approved base route.
- C1 chest: ticket 03-hall depends on 02. The chest needs the D3 preset
  row, which is not built in this base. Build both in ticket 03-hall.
- L3 and C4: ticket 06-end owns the final action words, Skip and the
  ceremony controls. It depends on 04. This lane keeps the Lively
  subset and repairs card restore and the Sound device words.

## Prior reviews

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

## Prior check record

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

The next M1 batch at dcac9496 passes the type check and all 165 test
files: 2,576 tests pass and 8 skip. All 50 scene checks pass. The suite
takes 258.23 s. plugin-ui passes in 223.2 s. plugin-ui-http passes Join,
then fails in 155.9 s at the human-board remount assertion, line 1038.

The host harness replaces its last view with the original mount result.
That result can have no game, or an older game. The app still reads its
saved board, but the host clears its snapshot before that read returns.
Both readers confirm this host fault. The repair keeps a known game and
view on mount. A new chat result still replaces both through harnessShow.
The browser check file stays unchanged. Tests hold the read before the
server call, then check the app's view after release. They cover an empty
seed and an older-game seed.

Both readers check the two-line host repair and both new tests. Neither
finds an open fault. The seed result still passes unchanged. The tests
also check enabled Reload after the read. The queued local focused test
does not run before cancellation; the final M1 suite includes both cases.

## M1 checks at 63fc58d9

- npx tsc --noEmit: pass.
- npm test: pass. All 165 files pass; 2,578 tests pass and 8 skip.
  The suite takes 263.78 s. All 74 app cases and 15 motion cases pass.
  All 50 scene checks pass.
- plugin-ui: pass in 222.6 s.
- plugin-ui-http: fails in 225.2 s at fits(play, 390), line 771,
  called from the route remount loop at line 1556. Join and the human
  board remount pass before this point.
- Check logs: /tmp/kd-od-fixjoin-final2-checks.log on this Mac and
  /var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-fixjoin-MDhUM4
  on the M1.

## Prior hall check blocker

Both readers find a check race. fits uses a live nth control for two
separate actions: scroll and bounds. The mount can add game rows between
those actions. The bounds read then names a different button above the
visible area. Actions stay disabled until the mount read ends.
Neither reader finds a product layout fault in this trace.

The proposed repair waits for enabled Reload before the Play control
loop. It changes no assertion or time limit. End already uses that wait.
The owner permits a check change only for a screen removed on purpose.
The hall remains, so this repair waits for the owner's narrow approval.
A focused M1 test queues behind another lane. It does not run before
cancellation. Its temporary file is removed. No check assertion changes.

Proposed line in fits, after the visible-screen wait:

```js
if (screen === 'play') await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
```

The draft patch is /tmp/kd-od-fixjoin-check-ready.patch on this Mac.
The approval request names this exact wait and keeps all bounds checks.
No new taste choice is necessary.

## Review repair plan

1. Check A1 to A7 and B1 to B2 against the code. Add a test for each
   confirmed fault. Test late Join and Accept replies with a newer chat
   selection. Test live chat deals, Resume words and saved screen state.
2. Restore the approved flat disabled face. Restore the mount seed in
   the host. Make browser checks wait for enabled Reload after mount,
   and enabled Menu before the stone check. Keep each assertion and limit.
3. Run npm test with the local test database. Run plugin-ui and
   plugin-ui-http on the M1 in this lane, with the shared lock.
4. Record each finding and the check results. Check the final diff and
   commit on this branch. Do not push.

Pass criteria: the new tests and full suite pass; both browser checks
pass; every finding has a code result and evidence. The current owner
request authorizes the confirmed repairs, including the readiness waits.

## Review findings and repairs

- A1: confirmed. The route check measures controls before mount ends.
  It now waits for enabled Reload after each route mount and after the
  game switch. It keeps each assertion and time limit.
- A2: confirmed. The old mount flag suppresses every chat deal. The
  deal now stops only during a mount with saved page state. Two tests
  cover a same-page chat start and a new widget. The motion tests still
  cover saved-page restore and Reduce Motion.
- A3 and B1: confirmed. The games list can miss a new game or show an
  old turn. Resume now uses the open game view. One test uses Play now
  directly, then checks the words after the computer replies.
- A4: confirmed. A terminal game does not show which screen the player
  leaves. Page state now saves the Resume destination on collapse.
  Tests cover collapse from End and collapse from the hall after End.
- A5: confirmed. The old move path waits for a list read while busy.
  Friend and random moves now start that read after busy ends. Solo
  moves skip it. A held-read test checks enabled Reload before release.
  The solo test checks the call list after the computer replies.
- A6: confirmed. The changed shorthand keeps grain on disabled stone.
  The approved flat face returns. Its style test expects no image.
  The browser stone assertion waits for enabled Menu.
- A7: confirmed. The retained host view can satisfy a remount assertion
  before the app reads. The two retained seed assignments are removed.
  The browser assertion waits for enabled Reload. The two held-read
  tests show a seed before release and the selected board after it.
  This result replaces the prior claim that the retained view is a host
  repair. The app read is correct; the old check reads too early.
- B2: confirmed. The client protects its board ID, but Join and Accept
  still route a late view. Both screens now check the reply board before
  they use the result. Two tests hold the reply, select a new game from
  chat, release the old reply, and remount the saved board.
- Code note, waiting game: confirmed. Resume now uses the existing
  waiting words. A remount test checks the friend-game label.
- Code note, handle field: confirmed. Like Join, the field accepts text
  before the mount identity read replaces it. The field now stays
  disabled during that read. A held-read test checks this state.
- Branch conflict: no merge is in scope. The disabled CSS line now
  returns to the approved sample. No other branch changes here.
- The M1 probe folders stay in place. This task uses only its own lane.

## Review check record

The first focused run has six passes and two test failures. The late
reply tests keep the correct game, but compare its board ID with the
Create reply. A direct Create reply has no board ID. The tests now save
that ID after selection and also check the game after a remount.
The first queued reproduction does not run before cancellation: another
lane holds the shared test lock. No test limit or lock rule changes.

The corrected focused file passes all 8 tests in 17.80 s. Its npm test
command also passes all 50 scene checks. Log:
/tmp/kd-od-fixjoin-review2.log.

The first full local suite passes 165 files and fails one engine test:
Darkness readings at src/rules/power-fixes.test.ts:470 reaches its
unchanged 5 s limit. There are 2,585 passes, 1 failure and 8 skips.
All app and motion cases pass. The suite takes 184.10 s. The next full
run uses VITEST_MAX_WORKERS=4 to reduce load. It changes no time limit.
Log of the first full run: /tmp/kd-od-fixjoin-tests.log.

The full local run with four workers passes: all 166 files pass,
2,586 tests pass and 8 skip. All 50 scene checks pass. The suite takes
224.95 s. The engine test passes with its original 5 s limit. No engine
code changes. Log: /tmp/kd-od-fixjoin-tests4.log.

M1 plugin-ui passes at the code checkpoint e96eb05b in 225.0 s. Its log
is /var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-fixjoin-pIzle1/plugin-ui.log.

M1 plugin-ui-http passes at e96eb05b in 302.9 s. Its log is
/var/folders/yt/lcvhzjhj76ldb_pzwltq48_c0000gn/T/kingdown-check-runs/kd-od-fixjoin-tgIgRz/plugin-ui-http.log.
Both checks use the lane folder and the shared lock. The shell releases
that lock on exit. Both exit codes are 0. No check assertion or time
limit changes. The desktop coin-size assertion passes in both modes;
the cause of the prior reported failure stays unconfirmed.

After the code checkpoint, only this ticket and the two corrected test
assertions change. The runtime source, host and browser check are the
same as the tested M1 commit. The corrected tests pass in the focused
file and in the full local suite. The final diff has no further repair.
No push, merge, deploy or change to another lane occurs.
