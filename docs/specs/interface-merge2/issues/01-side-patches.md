# Join the two side patches

Status: ready-for-human

## Scope

Apply the opponent picture and named invite patch. Apply the local online stack patch.
Keep the current online repairs. Use the local stack to check result removal and first move delay.
Make only small repairs for confirmed faults. Add no feature or dependency.

## Checks

Run related tests during the work. Then run the full test suite, document tests, type check and build once.
Prove that a build refuses the local online flag. Run the local stack smoke check and stop all started servers by PID.
Check the touched views at 360x640, 390x844 and 1440x900. Record the complete results outside the repository in `runs/launch/merge2/merge.md`.

## Merge record

The three extras conflicts occur in the Home mapper, host tests and main game module.
The mapper keeps the canceled-game result and person recovery copy.
The tests keep the repair cases and add the extras cases.
The game module keeps the separate canceled-game screen, reader recovery, Home focus and expanded list.
It adds invite rows, invite counts, waiting copy and opponent pictures.
The local stack patch applies without a rejected hunk.
The stack seed also writes the sign-in provider for the new picture helper.

The first local smoke records a 29.935-second delay for the first reply.
Two new regression cases fail before the repair. The new page opts into a three-second watch after join or setup.
The shared poll keeps its default for old hosts. Home uses the same explicit option.
A viewed result leaves Your games as the approved Home rule requires. No result rule changes.
A failed picture keeps its initial through later polls.

## Related checks

The first complete related run passes 214 tests in 17 files.
The repair run passes 79 tests in four files.
Two real database picture and browser-role cases pass. The name filter leaves 26 other cases out.
The local browser passes 46 assertions at 360x640, 390x844 and 1440x900.
No console or page error occurs in that run. The report holds the final commands and their results.

## Final checks

The full unit run reports 6,938 passed, 3 failed and 385 skipped tests.
Two old plugin cases fail on page load. One old plugin case shows the wrong offline sentence.
The focused repeat passes all four selected cases. It filters out 239 cases.
The renderer phase then passes all 114 tests. The full suite is not a green run.

Type check and normal build pass. The build uses synthetic public account settings for browser checks.
A build with the local online flag exits 1 with the required refusal.
The built-page browser passes 102 assertions at the three required sizes.
It checks the online repairs and opponent pictures. No unexpected console or page error occurs.
The final local stack start, smoke and stop each exit 0. All four stack ports close.
The first reply takes 2.899 seconds. Five measured replies range from 2.899 to 3.234 seconds.
Both active Home rows show. Both results show. Each viewed result stays absent from Home after reload.

The report records document checks, visual evidence, limits and the remaining full-suite failures.
Live services, real sign-in, hosted migration, other browser engines and native phones are not checked.
No commit or deploy occurs. Apply migration 0025 before the new server code reaches a hosted service.
