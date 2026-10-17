# Client state: S5 review fixes

Status: in-progress

Base: `c8cf0822`. S0: `1ab1975d`. S5 starts at `a5cac8f8`.
The source ticket and design are in the owner's scratchpad, under `tickets/`.

## Plan and checks

1. Check both reviews against the source. Add a test for each confirmed fault.
2. Keep the start job through its steps. Restore the game ID before Retry. Load saved history before the draft. Keep the draw note beside T6.
3. Use a real two-player game for D10. Check the saved turn after the second press. Test a retained start failure through the app.
4. Remove duplicate state and call paths. Measure source lines against S0. Keep the required behavior and code layout.
5. Run unit tests with `npm test`. Commit, then run `plugin-ui` with the required check runner. Run `plugin-ui-http` if server code changes. Record the check results and final head.

The checks must prove that a late Choose keeps Profile open, an unresolved game command stays available, a refusal stays on its game, draft move text survives a full read, and a second press saves the turn after a real draw offer.

## Findings

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

## Size gate

The gate still fails. S5 stays open.

- Against S0: source `+880 / -402`, net `+478`. With tests: `+1504 / -434`, net `+1070`.
- Against S4: source `+170 / -205`, net `-35`. With tests: `+312 / -211`, net `+101`.
- This fix round: source `+94 / -127`, net `-33`.

The cleanup removes the second pending field, the setup recovery timer and its extra games read, the second saved-pending snapshot, the unused result classifier, and unused queue fields. It does not change code layout to reach a count. These removals do not meet the required net reduction against S0. That gate still needs a larger change to the store and queue.

## Verification

The final source unit run passes 119 files: 1,712 tests pass and 8 skip. All 50 document checks pass. The six client files also pass 70 tests.

The first D10 check finds an invalid combination of game options in the new test. The next check finds a wrong expected FEN. Set a game's rules before `fromFen`: that read uses the current rules for castling rights. Both test paths now do this.

The board file passes all 76 tests. The race file passes all 42 tests. The app file passes all 125 tests. Each file runs alone through `npm test` and the test lock.

The browser run also finds a Seat lock fault. An older retained Get can remain after a new game opens. Seat checks any pending command, so Ready stays off on the new game. A new browser case restores a failed read of game A on game B's Seat. It fails at `4520e133`. Seat now uses the shared current-game lock for Ready, Abort, the bounded Ready retry, and its full read. The seven Seat and client unit files pass all 74 tests after that change.

The required check runner passes `plugin-ui` on the M1 at `2dbc6079` in 148.5 seconds. Its final line is `check-runner: M1 exit 0 at 2dbc6079`. The check includes the held-Choose case, the restored draft text, the real draw offer and second press, and the Seat lock case. The MCP resource payload is 741,053 JSON bytes. The build enforces the 1,000,000-byte limit.

Earlier browser runs fail at the 197 px board width and at the 360 px end-card width. The saved S5 run 8 at `c8cf0822` has the same 360 px failure. The next run passes the 197 px case, and the final run passes both. No layout code changes. The temporary bounds probe is removed. These results do not prove a cause for the intermittent layout failures.

WebKit does not run. The branch has no named WebKit journey check. `plugin-ui-http` does not run because no server code changes. No test or check time limit changes. No command remains active at the end of the checks.
