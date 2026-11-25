# Each account screen has a section in the plugin page

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- `src/plugin/index.html:32-66`: each screen of `SCREENS` (`src/account-game/types.ts:3`) needs a `<section data-screen="...">`. The page shows the section of the current screen. A new screen with no section shows an empty page. No check finds it.
- Today each screen has a section, except `collection`.

## Change
Add a new test file `src/plugin/index-sections.test.ts` (or `tools/account-screen-sections.test.ts`). It is not class C and needs no product change.
- Import `SCREENS` and `type Screen` from `src/account-game/types`.
- `const NO_SECTION: Screen[] = ['collection'];`
- Read `src/plugin/index.html` as text.
- `expect(SCREENS.filter(s => !NO_SECTION.includes(s) && !html.includes(\`data-screen="${s}"\`)), 'add <section data-screen="..."> to src/plugin/index.html, or add the screen to NO_SECTION').toEqual([]);`
- Add a second check: each `NO_SECTION` value is in `SCREENS`, so that a removed screen does not stay in the list.

## Test that fails first
- Add `'records'` to `SCREENS` in a scratch copy. The test must fail with `add <section data-screen="..."> ... expected [ 'records' ] to deeply equal []`. (The scout probe of 2026-11-25 gave this red line.)
- Revert: the test is green in less than 1 s.

## Known limits
- The test reads the HTML as text. It does not prove that the section is visible or that the renderer fills it.
- A section in a different HTML page (for example the web app) is not in scope.

## Work record
Not started. The account-screen builder of 2026-11-25 used its 3 guard slots for the parser, the renderer map and the read-screen list.
