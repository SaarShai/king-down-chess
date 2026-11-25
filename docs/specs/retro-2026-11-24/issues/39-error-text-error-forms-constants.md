# The error-forms reader does not find messages that are kept in constants

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- tools/lib/error-forms.mjs:20 (sourceErrorForms) keeps a fail() message only when it is a string literal or a template literal.
- A message in a constant is not in the list. Examples: RANKED_UNAVAILABLE at src/match/service.ts:41-42, and the INVITE_NOTICES texts in src/match/invite-notices.ts.
- src/diagnostics/data.ts:14,48-56 (errorMessage) reads the list through __KINGDOWN_ERROR_FORMS__ (vite.config.ts:161, tools/plugin-server-build.mjs:100). For these messages, the recorder writes 'Unlisted message'.
- This is a defect of the recorder today, not only a missing guard.

## Change
- In sourceErrorForms, resolve an Identifier or a MemberExpression message to its string constant in the same module, or in a module that the module imports.
- This changes the build output: the bundle gets more forms. Thus it is a behaviour change, not a guard.
- vite.config.ts and tools/plugin-server-build.mjs are protected files of another lane. Do not change them. The change goes in tools/lib/error-forms.mjs only.

## Test that fails first
- In tools/lib/error-forms.test.ts, add a case: `const M = 'Const text'; fail('X', 409, M)` must give ['Const text'].
- Add a test that calls sourceErrorForms('src') and expects RANKED_UNAVAILABLE and each INVITE_NOTICES value in the list. Import the values; do not copy the text.
- Both tests must fail before the change. Nobody ran them yet. The scout saw the result 'Unlisted message' for these texts at 80b855489. On d781512ed, tools/lib/error-forms.mjs:20 still keeps only a Literal or a TemplateLiteral message (read, not run).

## Known limits
- A message that a function builds at run time (not a constant) stays unlisted. That is correct: the recorder must not keep free text.
- A constant that a module imports through more than one step (a re-export chain) needs the same resolve step for each link.

## Work record
Not started.
