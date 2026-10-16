# Board model: the pure draft

Status: needs-triage
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

- [x] `npx tsc --noEmit` passes.
- [ ] `npm test` passes with the local test database.
- [x] `npm run -s check:browser plugin-ui` passes on the M1 in `kd-w7-model`.
- [x] Two independent readers find no open fault.
- [x] The diff changes only the two board model files and this ticket.

## Results

- The four functions are built. The UI and server files stay unchanged.
  The full-suite check stays open.
- `npx tsc --noEmit` passes.
- The final board test check passes: 39 tests, plus 50 figure tests.
- A reader finds one test gap. The added test checks a Haste move at the
  50-move draw limit. The reader confirms that it closes the gap.
- Two independent reviews find no open code fault.
- The full `npm test` check reports 2,586 passes, 8 skips and 3 failures in
  165 files. Search and Workshop judge reach their time limits. The Retry
  case at `tools/plugin-app.test.ts:1013` counts two calls instead of one.
  These three test files stay unchanged. No time limit changes.
- Each failed file passes alone with the same time limits: Workshop judge
  (12 tests), Search (18 tests) and the plugin app (67 tests).
- The M1 `plugin-ui` check passes on source commit `af27f6dd` in
  `~/projects/kd-w7-model`. The log is `/tmp/kd-w7-model-browser.log`.
  Its output folder is `kd-w7-model-htdJzx`. The checkout stays clean.
- The extra full-suite repeat does not start. It waits for the shared test
  lock. I stop this queued repeat by its process IDs. The first full-suite
  result above stays recorded in `/tmp/kd-w7-model-all-tests.log`.
- The three full-suite failures are outside this ticket's scope. No requested
  function is missing. No source fault remains from either review.
- Taste choices: none. The turn words come from `src/turn.ts`.
