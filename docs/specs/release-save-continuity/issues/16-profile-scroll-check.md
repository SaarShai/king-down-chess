# Check Profile parchment and trailing controls separately

Status: focused repair passes; independent review clear. Root owns the combined full-suite gate.

## Plan and verification

1. Work in an isolated tree at `3e979f1b`. Own only `tools/plugin-menus.test.ts` and this ticket. Keep all approved product layout and shared harness code unchanged.
2. Preserve the full-suite red reported by root. Wait for its exact assertion before claiming a cause. Add one bounded geometry diagnostic to the existing Profile scroll test. Capture body/roller/side-column/notices bounds, scroll metrics, font status and image readiness in assertion messages; keep the current assertions for the diagnostic run.
3. After the CPU grant, select only this case with the supported `KINGDOWN_TEST_FILE` and `KINGDOWN_TEST_NAME` filters through `npm test`. Do not use sleeps or wider timeouts. If the lower-bound failure is confirmed to follow the stacked side column, test that the parchment moves with the page, has no inner overflow and its complete bottom roller is reachable at its own end. Separately check the trailing Profile controls at the page end. Do not drop coverage or change layout to fit the old assertion.
4. Run the relevant focused case/suite after the repair, obtain independent review and run normal commit hooks only in the granted lane. Record commands, geometry, results and limits here. Do not report a full-suite pass from this selection.

## Source observation

At the test's 393px width, `.split` stacks the parchment above `.side-col`. Notices, badges, blocked players and navigation can make the trailing column taller than the scroll body's visible height minus the roller. A maximum page scroll can then place the parchment roller above the viewport even though it is reachable earlier. The source test checks this lower bound; the existing compiled roller helper does not. The same symptom can also come from unsettled font/image or host-inset geometry, so exact failure data is required before repair.

No test, build or hook runs during preparation. No product, archive, worker, schema or deployment change is in scope.

## Full-suite failure receipt

The root log `evidence/staging-next-ticket-candidates/u09-integrated/source-suite.log` reports this single Profile failure at original `tools/plugin-menus.test.ts:151`: `expected 143.09375 to be greater than or equal to 174`. This is the roller-top lower bound after the test scrolls to the maximum page offset. The registry overflow and roller-bottom upper bound pass. The source result does not yet establish the side-column dimensions or font/image readiness; keep the assertions for the focused diagnostic.

## Focused diagnostic and repair

The accepted source harness fix `9038f1cbb62db9b1c1b112890ed66210596314da` applies in this worktree as `a3a10c7e`, before the Profile diagnostic. No shared harness edit is made here.

With the original assertions retained, the diagnostic reproduces the lower-bound failure: body top/bottom `174/710`, visible height `536`, scroll height `1757`, maximum offset `1221`, parchment bottom `206.25` and roller top `142.25`. The trailing column is `471.25` pixels high and the notices section is `70.421875` pixels. The grid gap and body bottom padding add space after the parchment. Fonts report `loaded`, no image is pending and registry overflow is zero. This confirms the maximum-page-end assumption fails with the stacked trailing content; a readiness wait cannot repair it.

The test now scrolls the page until the parchment's bottom reaches the viewport's bottom. Both original full-roller bounds remain there. The test also requires positive page scroll and matching parchment/page movement within one pixel, retaining the no-inner-scroll intent. It then scrolls to the actual page end and checks that Collection and Settings are fully accessible with the existing clipping/safe-area helper, without locator auto-scroll. Product layout, harness, sleeps and timeouts stay unchanged.

Both runs select only this case:

```
KINGDOWN_TEST_LOCK_WAIT=60 KINGDOWN_TEST_FILE=tools/plugin-menus.test.ts KINGDOWN_TEST_NAME='scrolls the Profile' npm test
```

Red: one failed case and 12 unrelated filtered skips, with typecheck passing. Green: one passed case and 12 unrelated filtered skips, plus full typecheck and 54 art checks. The outer folder `evidence/staging-next-ticket-candidates/u09-profile-check/` holds `diagnostic-red.log` with geometry and `focused-green.log`. No full 13-case suite is repeated; root will run the combined full suite after integration.

Root's independent read confirms the roller, page movement, no-inner-scroll and trailing-control checks remain complete. No product fix is required. Normal commit hooks follow the focused green in the granted CPU lane.
