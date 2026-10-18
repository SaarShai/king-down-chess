# PR 61: race checks under load

Status: ready-for-human

Scope: the races group of ticket 43. Base: `5957300f`.

## Plan and checks

1. Run all 42 race checks with the supplied CPU slow-down at 6.
   Record failures before each fix where the fault can be shown.
2. Trace each failure to its cause. Use a real event for each wait.
   Keep each test, check, time limit and browser target.
3. Run the fixed race checks three times at 6 and once at full speed.
   Run the type check through `npm test`, with the shared test lock.
4. Read the diff, record the results, and commit on this branch.

The CPU setup and logs stay in `node_modules/.cache/rc-ci-races/`.
The temporary config change is removed before the commit.

## Causes and changes

- R9 sees the error line disappear while the frame reloads. That does not
  mean that the new app connects or mounts. Wait for the source import and
  the enabled home control. Keep the new games-list read check.
- A shown view or a widget write can precede the mount's last list read.
  Wait for the mount job before checking Seat, Profile, the new games
  list or unlocked controls.
  For a saved move, also wait for the command lane to become idle.
- The frame load does not wait for the app's dynamic import. Wait for
  that import before checking the first enabled home control.
- R2 completes its click, then times out in the browser's navigation wait.
  Keep the real click and wait for the held create request. The test clock
  still controls both timeout steps.

No product fault is shown. The code change is in the race checks only.
The time limits, assertions and browser targets stay in place.

## Failure evidence

- The first full baseline has 38 passes and 4 failures: the saved-move
  resend, the control unlock, R2 and R9. The CPU preload does not prove
  a slow-down in this run. Log: `baseline.log` in the scratch folder.
- The supplied `cal3.log` has the source-start, Seat, Join and Accept
  failures. The focused local repeats do not reproduce all of them.
- A direct CDP run at rate 6 records all 13 selected pages. It has
  12 passes and the R9 count failure before the fix. Log:
  `slow-red-widget.log`. The session checks the 13 recorded page rates.
  The child frame uses the parent CDP session, so its rate applies too.
- The temporary CPU setup records each page. It is removed before the
  commit. No test is removed or marked to skip.
- The third full slow run has 41 passes and one early new-list check
  failure. The board shows before its list read ends. Add the same mount
  wait to that check. Log: `slow-green-3.log`; rate 6 is recorded for all
  42 pages in `cpu-pages-3.log`. Check this last fix twice alone and once
  in the complete slow file. This gives each changed case three slow
  passes after its fix.

## Pass results

All commands use `npm test` and the shared project test lock. Each
listed run passes the type check. Logs and CPU records are in
`node_modules/.cache/rc-ci-races/`.

| Run | CPU rate | Race checks | Doc checks | Exit |
| --- | --- | --- | --- | --- |
| `slow-green-1.log` | 6 | 42/42 | 51/51 | 0 |
| `slow-green-2.log` | 6 | 42/42 | 51/51 | 0 |
| `list-slow-1.log` | 6 | 1/1 selected | 51/51 | 0 |
| `list-slow-2.log` | 6 | 1/1 selected | 51/51 | 0 |
| `slow-final.log` | 6 | 42/42 | 51/51 | 0 |
| `full-speed.log` | Full speed | 42/42 | 51/51 | 0 |

The last list fix has two focused passes and the complete final pass.
Each other fixed case has three complete slow passes. The CPU records
for each complete pass have 42 pages at rate 6. The temporary setup
is saved as `cpu-setup.patch` and removed from the commit. The config
is back to its original content. The full-speed check passes on the
final test code, with no CPU setup. The complete race runs contain all
42 cases. The two focused checks select only the last list case; they
change no test declaration.

## Diff check

The fix uses the existing source import, mount job and command lane.
It adds no product API. Each result check and time limit stays in place.
No WebKit file changes. The other groups and the full suite are outside
this task.
