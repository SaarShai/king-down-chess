# Plugin test clock races

Status: in-progress
Type: task

## Plan and checks

1. Read the three CI failures. Use a temporary probe for each cause.
2. Fix each proven cause in a separate commit. Keep all assertions and time limits.
3. Check all eight plugin test files that install a page clock. Record each result.
4. Run each changed test file twice on the M1 with `m1-unit.sh`. Run `npx tsc --noEmit`.

The probes must fail before each fix and pass after it. Remove the probes from the final commits.
The owner reserves the full suite and browser checks for the main session.

## Evidence

The branch starts at `2d48c2be`. Ticket 59 already fixes the first busy-Start read.
The M1 device name, account, hardware and SSH server fingerprint match the project record.
