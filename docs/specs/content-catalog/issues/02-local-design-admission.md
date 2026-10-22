# Reject local designs at account game admission

Type: task
Status: resolved
Parent: U06

## Plan and checks

- Extend the existing HTTP start rejection test with forged `options.design` and a lab-only `pool: ['T']`.
- Require HTTP 400 / `INVALID_INPUT` and no game creation or tool-try service call.
- Run `KINGDOWN_TEST_FILE=src/api/http.test.ts npm test` after the shared browser checks release the test slot. Change no product code unless the check proves a fault.

## Content scope

The integrated card catalog is `16be4639`. Existing `LETTERS`/`NAMES`, `KINGS`, `POWER_NAME` and `powerOptions` already own most piece and power identity, names and contextual text. Keep these sources. Do not add a parallel piece/power catalog for symmetry. Consolidate a duplicated fact only when a current consumer or change needs it.

## Evidence

Base: `25d7bd87`. After the shared browser checks finish, `KINGDOWN_TEST_FILE=src/api/http.test.ts npm test` passes: 56 HTTP tests, full typecheck and 54 artwork checks. Log: `/tmp/kingdown-u06-design-admission-tests.log`.

Both forged requests return HTTP 400 / `INVALID_INPUT`. The existing no-call assertions confirm that neither game creation nor tool-try work starts. The strict options boundary already blocks local designs; no product fix is needed. `git diff --check` passes. No browser, build, database or deploy runs. Independent review and integration stay with the parent task.
