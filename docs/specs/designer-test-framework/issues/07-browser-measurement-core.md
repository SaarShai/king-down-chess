# Browser measurement core

Status: resolved
Type: task

## Plan

1. Move schedule and stamp inputs to shared modules. Keep Node APIs as exports.
2. Share preview preparation and saved-plan output. Use Web Crypto in the browser.
3. Check recipe parity, saved schedules, and a browser build with no Node externals.

## Checks

- `npm test` with `KINGDOWN_TEST_FILE='{tools/lib/study-measurements,src/sim/tournament,src/sim/combinations}.test.ts'`: 45 tests pass in three files. The 50 art checks also pass.
- CLI and browser output match for all five recipes. Checks include jobs, hashes, saved plans, values, holds, side holds, depth, opening settings, and game limits.
- Four schedule hashes from the parent branch before extraction still match.
- A Vite library build of `src/study/measurement-preview.ts` passes with warnings as errors. The graph has no Node externals.
- Existing tournament checks cover file starts and mirrored starts. Existing combination checks cover blocks and caps.

## Result

`previewStudyMeasurements(input, request, source)` in `src/study/measurement-preview.ts` returns a promise. Pass the engine source hash as `source`. Vite provides it as `__SIM_SOURCE__`. `savedPlanOf(preview)` returns the saved-plan shape used by the CLI.

The CLI stays synchronous. It scans engine source once per preview and passes the hash to each stamp. The source scan moves to `src/sim/source-id.ts`; its file roots and hash bytes stay the same. Source file changes in this extraction change the source hash as expected. The spec and rules hashes keep the same JSON bytes and truncation.

No simulation or remote call runs. No UI changes occur. The full suite and final browser UI check belong to the parent task.
