# The wait line of test-lock.sh names the holder of the lock

Status: ready-for-review

Source: [retro](../retro.md), item 14

## Problem

When `tools/test-lock.sh` waits for the machine lease or the test lock, its line names only the lock file. The check runner's wait line (`tools/lib/lock.mjs`) names the PID and the folder of the holder. During the retro a 22 s test run waited more than 6 minutes for a lane that the line did not name.

## Change

- `tools/test-lock.sh`: after a run takes a lock, it writes one line `<pid> <folder>` to `<lock>.holder`. The PID is the PID of the command, because Perl becomes the command. The folder is the current folder of the run. The script never writes to the lock file itself, so its dev:ino (`KINGDOWN_MACHINE_LEASE_ID`) does not change.
- A run that waits reads the record. When the PID is alive, the line is `test-lock: waiting for the test lock (<lock>; held by pid N, <folder>)`. When the PID ended, the line says `old record: pid N, <folder>, ended` and does not call that process the holder. When the record is missing or cannot be read, the line is the old line.
- A failed write or read of the record changes nothing else: the order, the wait limit and the exit codes stay the same.
- The header comment of the script tells this. `docs/COMPUTE.md` does not quote the wait line, so it does not change.
- `tools/machine-lease.test.ts`: a deploy that waits for the machine lease names a holder PID and the folder of the other copy. The test uses a temporary HOME, not the real machine lease.
- `tools/test-lock.test.ts`: the first test checks the PID and the folder in the line. The second test checks "old record" after the run is killed while its child keeps the lock. A new test makes the record path a folder (no write, no read) and checks that the wait line and a later run do not change.

## Checks

- Red, before the change: `KINGDOWN_TEST_FILE=tools/test-lock.test.ts KINGDOWN_TEST_NO_TYPECHECK=1 npm test`: 2 of 4 tests fail. The line has no holder (`expected 'test-lock: waiting for the test lock …' to contain '… held by pid …'`).
- Green, after the change: the same command, 4 of 4 tests pass.
- `KINGDOWN_TEST_FILE='tools/{machine-lease,test-lock-guard}.test.ts' KINGDOWN_TEST_NO_TYPECHECK=1 npm test`: 16 of 16 tests pass.
- After the new machine lease assertion, `KINGDOWN_TEST_FILE='tools/{machine-lease,test-lock}.test.ts' KINGDOWN_TEST_NO_TYPECHECK=1 npm test`: 18 of 18 tests pass.
- The real records after these runs: `$HOME/.cache/kingdown/machine.lock.holder` and `kingdown-test.lock.holder` in the git common dir each hold the PID of the run and the folder of this worktree.
- `npm run typecheck`: exit 0.
- `npm run test:docs`: 199 tests pass, 1 skipped.

## Known limits

- The record holds a PID. When the system gives that PID to a new process after the holder ended, the line names the new process as the holder.
- Each run leaves its record when it ends. A record shows as "old" while the children of a killed run hold the lock, or while a run of the old script (a worktree or branch without this change) holds it. The line then does not name the real holder. When the system gave the old PID to a new process, the line names that process.
- A waiter can read the record in the short time before the new holder writes it. The line then shows the record of the previous holder, as an old record.
- The holder writes the record; no step removes it when the run ends. The next holder writes over it.
- Item 14 of `retro.md` still says "into the lock file", and its line "Items 13, 14 and 16 stay open" does not change. Other lanes edit the same file.
