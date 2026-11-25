# The game boundary scan does not resolve aliases, resolve plugins or package names

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
tools/game-boundary.test.ts check() (about line 28) skips each bare specifier (a name that does not start with '.' or '/'). A package, a Vite resolve plugin or an alias can map such a name to src/rules/engine.ts, and the scan does not see the import. The guard of branch guard-guards-a stops the test when tsconfig.json gets paths, baseUrl or rootDirs, or when vite.config.ts has a line with 'alias:'. That check reads the source text of vite.config.ts: a comment with 'alias:' gives a false red, and a resolve plugin or an alias written in a different form is not seen. Today no alias, no path map and no resolve plugin points into src, so no import uses this gap.

## Change
Resolve each bare specifier with the real resolver of the build in place of the text check: load the Vite config with resolveConfig from 'vite' in the test, and resolve each bare specifier of each product file with the config's resolver (or with rolldown's resolver and the config's resolve.alias). Feed the resolved path to the blocked list. Then remove the 'alias:' text check. Keep the run time under 2 s: resolve only specifiers that are not in package.json dependencies.

## Test that fails first
1. In a scratch copy, add resolve: { alias: { '@engine': '/src/rules/engine.ts' } } to vite.config.ts (written in a form that the text check does not see, for example through a variable), and add import { legalMoves } from '@engine' to a product .mjs file. The test today stays green.
2. After the change the test fails and names the product file and src/rules/engine.ts.
3. Revert. The test passes on the real tree.

## Known limits
vite.config.ts is a file that no commit of the guard lanes may change; the test may only read it. Loading the Vite config in a test can be slow; measure it first. A package in node_modules that re-exports the engine stays out of scope.

Found in the review of 2026-11-25: the scan does not read `require()` calls (a `.cjs` file). It reads `.tsx` and `.jsx` files since that review. The tsconfig tripwire does not follow `extends`, and the Vite alias regex does not see `resolve: { alias }` in its short form or an alias from an imported module.

## Work record
Not started.
