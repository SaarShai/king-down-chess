# Make the type check refuse an unknown import.meta.env name

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

- The repository has no ImportMetaEnv declaration. tsconfig.json loads only vite/client. Thus ImportMetaEnv extends Record<string, any> (node_modules/vite/types/importMeta.d.ts:11-14).
- A new name or a typo compiles. The rehearsal added `import.meta.env.VITE_KINGDOWN_FAKE` and `import.meta.env.VITE_KINGDWN_STAGE` to src/platform.ts, and `npm run typecheck` stayed green (EXIT 0).
- Read sites at d781512ed: src/platform.ts:5, src/plugin/screens/profile.ts:18, src/plugin/screens/setup-model.ts:35, src/plugin/consent.ts:15, src/interface/play/scenes.ts:122, src/api/http.ts:211,212,224,290, src/online/jobs.ts:141. Whole-env passes: src/account/client.ts:26,28,122, src/online/entry.ts:41, src/online/sign-in.ts:44, src/interface/people/host/index.ts:215,216. The env readers: src/account/public-config.ts:7,14,31 and src/account/apple.ts:2.
- tools/build-flags.test.ts (branch guard-build-flag-env) now catches a new name by source text. A type check is the stronger guard, because it fails at the place in the editor.

## Change

1. Add src/vite-env.d.ts:
   `interface ViteTypeOptions { strictImportMetaEnv: unknown }` and
   `interface ImportMetaEnv { readonly VITE_KINGDOWN_STAGE?: '' | 'staging'; readonly VITE_SUPABASE_URL?: string; readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string; readonly VITE_KINGDOWN_APPLE_SIGN_IN?: string; readonly KINGDOWN_CHATGPT?: boolean; readonly KINGDOWN_MUSE?: boolean; readonly KINGDOWN_ERROR_RECORDER?: boolean }`.
   BASE_URL, MODE, DEV, PROD and SSR come from vite/client.
2. Change the env parameter of the readers in src/account/public-config.ts and src/account/apple.ts:2 from `Record<string, unknown>` to `Partial<ImportMetaEnv>`. This is a type-only change, but the files are class C code, so the change needs the class C review.
3. Do not add an index signature to ImportMetaEnv. It removes the 7 errors, but a typo then compiles again.

## Test that fails first

- With only step 1, `npm run typecheck` gives 7 TS2345 errors ("Argument of type 'ImportMetaEnv' is not assignable to parameter of type 'Record<string, unknown>'") at the whole-env passes above. The scout trial proved this at 80b855489.
- After step 2, add `import.meta.env.VITE_KINGDOWN_FAKE` to src/platform.ts. Expect: "error TS2551: Property 'VITE_KINGDOWN_FAKE' does not exist on type 'ImportMetaEnv'. Did you mean 'VITE_KINGDOWN_STAGE'?". Remove the fake. Expect EXIT 0.

## Known limits

- The type check does not see process.env reads in tools/*.mjs. tools/build-flags.test.ts covers those.
- Tests that call the readers with literal objects can need a cast.

## Work record

Not started.
