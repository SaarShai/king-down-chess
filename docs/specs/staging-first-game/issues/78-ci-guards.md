# Mechanical checks for the faults of ticket 77

Status: in review on PR SaarShai/king-down-chess#88 (branch `staging/ci-guards`, rebased on `staging/lane-ci` at `0e0f2602`). No merge or deploy.

## What

Two independent audits of the ticket 77 work list five faults that a session made and that no check caught. Each fault gets a check, not a new prose rule.

1. The tools folder has no type check. `tsconfig.json` includes `src` only, so the loop `for (const remount of [false, true]) ... await remount(page)` passed `npm run typecheck` and failed at run time.
2. A model name reached ticket 77. The steering lint checks named steering files only, while AGENTS.md exempts only the tasks archive.
3. A bare `npx vitest run` skips the test lock (`tools/test-lock.sh`) and the type check.
4. The optional Python probes in `tools/board-grain.test.ts` and `tools/stone-control.test.ts` skip on every import fault except a time-out. A broken install skips the source-export checks.
5. Nothing proves that the retained-profile journeys of `tools/web-online-check.mjs` stay on the local server.

## Plan

1. Add `tsconfig.tools.json` (extends `tsconfig.json`, `noImplicitAny: false`, includes `tools`). Fix its errors one by one; no blanket suppression. Run it from the `typecheck` script, so `npm test` and the pre-commit hook run it.
2. Lint each Markdown file of the specs folder with `findModelNames`. Fix the finds. Add a regression case.
3. Add a vitest `globalSetup` that stops a run with no lock mark. Keep `npm run test:docs` working.
4. One shared Python probe: skip only when a required module is missing; fail on every other fault.
5. Record each request URL of the profile pages in `worker-browser.json`; assert that each goes to `http://127.0.0.1`.

## Acceptance

- Each check fails on the old fault and passes now.
- `npm test`, `npm run test:docs` and `npm run check:browser web-online` (Chromium and Firefox) pass.
- An open PR with the `pr` skill body.

## Results

### 1. Tools type check

`tsconfig.tools.json` gave 85 errors at `08c4dcda` (75 with `noUnusedLocals` off). Each has a local fix. The fixes that change behaviour or data:

```text
tools/plugin-ios-size.test.ts   expect.poll(fn, 'label') dropped the label: the second argument is an options
                                object. Now { message: 'label' }.
tools/plugin-board.test.ts      finished view: action 'finished' is no SeatAction ('done'); reason 'resign' is no
                                EndReason ('resignation').
tools/plugin-menus.test.ts      history rows: king null is no KingName ('Flame'); rating_policy 'legacy' (the value
                                the fixture gives a row with none).
tools/engines.test.ts           history view: rating_policy 'casual' (required by View).
tools/mine.ts                   the copy of trajectory() has no uncertainty, so the uncertainty sum was NaN; nothing
                                reads it. The sum is removed.
tools/jev-play.ts               a null search move no longer throws in toLan; the first legal move is used, as for
                                a move with no match.
src/online/client.ts            the default fetch wrapper names its two parameters (a spread of an overloaded
                                function's parameters is not valid in the tools program).
```

The other fixes are types only: declaration files for `tools/lib/plugin-control-bounds.mjs` and `tools/lib/plugin-hit-sizes.mjs` (Playwright typed their results as `unknown`), element casts in page callbacks, a `FixtureSeedInput` type for history rows with no `rating_policy`, and unused imports and locals removed.

Old fault: the remount loop in a tools file gives `TS2349: This expression is not callable. Type 'Boolean' has no call signatures.` under `tsconfig.tools.json`. `tsc --noEmit` with `tsconfig.json` exits 0 on it.

### 2. Model names in the specs folder

`tools/steering.docs.test.ts` § specs folder model names: each tracked `docs/specs/**/*.md` file, with the fenced code. The first run found 66 names in 23 files. Each now names the tool or the role (Codex, Claude Code panel, reviewer). Three tickets named review files by model; they now name the folders that hold them. The regression case puts a review line with a model name and a fenced model name in a fixture ticket; the lint names both lines.

Not in scope: 21 files outside the specs folder (`docs/DELEGATION.md`, `docs/LOCAL-AI-MACBOOK.md`, `docs/research/`, `docs/lessons/agents-and-tools.md`, `docs/submission/checklist.md`, `docs/takeover/BASELINE.md`) hold model names. Some record measured model capabilities. They need an owner decision before a lint can cover them.

### 3. Test lock guard

`tools/test-lock-guard.ts` is the vitest `globalSetup`. It stops a run unless `KINGDOWN_TEST_LOCKED` (set by `tools/test-lock.sh`) or `KINGDOWN_TEST_DOCS` (set by `npm run test:docs`) is set. With `KINGDOWN_TEST_DOCS`, `vite.config.ts` includes the doc lints only, so that mark cannot open the other tests. `tools/test-lock.sh` now sets its mark before the no-git and no-perl paths too, so those runs start.

Old fault: `npx vitest run tools/test-lock.test.ts` now stops with "This vitest run has no test lock and no type check: run npm test ...", exit 1. `tools/test-lock-guard.test.ts` covers both marks.

### 4. Python probe

`tools/lib/python-modules.ts` (`pythonModules`) runs one Python probe. It gives false only when python3 or a required module is missing (`ModuleNotFoundError` with that module's name). A broken import, a missing dependency of a required module and a time-out fail; the time-out message gives the measured time. Both test files use it. `tools/lib/python-modules.test.ts` covers present, missing, broken-dependency, raising and slow modules. `tools/child-timeouts.test.ts` bounds the probe's call.

Old fault: with a `numpy.py` that raises on import on `PYTHONPATH`, the old probe prints "Skip source export" and gives false; `pythonModules('numpy', 'PIL')` throws "python3 cannot import numpy, PIL: Traceback ...".

### 5. Local-only profile requests

The audit says `worker-browser.json` records each request. It records only the browser facts, and the `http` events of `worker-events.json` are paths that reached the local server, so a request to another host cannot show in either. Now each profile context records the URL of each request; `worker-browser.json` holds them as `requests`, and `assertLocalRequests` fails on a URL that does not start with `http://127.0.0.1` (`data:` and `blob:` URLs are no network requests). The unit case fails on `https://project.supabase.co/...`, `http://127.0.0.1.example/` and `http://localhost:...`.

`npm run check:browser web-online` passes on Chromium (104.8 s; 5,029 requests, each to `http://127.0.0.1`) and on Firefox (110.3 s; 1,211 requests, each to `http://127.0.0.1`). Old fault: before this change, the check had no assertion on request hosts.

### Full suite

`npm test` at `57c43e79`: type checks (src and tools) exit 0; vitest 258 files, 4,785 passed, 8 skipped (383 s); Node checks 50 of 50. `npm run test:docs`: 13 files, 168 passed.

After the rebases on `18aa577b` and `0e0f2602` (the board tests split into `tools/plugin-board.test.ts`, `tools/plugin-board-input.test.ts`, `tools/plugin-board-drafts.test.ts` and `tools/lib/plugin-board-fixture.ts`), the board type fixes go to the file that now holds each test; the tools type check covers all four files. `tools/child-timeouts.test.ts` read the board build limit from `plugin-board.test.ts`, which no longer runs the build; it now reads `tools/lib/plugin-board-fixture.ts` (the first full run after the rebase failed only on this case).
