# CI WebKit: the plugin-ui page crashes from held console objects

Status: claimed
Type: task

## Scope

CI run 39230893586 (PR 63, commit `3486ab42`) failed in the job
`browser-webkit`, step `npm run check:browser plugin-ui`, after 757 s.
The page target closed in `clickButton` (`tools/plugin-ui-check.mjs:45`,
from `sendTurn` at :1695, called at :3134). Then `page.evaluate` at :3185
reported `Target crashed`. The same check passed on `19e9ebef`, and a
re-run of the same job passed. PR 63 does not change any file that this
check runs. So the crash is intermittent, and memory growth is the
suspected cause. This ticket follows [ticket 45](45-pr61-linux-ci.md).

Find the cause and fix it. Do not add a retry. Do not raise a limit or
the STEP factor. Do not remove an assertion. Prove the fix with CI
WebKit passes. Do not merge.

## Plan and checks

1. Read the CI log. Audit every page and context that the check opens.
2. Measure in Mac WebKit: the Playwright handles that are not disposed,
   and the memory of each WebKit process, before and after the fix.
3. Fix the cause. Add a regression test that fails without the fix.
4. Measure on the CI runner: baseline and fix, with and without the host
   reloads of `freshHost()`, three jobs each.
5. Run the final branch in CI. Record the results here and in the PR.
