# 11: A lint keeps every registered check on the three settings

**What to build:** A check lint in `npm test` makes the check edits permanent. It fails when a registered check holds a port literal or a browser channel literal, or when it does not use `env`, `trapErrors` and `assertNoErrors` from the shared module. The shared module itself, which holds the defaults, is exempt. The lint comes last, after all 13 checks use the shared module, so that it lands green.

**Blocked by:** 07, 08, 09, workshop-finish/02 (the Workshop and Workshop cast checks use `env`, `launch`, `trapErrors` and `assertNoErrors`)

**Status:** resolved

**Owns:** `tools/checks.lint.test.ts`

- [x] Check lint, story 13: every check in the registry passes.
- [x] Lint fixture tests: a check text with a port literal fails; one with a `chrome` or `chromium` channel literal fails; one without `trapErrors` or without `assertNoErrors` fails; each failure names the file and the rule.
- [x] The lint reads the check list from the registry, so a new check is linted when it is registered.
- [x] The shared module is not linted for its own defaults.

**Verify:** `npm test`.

## Comments

- Built in `tools/checks.lint.test.ts` (the only file this ticket owns), 22 tests. The lint functions live in the test file.
- Fixture tests (6): a port literal fails (URL with a port, `localhost:<n>`, a `port` key, a `--port` flag); a `chrome`, `chromium` or `chrome-<x>` channel literal fails; the Playwright `chromium` import and a comment are not literals; a check without `env`, `trapErrors` or `assertNoErrors` fails; a name from another module or a name that the check never calls does not count; a good check passes. Each fault reads `<file>: <rule>`, with the line for a literal.
- Registry tests: one test for each entry of `tools/lib/registry.mjs` that runs in a run of all (the 13 checks and `selftest`), so a new check gets its test when it is registered. A guard test fails when the registry gives fewer than 14 entries.
- Shared module: `lintFile` skips `tools/lib/checks.mjs`. The test proves that the skip is necessary: the same text under another name gives a port fault and a channel fault.
- Not linted: the three `byName` entries (`selftest-dirty`, `selftest-fail`, `selftest-hang`). They are planned faults of the runner, open no page and do not call `trapErrors`. A new check that is registered with `byName: true` is not linted either.
- Comment lines (start with `//`, `/*` or `*`) and end-of-line `//` comments after a space are left out. Block comments are not followed to their end, because strings such as `'.../**'` in the account check hold comment marks.
- Mutation check: a port URL and two removed `trapErrors` calls in `tools/verify-powers.mjs` made the `powers` test fail with `port literal (line 142: ...)` and `does not use trapErrors from tools/lib/checks.mjs`. The file was restored.
- Commands: `npx vitest run tools/checks.lint.test.ts` (22 passed). `npm test` right after the commit: all green (vitest passed, then node tests 42 passed). Three later runs, with the load average of this Mac at 20 to 55 from other work, had 5 of 1092 tests over the 5 s time limit, a different set each run (gate, pre-push, commit-msg, judge, engine tests); none is in this ticket's file. The three timed-out files of the first such run passed alone (56 tests). With `--testTimeout=60000`, 1091 of 1092 passed; the judge's seeded "never lowers W" case took 60.7 s.

- Owner decision, 2026-10-07 ("use your best judgement for deciding these. complete what needs completing."): the `byName` entries stay unlinted. They are planned faults of the runner and open no page.
