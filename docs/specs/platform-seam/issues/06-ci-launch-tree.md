# CI builds the tree that ships

Status: needs-triage. Waits for the owner's approval of [the spec](../spec.md).

Class: B (check scripts and CI only). Size: M, or L if many checks need more than a new start address.

## Problem

- Each shipped form builds with `KINGDOWN_SOLO_LAUNCH=1` (`tools/release/profile.sh`, `tools/ios-sync.sh`).
- The build step of CI (`.github/workflows/plugin-checks.yml:85`), the check runner (`tools/check.mjs:183`) and the own build of `tools/web-game-check.mjs` do not set it. They build the off tree, which no form ships. Only the two release checks build the launch tree.
- On the off tree `/` is the old page; on the launch tree `/` is the new page. A search shows about 18 browser checks that open `/` to test the old board. On the launch tree the old board is at `/index.html`. The number is an estimate: the first step of this ticket is the true list.
- One journey of `web-game-check` sends solo commands of the web through `/api`. The launch server refuses them (`src/api/http.ts:172`). So CI tests a flow that no form ships.
- Commits 587f6c1b3 and 97f1b02c8 repaired faults that staging or the publish found first, not CI.

## Change

- Set the switch on the build steps only: the CI build, the site build of the check runner, and the build of `web-game-check`. Not for the whole workflow: with the switch on, `vite.config.ts` turns local online play off, and `tools/online-local.test.ts` needs it.
- List the checks that open `/` for the old board. Give them one helper for the address of the old board, `index.html` on the check site.
- The solo part of `web-game-check` expects what the launch server does: the refusal and the hand-over.
- The off tree keeps one build and one route check in CI while it is the rollback path (decision 1 of the spec).

## Test that fails first

The self-test of the check runner (`tools/check-selftest.mjs`) asserts that the check site serves `solo-launch.json`. It is red on the off tree today.

## Checks

- Each moved check passes on the launch tree, one run each.
- One full CI run.

## Known limits

- The time of the CI build grows by one site build while both trees are built.
- A check can show a fault of the launch tree that is real. Such a fault becomes its own ticket; it does not stop this one.
