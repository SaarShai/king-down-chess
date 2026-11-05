# Move the painted renderer to src

Status: done

## Request

The owner asks for a path-only move of the live painted renderer from `docs/2d-first-pieces/` to `src/render/painted/`. Keep `.mjs` files. Keep art, records, tools and the prototype in `docs/`. Add no old-path wrapper.

## Plan

1. Find the runtime import closure. Add its declarations and tests. Record the files that stay.
2. Move the files with `git mv`. Fix imports, asset paths, test selection and current path guides.
3. Check the import graph and prototype paths by reading. Run type checks, the game build and focused tests. Check the engine boundary and missing-archive guard. Commit without a push.

## Pass conditions

- The moved modules keep their code, except for paths.
- Each remaining `docs/2d-first-pieces` path in `src/` and `vite.config.ts` names a file that stays.
- Moved tests and tests of direct callers pass through `npm test` with `KINGDOWN_TEST_FILE`.
- `npm run typecheck`, `npm run build` and the engine boundary check pass.
- The runtime build refuses a missing engine archive pair. No file is added to `engines/`.
- Prototype imports resolve. No server starts.

## Evidence

- Move 51 files with `git mv`: 27 modules, 4 declarations and 20 tests. Keep 171 files in the art folder.
- Compare each moved file with its source. Only relative path strings change. Each old path is absent.
- Check 238 static imports and file URLs. All changed paths resolve. All 40 remaining art, record and test-fixture paths in `src/` exist. Read the prototype import graph; start no server.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- Focused `npm test`: 19 TypeScript files, 677 tests pass; 20 moved `.mjs` files, 67 tests pass. The selector is below. This is not a full-suite run.
- `tools/plugin-worker-boundary.test.ts`: pass. `tools/plugin-runtime-build.test.ts`: pass, including both missing-current-pair cases.
- `npm run plugin:build:runtime`: pass with the existing archive pair. `npm run plugin:build:ui`: pass. No file changes in `engines/`.
- `git diff --check`: pass.

```sh
KINGDOWN_TEST_FILE='{src/render/painted/**/*.test.mjs,src/render/{PaintedView,character-runtime,marks,scene-load}.test.ts,src/render/effects/{board-effects,card,check,motion-concepts}.test.ts,src/screen/play.test.ts,src/ui/{motion,previously}.test.ts,docs/specs/effects-animation/preview/comparisons/magic/transport.test.ts,tools/{machine-lease,steering.docs,account-game-build,dev-settings,offline-build,plugin-worker-boundary,plugin-runtime-build}.test.ts}' npm test
```

## Limits

- Keep dated records, past check results, prompts and provenance paths as history.
- The trailer points to `docs/trailer/assets/`, which is absent before this change. Keep that path and record the limit. It is outside the runtime move.
- The plugin UI build warns about its runtime manifest URL and chunk size. The build passes. No browser check runs.
- Add no dependency or old-path wrapper. Do not deploy, publish or push.
