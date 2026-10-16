# Board model: the pure draft

Status: claimed
Type: task

## Scope

Build W7 design section 8, ticket 02. Add `draftTurn`, `sendActions`,
`draftChoices` and `restoreDraft` to `src/plugin/screens/board-model.ts`.
Use `src/turn.ts`. Keep the UI and server files unchanged.

## Plan

1. Add the four functions. Keep the server view and input positions unchanged.
2. Test each case in design section 7. Test the saved half turn and rules reset.
3. Run the type check, unit tests and M1 `plugin-ui` check. Get two independent
   reviews. Fix each confirmed fault. Record the results and commit the change.

## Verification

- `npx tsc --noEmit` passes.
- `npm test` passes with the local test database.
- `npm run -s check:browser plugin-ui` passes on the M1 in `kd-w7-model`.
- Two independent readers find no open fault.
- The diff changes only the two board model files and this ticket.

## Results

- The four functions are built. The UI and server files stay unchanged.
- `npx tsc --noEmit` passes.
- The first board test check passes: 38 tests, plus 50 figure tests.
- A reader finds one test gap. The added test checks a Haste move at the
  50-move draw limit. The reader confirms that it closes the gap.
- Two independent reviews find no open code fault.
- The full `npm test` check reports 2,586 passes, 8 skips and 3 failures in
  165 files. Search and Workshop judge reach their time limits. The Retry
  case at `tools/plugin-app.test.ts:1013` counts two calls instead of one.
  These three test files stay unchanged. No time limit changes.
- The final board test check, the isolated judge check and the M1 browser
  check are pending.
- Taste choices: none. The turn words come from `src/turn.ts`.
