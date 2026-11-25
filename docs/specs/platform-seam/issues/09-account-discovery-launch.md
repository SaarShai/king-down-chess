# The account discovery check follows the launch tree

Status: ready-for-agent.

Class: B (a check script only). Size: S to M.

Source: ticket [06](06-ci-launch-tree.md), "Found fault".

## Problem

- `account-discovery` runs only by name. Since ticket 06 its site is the launch tree, and the check is red: it stops at `tools/lib/account-discovery-check.mjs:81`.
- At that line the check is on the sign-in page of `/play/` and follows "Play on this device". The link goes to `/` (`src/online/entry.ts:67`). On the launch tree `/` is the new page. The check waits for the old board there.
- Lead decision, 2026-11-25: the link is correct. On the launch tree, `/` is the page where a player plays on this device. The check is wrong, not the page.

## Change

- From line 81 on, the check follows the journey of the launch tree: the link opens the new page, and each later step uses the new page. A step that is about the old board only uses `oldBoard()` (`tools/lib/checks.mjs`).
- A step that has no meaning on the launch tree goes, with a `Removed-check:` trailer that gives the reason.

## Test that fails first

The check itself: `npm run check:browser account-discovery` is red today at line 81.

## Checks

- `npm run check:browser account-discovery` is green.
- `KINGDOWN_TEST_FILE=tools/checks.lint.test.ts npm test`.

## Known limits

- Ticket [07](07-remove-off-build.md) removes the off build. Do this ticket before ticket 07 or with it.
