# Refresh the combined preview with the fault fixes

Status: resolved
Type: task

## Scope

The owner asks to merge `ed0a05b6` into `taste/recommended` at `d464ca91`.
Keep all preview choices and all fault fixes. Commit locally. Do not push.

## Plan and checks

1. Read both changes and resolve the seven conflict files.
2. Apply command IDs, errors and Retry to each preview start path.
3. Keep both sets of tests. Change screen steps only where the preview flow differs.
4. Run `npx tsc --noEmit -p .` and the seven requested test paths.
5. Check the final changes, commit the merge, and update the preview notes.

The checks must keep the hall, quick start, layout B, stone controls, motion,
U5 and U6. They must keep the 10 s command limit, Retry, poll errors, command
IDs, dates, zoom fixes, W contrast and opponent motion. No test limit increases.
No full browser suite runs. No dependency installation occurs.

## Merge choices

- `app.ts`: Keep the hall and foreground read order. Show each pending error
  on its start screen and every locked screen. A quick start records the hall
  as its retry screen. A same-game chat notice does not stop a live command.
- `games-list.ts`: Keep Resume and Next game. Use the shared date format and
  the friend waiting sentence.
- `screens/board.ts`: Keep the preview motion and end sequence. Both parents
  wait for the final move before the king falls.
- `screens/setup.ts`: Keep quick start and hall exits. Show the wait sentence
  after 5 s, keep the 10 s limit, use `errorText`, and wait for explicit Retry.
- `plugin-app.test.ts`: Use the hall and its Settings exit. Keep the fault
  assertions. Add quick-start checks for a timeout and a remount.
- `plugin-ios-size.test.ts`: Keep both groups of checks. Open the hall. The
  two-toggle check selects the two original board settings; the full control
  check also tests Sound.
- `plugin-menus.test.ts`: Keep the hall steps. Test the wait sentence at 5 s
  and Retry after the unchanged 10 s limit.

## Faults at the join

- The hall puts `setup-body` in `display: contents`. It cannot be a size
  container. The hall body now supplies the 200% zoom width.
- The stone minimum-size rule has more priority than the larger control
  sizes. This gives the Profile row and Name field only 44 px tap areas.
  The rule now has lower priority, so each larger size takes effect.
- The old foreground wait also holds a same-game chat notice during a move.
  The fault test finds this delay. Only a notice for the same pending game,
  with no new board view, can pass while the command runs.
- The first games heading has top space that breaks the old list-position
  check. The heading now starts at the top of the hall body.
- The passive drawing test can wait for a resize while its clock is stopped.
  It now advances the clock 100 ms before the same width assertion. The 5 s test
  limit does not change. The full board file then passes this check.

## Test steps and limits

The old inline Your games action becomes the chat Play action. Its list-position
assertion stays the same. The seat title check uses landscape at the same
197 px width, because layout B hides the portrait title. All title assertions
stay the same.

One old assertion cannot apply to this preview. The board case at 320 × 568
with Cards expects the player row to be 44 px high. U6 requires a second row
to keep the coins and name in the frame, so the row is 88 px high. The test
keeps its 44 px assertion and reports a failure. Its touch and art assertions
run first and pass. The U6 size test also checks the coins and name.

## Final evidence

- `npx tsc --noEmit -p .`: pass.
- The requested Vitest set, with two file workers: 232 pass, 21 database
  tests skip, and the one incompatible row-height assertion fails. The run
  takes 147.80 s. No test limit increases and no assertion is removed.
- App: 63 pass. Menus: 9 pass. iOS sizes: 23 pass. Board: 28 pass and the
  one row-height failure. Profile: 21 pass. Preview sizes: 2 pass.
- `src/plugin`: 86 pass and 21 database skips. No test database is set.
- `npm run test:docs`: 113 pass.
- The final comparison keeps the fault service, router, dates and Profile
  fixes equal to `ed0a05b6`. The preview keeps its hall, quick start, Resume,
  Next game, layout B, stone controls, motion, U5 and U6.
- No conflict marker remains. No full browser suite, push or deploy runs.

The local logs are in `dist/taste-refresh/`: `tests-4.json`, `tests-4.log`,
`typecheck.log`, `docs.log` and `board-clock.log`. The test probes stay in its
`debug/` folder. No probe code remains in a source or test file.
