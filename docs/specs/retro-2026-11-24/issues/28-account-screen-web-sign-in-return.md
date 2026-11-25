# Open each account route after web sign-in

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- `src/interface/play/main.ts:283-286`: after sign-in, the web app acts on `returned.route.screen` only for `new-friend`, `join` and `game`. `play`, `profile` and `settings` fall through, and a new account screen also falls through. No type or test finds it.
- `src/interface/play/main.ts` is a GUI session file. Only the GUI session may change it.

## Change
For the GUI session. A behaviour change.
- Replace the `if` chain with a `switch (route.screen)` that has a `default` with a `never` check (`const missed: never = route; void missed;`).
- Give `play`, `profile` and `settings` an explicit action (for example open the home menu, open the profile sheet, open settings), or an explicit `break` with a comment that says why nothing opens.

## Test that fails first
- Add `'records'` to `ReadRoute` in a scratch copy. `npm run typecheck` must fail at the `never` check in `src/interface/play/main.ts`.
- Revert: typecheck green; the sign-in return tests of the GUI session green.

## Known limits
- The `never` check makes a person decide the action. It does not prove the action is correct; a browser check of the sign-in journey does that.

## Work record
Not started.
