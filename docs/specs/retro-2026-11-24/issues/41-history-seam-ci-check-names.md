# Lint the named checks that CI runs, and check the check names in the workflows

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- tools/checks.lint.test.ts:118 `const linted = checks.filter(c => !c.byName);` lints only default entries. A byName entry with a ci group runs in CI but gets no lint. 73 of 96 entries are byName.
- .github/workflows/plugin-checks.yml:193-195 run `npm run check:browser next-menus`, `next-skylift` and `next-rule-text` by name. No test checks that these names are in tools/lib/registry.mjs. tools/check.mjs fails only at CI run time on an unknown name.
- Both files are protected (lane seam-ci).

## Change
1. In tools/checks.lint.test.ts, lint each entry that CI runs: `checks.filter(c => !c.byName || c.ci)`. Export the lint function if another test needs it. The failure text stays the lint fault with the file and line.
2. In tools/workflow.lint.test.ts, read each `npm run check:browser <name>` of .github/workflows/*.yml. Assert that each <name> is a name in tools/lib/registry.mjs. Failure text: `plugin-checks.yml line N names check "x"; tools/lib/registry.mjs has no such check`.

## Test that fails first
1. Add a byName entry with ci: 'journey' whose script has a lint fault (for example a fixed wait). The lint test stays green today; after the change it is red.
2. Change `next-skylift` in a scratch copy of plugin-checks.yml to `next-skylyft`. The workflow lint is green today; after the change it is red with the line number.

## Known limits
- Some byName ci checks can fail the lint today. Fix them or give each one a reason in the same PR.
- The name check reads only the `npm run check:browser <name>` form. Another form (a variable or a loop) is not read.

## Work record
Not started.
