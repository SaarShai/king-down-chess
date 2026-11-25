# Eight checks that run by name are red on main

Status: ready-for-agent.

Class: B (check scripts only). Size: M.

Source: ticket [06](06-ci-launch-tree.md), "Red and green".

## Problem

- These checks run only by name, not in CI: `layout-title`, `stratus-registration`, `lessons`, `link-game`, `lesson-return`, `workshop`, `workshop-cast`. Each is red on the off tree and on the launch tree, with the same assertion or time-out at the same line. The logs of ticket 06 show this.
- `stratus-idle-exit` is red too. On the off tree it stops at `tools/verify-stratus-idle-exit.mjs:36`. On the launch tree it passes line 36 and stops at line 121. No run proves that the fault at line 121 is old.
- Five of them test parked features: `lessons`, `link-game`, `lesson-return`, `workshop`, `workshop-cast` ([PARKED.md](../../../PARKED.md)).
- A check that is always red tells an agent nothing, and each run of it costs minutes ([the retro](../../retro-2026-11-24/retro.md), item 1).

## Change

For each check, one of three results, with the evidence in this ticket:

- The page has a fault: write the ticket of that fault. The check stays.
- The check is stale: repair the check.
- The feature is parked: decide with PARKED.md if the check stays for the return of the feature. If it goes, it goes with a `Removed-check:` trailer that gives the reason.

## Test that fails first

Each check is red today: `npm run check:browser <name>`.

## Checks

- Each of the eight is green, or is gone with its trailer, or has a ticket for the fault of the page.
- `KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test` and `npm run test:docs`.

## Known limits

- `recovery-consumers` did not run in ticket 06: it needs `KINGDOWN_WEB_RECOVERY_OUTPUT` from outside. It is not a part of this ticket.
