# 34 Load the Vite config once in the offline-build test

Status: done (local checks pass; PR CI still needs a run after the push)
Branch: fix/cold-start-flakes
Base: 8cc2e5ae

## Fault and evidence

[Run 42361145582](https://github.com/SaarShai/king-down-chess/actions/runs/42361145582)
attempt 1 fails in `verify`: `tools/offline-build.test.ts > rejects an invalid beam field in a build`
times out at 5 s. It is not a cold start. The file ran 19 builds before it, at about 1 s each.

Each `compile()` passed `configFile: resolve('vite.config.ts')`. Vite then bundles and runs the
config again for each build. The config parses each file in `src` for the error forms, runs
`git rev-parse HEAD` and builds the engine worker. That is about 0.3 s of the 0.36 s of a local
build, and the same for each fixture. On a loaded runner a build takes 1 to 3 s, and one passed 5 s.

## Fix

The test loads the config once at import (`loadConfigFromFile`) and gives each build that config
with `configFile: false`. The plugins and defines are the same, so each build checks the same thing.

## Verification

- Local, no load: a fixture build goes from about 360 ms to about 40 ms. The file goes from 19 s to 3.3 s.
- 16 `yes` processes on 16 cores: 10 of 10 runs of the file pass. Beam cases take 65 to 383 ms.
  The slowest test in the 10 runs takes 2.6 s. Main under the same load: beam cases take 405 to 478 ms.
- `npm test` with `KINGDOWN_TEST_FILE=tools/offline-build.test.ts` passes, type checks included.
