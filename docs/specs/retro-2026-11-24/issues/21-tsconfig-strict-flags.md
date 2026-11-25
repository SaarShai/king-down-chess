# Turn on the missing TypeScript strictness flags, one flag in each PR

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

- tsconfig.json:7 sets `"strict": true` and tsconfig.json:8 sets `"noUnusedLocals": true`. No other strictness flag is set. The strict family (noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis, useUnknownInCatchVariables, alwaysStrict) is on through `strict`.
- tsconfig.tools.json:3 sets `"noImplicitAny": false`. This turns off one strict-family flag for all of tools/. No comment gives a reason.
- Neither config sets `allowJs`. The checker does not read the 68 `.js`/`.mjs` files in src/ and the 225 in tools/ (for example tools/check.mjs, tools/lib/*-check.mjs, src/render/painted/*.mjs).
- tsconfig.tools.json includes tools/, but tools files import src/ files and vite.config.ts. Thus the tools run also reports errors in src/ files. The "union" columns below count each error one time.

The compiler is TypeScript 7.0.2 (`npx tsc -v`). The baseline (`npm run typecheck`) has 0 errors for both configs.

### Counts

Command: `npx tsc --noEmit -p <config> --<flag> <value>`, then `grep -c 'error TS'`. "Files" is the number of files with one or more errors. "Frozen" is the number of error files that this week's freeze list keeps closed (GUI session files, seam lanes, engine fingerprint, Class C code). Logs: (a scratch file, not kept)

| Flag | tsconfig.json errors / files | tsconfig.tools.json errors / files | Union errors / files | Frozen files (errors) |
|---|---|---|---|---|
| noFallthroughCasesInSwitch true | 0 / 0 | 0 / 0 | 0 / 0 | 0 |
| allowUnreachableCode false | 0 / 0 | 0 / 0 | 0 / 0 | 0 |
| allowUnusedLabels false | 0 / 0 | 0 / 0 | 0 / 0 | 0 |
| noUncheckedSideEffectImports true | 0 / 0 (on by default) | 0 / 0 (on by default) | 0 / 0 | 0 |
| noUnusedParameters true | 4 / 4 | 1 / 1 | 5 / 5 | 1 (1): src/interface/play/main.ts:1710 |
| noImplicitOverride true | 18 / 9 | 0 / 0 | 18 / 9 | 9 (18): all in src/account/*.test.ts |
| noImplicitReturns true | 32 / 24 | 11 / 9 | 33 / 25 | 13 (20) |
| noImplicitAny true (tools only) | n/a (on) | 270 / 82 | 270 / 82 | 10 (70) |
| exactOptionalPropertyTypes true | 312 / 98 | 141 / 42 | 329 / 106 | 40 (108) |
| noPropertyAccessFromIndexSignature true | 1169 / 150 | 709 / 111 | 1505 / 219 | 59 (586) |
| allowJs + checkJs true | 1685 / 52 | 3896 / 188 | 5527 / 237 | 76 (2281) |
| noUncheckedIndexedAccess true | 4131 / 305 | 2696 / 191 | 5240 / 406 | 134 (1563) |

Error sites for the small flags:

- noUnusedParameters: src/account-game/runtime.ts:527, src/interface/people/host/online.test.ts:329, src/interface/play/main.ts:1710, src/ui/table.ts:236, tools/plugin-races.test.ts:584.
- noImplicitOverride (TS4114): test subclasses of `Sync` in src/account/account-controls.test.ts:36 and eight more src/account/*.test.ts files.
- noImplicitReturns: 25 files, for example src/api/http.ts:116, src/interface/play/main.ts:464, src/plugin/screens/board-model.ts:168, src/online/routes.ts:14, vite.config.ts:173.
- tools noImplicitAny: top files are tools/ci-shards.test.ts (25), tools/check.test.ts (18), tools/animation-bank.test.ts (15), tools/lib/lock.test.ts (14).
- checkJs: top files are tools/plugin-ui-check.mjs (735), src/render/painted/king-effects.mjs (199), tools/verify-owner-playtest-round2-b.mjs (161).

## Change

Add one flag to the config `compilerOptions` in each PR. Make the fixes for that flag in the same PR. Do not add a flag with `// @ts-expect-error` or `// @ts-ignore` comments as the fix. Do not put more than one flag in a PR.

Suggested order (cheapest flags with value first):

1. noFallthroughCasesInSwitch, then allowUnreachableCode false, then allowUnusedLabels false: three PRs. 0 errors. They stop new faults at no cost. A scratch probe on TypeScript 7.0.2 shows that each one is off by default: a fallthrough, a statement after `return` and an unused label give no error without the flag, and TS7029, TS7027 and TS7028 with the flag.
   noUncheckedSideEffectImports also has 0 errors, but a scratch probe shows that TypeScript 7.0.2 has it on by default (`import "./nope-missing"` gives TS2882 with no flag). It has no value. Do not add it.
2. noUnusedParameters. 5 fixes (remove the parameter or rename it with a `_` prefix). One fix is in src/interface/play/main.ts, a frozen GUI file: wait for the GUI session to end.
3. noImplicitOverride. 18 fixes, all `override` modifiers in src/account test files (Class C). Wait for a Class C window.
4. noImplicitReturns. 33 fixes. Each error can hide a missing return. Read each one; do not add `return undefined` without thought. 13 files are frozen (main.ts, board-model.ts, src/api, src/online, vite.config.ts).
5. noImplicitAny true in tsconfig.tools.json (remove line 3). 270 fixes in 82 files, all in tools/. It brings tools to the same rule as src/.
6. exactOptionalPropertyTypes. 329 fixes in 106 files.
7. noPropertyAccessFromIndexSignature. 1505 fixes. Low value: it only changes `a.b` to `a['b']`. Put it last, or do not add it.
8. checkJs (with allowJs). 5527 errors in 237 files. Do not add it to the configs. If the lead wants it, add `// @ts-check` one file at a time, starting with small tools/lib/*.mjs files.
9. noUncheckedIndexedAccess. 5240 errors in 406 files. It has high value but the highest cost. Do it one folder at a time on a separate config, or put it off.

## Test that fails first

For each flag PR:

1. Before the fix, run `npx tsc --noEmit -p <config> --<flag> <value> 2>&1 | grep -c 'error TS'`. The count must equal the table value (or the value on the current main).
2. Add the flag to the config. Run each config separately: `npx tsc --noEmit` and `npx tsc --noEmit -p tsconfig.tools.json`. Compare each count with its own column. (`npm run typecheck` runs the two with `&&`, so a root failure stops the tools run.)
3. Make the fixes. Both configs give 0 errors, and `npm run typecheck` passes.
4. Run the focused tests of each changed file: `KINGDOWN_TEST_FILE='<files>' KINGDOWN_TEST_NO_TYPECHECK=1 npm test`.

For each 0-error flag PR: add one small proof. A scratch file with the fault (a switch fallthrough, a statement after `return`, or an unused label) must fail `npx tsc --noEmit`. Do not commit the scratch file.

## Known limits

- tsconfig*.json is on this week's freeze list. No flag PR can merge until the lead opens the config files.
- Many fixes fall in frozen files (column "Frozen"). A flag whose fixes touch frozen files must wait for those lanes to end.
- The "Frozen" column comes from path patterns in (a scratch file, not kept) The pattern for "the server, the database migrations" (`^server/`) is not confirmed (the repository has a supabase/ folder), and `^ios/` is wider than the one listed file. The frozen counts are approximate.
- tools/ errors include src/ files because tools files import them. Fix the src/ errors under tsconfig.json first; then the tools count drops.
- The counts are from origin/main 80b855489 on 2026-11-25. They change as other lanes merge. Count again before each PR.
- The compiler is TypeScript 7.0.2. Flag defaults can differ from TypeScript 5.

## Work record

Not started.
