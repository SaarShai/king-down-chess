# The wait line of test-lock.sh names the holder of the lock

Status: done (PR 466)

Source: [retro](../retro.md), item 14

## Problem

When `tools/test-lock.sh` waits for the machine lease or the test lock, its line names only the lock file. The check runner's wait line (`tools/lib/lock.mjs`) names the PID and the folder of the holder. During the retro a 22 s test run waited more than 6 minutes for a lane that the line did not name.

## Change

- `tools/test-lock.sh`: after a run takes a lock, it writes one line `<pid> <folder>` to `<lock>.holder`. The PID is the PID of the command, because Perl becomes the command. The folder is the current folder of the run. The script never writes to the lock file itself, so its dev:ino (`KINGDOWN_MACHINE_LEASE_ID`) does not change.
- A run that waits reads the record. When the PID is alive, the line is `test-lock: waiting for the test lock (<lock>; held by pid N, <folder>)`. When the PID ended, the line says `holder unknown, last record: pid N, <folder>, ended` and does not call that process the holder. When the record is missing or cannot be read, the line is the old line.
- A failed write or read of the record changes nothing else: the order, the wait limit and the exit codes stay the same. The script uses the record only when it is a regular file, or when it does not exist: it does not open a named pipe (an open of one waits for the other end) and it does not write through a link.
- The header comment of the script tells this. `docs/COMPUTE.md` does not quote the wait line, so it does not change.
- `tools/machine-lease.test.ts`: a deploy that waits for the machine lease names a holder PID and the folder of the other copy. The test uses a temporary HOME, not the real machine lease.
- `tools/test-lock.test.ts`: the first test checks the PID and the folder in the line. The second test checks "holder unknown, last record" after the run is killed while its child keeps the lock. A new test makes the record path a folder (no write, an empty read) and checks that the wait line and a later run do not change; this test also passes with the old script, so it guards the behaviour and is not a red-first test. A second new test puts a named pipe, then a link, in the place of the record: the run ends, and the target of the link keeps its text.

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
- Each run leaves its record when it ends. A record shows as "last record" while the children of a killed run hold the lock, or while a run of the old script (a worktree or branch without this change) holds it. The line then says "holder unknown": the folder in it is the folder of the last run of the new script, not of the holder. This occurs in normal work until each worktree has the new script. When the system gave the old PID to a new process, the line names that process.
- A waiter can read the record in the short time before the new holder writes it. The line then shows the record of the previous holder, as a last record.
- The holder writes the record; no step removes it when the run ends. The next holder writes over it.
- A PID with more digits than the system uses makes the alive test say yes, and a control character in a folder name goes to the line as it is (the check runner prints its folder in the same way). The record is in a folder that only the user can write.

## Review

- Review: an agent that did not build the change read head `4bbbda682`. It found no blocking fault. One batch repairs its notes: the script does not open a named pipe or a link in the place of the record, and the line says "holder unknown, last record" where it said "old record".
- Repair check: the same reviewer read `8328bbc5d`. Each repair holds. No blocking fault remains.
- Open findings: none that block. The notes are in "Known limits".
