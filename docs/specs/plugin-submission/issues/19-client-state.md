# Client state: S5 review fixes

Status: resolved

## S1 to S5 recheck: plan and checks

Check Review A items 1 to 5 and Review B items 1 to 3 at `4e8c1be7`.
Add a test for each confirmed fault. Keep the start job from the Settings save
through Create and its later steps. Keep the start king with its saved command.
Stop an old error route and computer recovery read. Keep only the newest list
reply in one epoch. Check the mount lock before a held read returns, then check
its data and each active error line. Test a failed initial Settings read.

Run the source unit suite through `npm test` with the required test database.
Commit the fixes, then run `plugin-ui` through the owner's check runner.
Record the findings, checks and final head in this ticket and the lane report.

### Findings and tests

All seven distinct faults are confirmed. A1 and B1 describe the same fault.

| Review | Fix | Test |
|---|---|---|
| A1, B1 | The first Start keeps one origin before Settings, Create and each later step. An old save sends no Create and shows no error on Profile. | The app holds a friend setup save across Profile, with both success and error replies. |
| A2 | A command keeps its own error. Its old job cannot route Home to Play. | The app holds Choose across Home, then checks the saved error and Retry on Play. |
| A3 | A list reply must be from the newest list request in its epoch. | The app releases two lists in reverse order across navigation, with no chat result. The list and count stay current. |
| A4 | Each saved start keeps its king choice, including an automatic choice. Choose and Get keep that choice. | App tests cover another setup draft, Retry and inline remount with changed Settings. Client tests cover the saved choice and null. |
| A5 | The slow mount-read tests check the lock before release, then the returned data and all error lines. | The source-page test and the named browser check hold Settings, Get and Games for 20 seconds. |
| B2 | The computer reads the full outcome. It stops on superseded. Its recovery read keeps the original job. | The named browser check holds a computer reply, opens a new game, then checks one mount read and Seat. |
| B3 | A failed Settings read keeps the start for Retry. Retry loads Settings before it sends Create. | The app fails the mount read and one Retry, then checks the same Create ID and the saved king on success. |

The new app cases fail on the old source: six failures and the reported unhandled
Settings exception. The fixed source passes 119 files: 1,739 tests pass and 8 skip.
The type check and all 50 document checks pass. The last app-only run also checks
the explicit saved king after Settings changes: all 29 cases pass.
Browser checks follow the fix commit. No server code or check limit changes.

The first named browser run passes the computer case. It then finds a test wait
for a hidden Home button. The test now checks that the button is enabled in the
DOM. Seat stays visible. Two temporary source controls restore the 10-second
limit, first for Get and then for Games. Both named browser runs fail at the new
mount-lock assertion before release. The final source restores the SDK limit.
The controls prove that the new assertions catch each reported timeout fault.
The control logs are `checks-recheck-timeout-control.txt` and
`checks-recheck-list-timeout-control-2.txt` in the state-review lane.
One earlier Games control selects this Mac and cannot start Chromium because
the browser executable is absent. The next run uses the M1 through the same
check runner. No browser or dependency installation changes.

### Final recheck results

The fixed source is `4068e1a0`. All seven findings are fixed. None is refuted.

| Check | Result | State-review lane log |
|---|---|---|
| `npm test`, `KINGDOWN_TEST_FILE='src/**/*.test.ts'`, with the required local test database | 119 files pass. 1,740 tests pass and 8 skip. The type check and all 50 document checks pass. | `recheck-source-final.txt` |
| Required check runner, `plugin-ui`, on the M1 | Pass in 154.5 seconds. Final line: `check-runner: M1 exit 0 at 4068e1a0`. | `checks-recheck-final.txt` |
| Temporary 10-second mount Get control | Fails at the new lock assertion before release, as required. | `checks-recheck-timeout-control.txt` |
| Temporary 10-second mount Games control | Fails at the new lock assertion before release, as required. | `checks-recheck-list-timeout-control-2.txt` |

The final record commit changes this ticket only. Its product and test files
match the passing head. The source-page browser file does not run on this Mac.
Its three slow mount cases also run in the passing named check. `plugin-ui-http`
does not run because no server code changes. No check limit changes.
All test and check commands end before the final report.

Base: `c8cf0822`. S0: `1ab1975d`. S5 starts at `a5cac8f8`.
The source ticket and design are in the owner's scratchpad, under `tickets/`.

## Plan and checks

Current fix round: check all 11 faults in the S1 to S5 reviews at `2b7c98f3`.
Keep the first send and Retry under the same job gate. Use the shared Start lock.
Keep unrelated command receipts. Gate reads, list updates and teardown writes.
Restore the saved king before the inline resend. Strengthen the clock and R3 tests.
Each confirmed fault gets a test. Run `npm test`, commit, then run `plugin-ui`
through the owner's check runner. Record each finding, the head and the results.
The checks must hold replies across a newer result or teardown. They must check
the saved king, unchanged command input, one game and the accepted revision.

1. Check both reviews against the source. Add a test for each confirmed fault.
2. Keep the start job through its steps. Restore the game ID before Retry. Load saved history before the draft. Keep the draw note beside T6.
3. Use a real two-player game for D10. Check the saved turn after the second press. Test a retained start failure through the app.
4. Remove duplicate state and call paths. Measure source lines against S0. Keep the required behavior and code layout.
5. Run unit tests with `npm test`. Commit, then run `plugin-ui` with the required check runner. Run `plugin-ui-http` if server code changes. Record the check results and final head.

The checks must prove that a late Choose keeps Profile open, an unresolved game command stays available, a refusal stays on its game, draft move text survives a full read, and a second press saves the turn after a real draw offer.

## Current findings

Both reviews describe 11 distinct faults. The source confirms all 11.

| Fault | Review | Fix and test |
|---|---|---|
| 1. First Choose or Cancel can replace Profile | A1, B1 | First Start steps use the same continuation gate as Retry. The call adapter drops an older job's view. Held Choose, Get and friend Cancel tests keep Profile. |
| 2. Start is on but sends nothing | A4, B2 | The handler and the button use the shared Start lock. A test starts Play now with a lost Move from another game. |
| 3. A refused read clears another command | A2, B3 | A refusal clears only its own retained command. Foreground and remount tests keep the other game's receipt and Retry. |
| 4. An old Try again opens Board over End | A3 | User reads advance the epoch. Routes use accepted views. A test releases two reads in reverse order and checks End and revision 2. |
| 5. Mount Get has the command limit | A5 | The mount passes its job and SDK limit through Get and the list. Unit tests check the transport options. Browser cases hold each mount read for 20 seconds. |
| 6. A poll sends Seen after teardown | A6, B6 | The poll checks its outcome, epoch, board, game and screen after Get. Tests leave by teardown, Profile and another game. |
| 7. An old list replaces the new list | A7 | Every list read uses a queue job. Its data and later board redraw use the same gate. Tests release the old list after a chat result and teardown. |
| 8. The clock test permits two games | A8 | The test checks the same nonempty command ID, full input, returned game and one new server game for each clock offset. |
| 9. R3 starts after the held read ends | A9, B7 | R3 starts the read without a wait. It proves that the read is pending before Profile opens. It checks that both held transport calls still run before release, then checks the screen and view. |
| 10. Inline Create uses the default king | B4 | The resend loads the saved setup when no draft exists. The inline mount test checks Flame/Haste in the Choose input. |
| 11. Late Create saves after teardown | B5 | Receipt settlement and the final render stop when the queue closes. A test checks no later widget write and keeps the saved command. |

The first-Get test also finds a retained read that the mount can resend while it
still runs. The queue counts retained reads until their bodies end. A queue test
checks that count across a new chat result. Rollback reads keep their parent epoch.

The first named browser check at `ff199de7` fails at the first solo Start. The new
view gate also blocks a valid Choose reply that needs a full rules read. The gate
now accepts the reply for its caller before drawing. Drawing and routing still
need the rules. A new unit checks Create, Choose, Get and the final Board screen.
The first app browser file has the same cause in nine tests. Its other 118 tests
pass. The source run without the database passes 1,608 tests and skips 130 tests.

## Current verification

All 11 findings are fixed. Each has a unit test or a stronger browser test.

| Check | Result | Log in the owner's state-review lane |
|---|---|---|
| `npm test`, with `KINGDOWN_TEST_FILE='src/**/*.test.ts'` and the required local test database | 119 files pass; 1,731 tests pass and 8 skip. The type check passes. | `fix-source-units-2.txt` |
| `npm test`, with `KINGDOWN_TEST_FILE='tools/plugin-races.test.ts'` | All 42 tests pass, including the final R3 assertion. | `fix-races-browser-2.txt` |
| `npm test`, with `KINGDOWN_TEST_FILE='tools/plugin-app.test.ts'` | All 127 tests pass, including the three slow mount reads and both clock offsets. | `fix-app-browser-2.txt` |
| The 50 document tests in each successful `npm test` run | All pass. | The same logs |
| Required check runner, `plugin-ui` | M1 passes at `d8a4944d` in 156.1 seconds. Final line: `check-runner: M1 exit 0 at d8a4944d`. | `checks-fix-3.txt` |

The last commit adds this check record and the R3 transport assertion. The product
code matches the passing M1 check. `plugin-ui-http` does not run because no server
code changes. No test or check time limit changes.

Against `2b7c98f3`, this fix round changes source by `+75 / -47`, net `+28`.
The size cleanup stays in S6, as the owner directs in the source ticket.

## Prior findings

Review A has six findings. Review B repeats five of them and adds the setup Retry with no game ID. All seven faults have a matching source path. The source size gate also fails at the base.

| Review | Result | Change and test |
|---|---|---|
| A1 / B1 | Fixed | A continuation keeps its first job through Choose and Get. Each call checks that job after the reply. A late reply cannot replace another game's view. The app unit and the held-Choose browser case check this path. |
| B2 | Fixed | Retry resolves the game ID before it sends. If it cannot resolve that ID, it keeps the command and sends nothing. App units cover both Move and Choose after a remount. |
| A2 / B3 | Fixed | The send and its refusal use the same resolved input. The app unit checks a refused Retry, Settings, and another game. |
| A3 / B4 | Fixed | The board loads saved history before it restores the draft. D9, D10 and D13 check both move text fields after a remount or a full redraw. |
| A4 / B5 | Fixed | T6 keeps the draw offer note after the rollback read. D10 uses a draw offer from the other player's server fixture. |
| A5 / B5 | Fixed | D10 checks the saved revision, full FEN, history, cleared offer, cleared draft and settled command after the second press. It has no forced refusal. |
| A6 | Fixed | The new unit uses the app's real retained call and the router's pending input. It checks that Start settles while Retry stays available. The S4 router fails this assertion; the current router passes. |

## Prior size gate

The owner moves this gate to S6. These figures record the prior round.

- Against S0: source `+880 / -402`, net `+478`. With tests: `+1504 / -434`, net `+1070`.
- Against S4: source `+170 / -205`, net `-35`. With tests: `+312 / -211`, net `+101`.
- This fix round: source `+94 / -127`, net `-33`.

The cleanup removes the second pending field, the setup recovery timer and its extra games read, the second saved-pending snapshot, the unused result classifier, and unused queue fields. It does not change code layout to reach a count. These removals do not meet the required net reduction against S0. That gate still needs a larger change to the store and queue.

## Prior verification

The final source unit run passes 119 files: 1,712 tests pass and 8 skip. All 50 document checks pass. The six client files also pass 70 tests.

The first D10 check finds an invalid combination of game options in the new test. The next check finds a wrong expected FEN. Set a game's rules before `fromFen`: that read uses the current rules for castling rights. Both test paths now do this.

The board file passes all 76 tests. The race file passes all 42 tests. The app file passes all 125 tests. Each file runs alone through `npm test` and the test lock.

The browser run also finds a Seat lock fault. An older retained Get can remain after a new game opens. Seat checks any pending command, so Ready stays off on the new game. A new browser case restores a failed read of game A on game B's Seat. It fails at `4520e133`. Seat now uses the shared current-game lock for Ready, Abort, the bounded Ready retry, and its full read. The seven Seat and client unit files pass all 74 tests after that change.

The required check runner passes `plugin-ui` on the M1 at `2dbc6079` in 148.5 seconds. Its final line is `check-runner: M1 exit 0 at 2dbc6079`. The check includes the held-Choose case, the restored draft text, the real draw offer and second press, and the Seat lock case. The MCP resource payload is 741,053 JSON bytes. The build enforces the 1,000,000-byte limit.

Earlier browser runs fail at the 197 px board width and at the 360 px end-card width. The saved S5 run 8 at `c8cf0822` has the same 360 px failure. The next run passes the 197 px case, and the final run passes both. No layout code changes. The temporary bounds probe is removed. These results do not prove a cause for the intermittent layout failures.

WebKit does not run. The branch has no named WebKit journey check. `plugin-ui-http` does not run because no server code changes. No test or check time limit changes. No command remains active at the end of the checks.
