# Fix the HTTP invite error check

Status: in review

## Scope and plan

The owner asks for one CI fix on PR #198. Change only this check and this ticket.

1. Run `plugin-ui-http` on the supplied local test database.
2. Trace the failed Open reply. Use an invalid invitation for the error case.
3. Keep the board, preview and remount assertions. Run both browser checks,
   the affected unit tests and the doc checks. Commit and push the fix.

## Cause

The local run fails at `tools/plugin-ui-check.mjs:3073`, as in CI.
The second case expects the host's own open invitation to fail.
`src/match/service.ts:568` allows that preview. The fixture refuses it at
`tools/plugin-protocol-fixture.ts:157`.
The old typed-code steps make more short-code requests. They reach the
hourly limit in `src/match/store.ts:166`, which hides the wrong expectation.
The link steps remove those extra requests.

## Fix and checks

Replace the invitation before the error case. Its old link must fail in both
services. Check the error code too, so the hourly limit cannot hide a fault.
The join preview, failed mount and remount assertions stay.

Required checks: `plugin-ui-http`, `plugin-ui`, affected unit tests and
`npm run test:docs` must pass. Record the commands and counts here.

## Evidence

Use `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_fixffaus5_test`
for both browser commands and the unit command below.

- Before the fix: `npm run check:browser plugin-ui-http` fails at line 3073.
  Log: `/private/tmp/fix198-reproduce.log`.
- After the fix: `npm run check:browser plugin-ui-http plugin-ui` passes
  both checks (315.3 s and 294.7 s). Log: `/private/tmp/fix198-browser.log`.
- `KINGDOWN_TEST_FILE='{src/plugin/{invite,server,server.db}.test.ts,tools/{plugin-ui-check,plugin-join-review,plugin-protocol-fixture}.test.ts}' npm test`:
  112 tests pass in 6 files. Both type checks and all 67 art checks pass.
  This is a focused pass. Log: `/private/tmp/fix198-unit.log`.
- `npm run test:docs`: 186 tests pass in 17 files.
  Log: `/private/tmp/fix198-docs.log`.

The final diff adds three check lines. It changes no product code and removes
no assertion. No other browser checks or full unit suite run for this fix.
