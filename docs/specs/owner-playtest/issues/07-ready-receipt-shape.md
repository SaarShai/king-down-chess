# Save a Ready receipt in the old page's shape

Status: ready-for-agent
Type: task
Severity: Low

## Problem

The receipt keeps the old page's shape, so each page can send the other's saved command again (`src/interface/people/receipt.ts`, header). For `kingdown_choose` the old page keeps `king`, `order` and `ready` at the top level of the arguments (`src/plugin/server.ts:180`, `src/online/runtime.ts:113`).

`receiptOf` (`receipt.ts:23` at `c76f0493f`) spreads the action fields, so it saves a Ready as `choice: { king, order }` and `ready`. The decoder `actionOf` (`receipt.ts:35`) reads `king` and `order` from the top level. So a Ready that the new page sends again from its own receipt (Check again, `controller.ts:282`) has no king and no order. The old page reads the same receipt the same way.

The re-review of r11 names this item (`runs/launch/release/review367r2/checks.md`). Main (`b53b99760`) has the same code, so PR 367 does not add it. The accepted-command tests settle by the server revision with no resend, so they do not reach this path.

## Repair

- In `receiptOf`, save a `choose` action as the old page does: `king`, `order` and `ready` at the top level.
- In `actionOf`, read `king` and `order` from the top level, or from `args.choice` when the top level has none. Receipts from the old page and receipts that the new page saved before the repair then both stay readable.

## Checks

- First a failing test: a Ready whose send fails with no known answer, then Check again. The resent command has the same king, order, ready and command ID as the first send.
- A Ready receipt in the old shape and one in the `choice` shape both decode to the same action.
- A Ready receipt that the new page saves decodes the same in `actionOf` (`receipt.ts`) and in the old page's decoder (`runtime.ts:113`).
- `npm test`, `npm run test:docs`, `npm run typecheck` and `npm run build` pass.
