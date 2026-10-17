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
