# 11: A lint keeps every registered check on the three settings

**What to build:** A check lint in `npm test` makes the check edits permanent. It fails when a registered check holds a port literal or a browser channel literal, or when it does not use `env`, `trapErrors` and `assertNoErrors` from the shared module. The shared module itself, which holds the defaults, is exempt. The lint comes last, after all 13 checks use the shared module, so that it lands green.

**Blocked by:** 07, 08, 09, workshop-finish/02 (the Workshop and Workshop cast checks use `env`, `launch`, `trapErrors` and `assertNoErrors`)

**Status:** ready-for-agent

**Owns:** `tools/checks.lint.test.ts`

- [ ] Check lint, story 13: every check in the registry passes.
- [ ] Lint fixture tests: a check text with a port literal fails; one with a `chrome` or `chromium` channel literal fails; one without `trapErrors` or without `assertNoErrors` fails; each failure names the file and the rule.
- [ ] The lint reads the check list from the registry, so a new check is linted when it is registered.
- [ ] The shared module is not linted for its own defaults.

**Verify:** `npm test`.
