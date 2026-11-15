# Repair the local online stack

Status: resolved

## Scope

Fix all seven faults in the local stack review. Keep the current feature set.
Add the missing guard cases. Export the full patch against its first base.

## Checks

Run the related unit cases during the repair.
Then run the full test suite, type check, build and local browser smoke check.
Confirm that a development-mode build refuses the local online flag.
Record the results and unchecked paths in `../run/fix.md`.

## Results

All seven repairs are complete. The related unit run passes 48 cases in three files.
The development-mode build with the local flag exits 1. It refuses the build.
The type check and normal build each exit 0.
The full suite reports 6,875 passed, 49 failed and 384 skipped cases.
The failures occur in the deploy, tool-gate and animation-bank test files.
Their errors include test paths with spaces and a missing animation check value.
These three test files stay unchanged by this repair.

The local stack start, browser smoke check and stop each exit 0.
The start recovers from a corrupt PID file with an inherited staging setting.
The smoke check covers an invite, six moves, reload, game lists and resignation.
The smoke files use `.local-online/smoke`. The unused socket folder is absent.
All four stack ports close after the stop.

The patch and full report go to `../run/localstack.patch` and `../run/fix.md`.
Real providers, email delivery and hosted services are not checked.
