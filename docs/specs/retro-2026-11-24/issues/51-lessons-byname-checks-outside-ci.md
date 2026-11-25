# Run the byName browser checks and tools/qa.mjs after a moved control or a changed default

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
Two lessons say: after a moved control, grep the tool selectors and rerun every tool; when a default changes, rerun each tool that depends on it. CI runs the default registry checks (npm run check:browser -- --no-gpu in .github/workflows/plugin-checks.yml). The entries with `byName: true` in tools/lib/registry.mjs (for example line 22 muse-docs, lines 24 to 26 owner-playtest-r2/r4/r5, and lessons, lesson-return, layout-*, next-menus) and tools/qa.mjs are outside that run. A moved control or a changed default can break them and nobody sees it.

## Change
Cheapest repair: a unit test in a new tools/ file that reads tools/lib/registry.mjs, takes each byName entry that is not `external`, reads its script, and checks that each selector string in the script (for example `#id` and `[data-*]` literals) occurs in src/ or index.html. Failure text names the entry, the selector and the script line. Second step (protected files, seam-ci lane): a weekly CI job that runs the byName entries that are not external.

## Test that fails first
Fake: rename one selector in a scratch copy of a byName script to a value that src/ does not hold. The test fails and names it.

## Known limits
A selector check does not prove that the check passes. Selectors built at run time are not seen. tools/lib/registry.mjs and the workflows are protected now.

## Work record
Not started.
