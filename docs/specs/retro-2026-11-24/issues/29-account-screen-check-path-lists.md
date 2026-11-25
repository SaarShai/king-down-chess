# Keep the check lists of account paths complete

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- `tools/vercel-check.mjs:302` (`accountPaths`), `tools/deploy-live-check.mjs:15` (`appPages`): hand lists of `/play/*`, `/g/*` and `/j` paths. A new `/play/<screen>` path is not in them.
- `tools/plugin-ui-check.mjs:3082` (`routes`): a hand list of `SCREENS` values. A new screen is not in it.
- The host regex `play(?:/.*)?` serves each `/play/*` path, so a miss loses only check coverage. It does not break the product.

## Change
No product change. A source-text test is the only form, because these are `.mjs` check scripts with a local list.
1. Move the `Samples` record of `tools/account-screen-guard.test.ts` (and of `src/diagnostics/data.test.ts:124`) into one small module that is not class C, for example `src/diagnostics/route-samples.ts`. Both tests import it.
2. Add `tools/account-paths.lint.test.ts`: read each `.mjs` file, take the array literal after `accountPaths =`, `appPages =` and `const routes =`, and expect each `/play/*` sample path in the first two, and each `SCREENS` value except `collection` in the third. Failure text: `tools/vercel-check.mjs:accountPaths misses /play/records`.
3. Better, when the owner of each script agrees: export the list from the script or import `accountPath` and the samples into it. Then the text test can go.

## Test that fails first
- Add `'records'` to `ReadRoute`, `SCREENS`, `accountPath` and the samples in a scratch copy. The test must fail and name each of the three lists.
- Revert: the test is green in less than 1 s.

## Known limits
- A source-text test breaks when a person renames a list. The failure text must name the list, so that the fix is clear.
- Low value: only coverage of the host and live checks is lost on a miss.

## Work record
Not started.
