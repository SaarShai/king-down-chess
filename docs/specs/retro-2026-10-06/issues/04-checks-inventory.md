# Browser checks and tools inventory

Type: research
Status: resolved

## Question

For every browser check: URL env and default, output folder and whether tracked, channel, timeout, pageerror handling, npm script. package.json scripts, vite hosts, tsconfig flags, hooks, workflows, launch.json. The old verify-workshop.mjs sections at 84f9e42 against the current assertions. Needed by: checks and hooks, dev environment, Workshop finish.

Resolved by the workflow retro-spec-facts (run wf_354ee3fb-e64); the report lands in the scratchpad facts folder and its gist is appended here.

## Answer

The full report is in the session scratchpad under `facts/checks.md`. Versions: vite 8.3.0, playwright 1.63.0, vitest 5.0.0, typescript 7.0.2; node 26 local, 22 in CI.

- 13 pass/fail browser checks and 7 capture or study scripts. None starts a server, none has an npm script except `graphics:check`. URL env names: `PLAYABLE_URL` (11 scripts, 8 default to port 5189), `QA_BASE` (5173), `STUDY_URL` (5192), and a hard-coded 5190.
- Channel: 9 default to the installed `chrome`, 2 hard-code it (`verify-workshop`, `verify-workshop-cast`), 4 use Playwright's Chromium. `PLAYABLE_BROWSER` overrides where the table says env.
- Timeout: Playwright's default 30 s everywhere except `verify-workshop` (10 s). Page errors: all 13 collect them; 4 collect page errors only (`verify-account`, `verify-lesson-return`, `verify-workshop`, `verify-workshop-cast`); `verify-powers` ignores "Failed to fetch".
- 8 of 13 checks overwrite tracked files under `docs/` (screenshots and `checks.json`). Only 3 read `PLAYABLE_OUT`. `verify-workshop` and `verify-workshop-cast` write to `/tmp` and never clean up.
- Shared code: `tools/new-game-ui.mjs` (7 checks). No shared layout-assertion module. No `tools/lib/`.
- `npm test` = `vitest run && node --test "docs/2d-first-pieces/**/*.test.mjs"`. No `tsc` in any script; `tsconfig.json` is strict without `noUnusedLocals`. vitest environment `node`, no DOM library installed.
- No git hooks (`core.hooksPath` unset, samples only), no `.githooks/`, no `.gitattributes`, `.npmrc`, `.nvmrc`, lint or format config. `.github/workflows/pages.yml` is `workflow_dispatch` only; nothing runs on push.
- `.claude/settings.json`: one `SessionStart` hook (`cloud-setup.sh`, a no-op outside cloud sessions). No `worktree` key. `.claude/launch.json` holds `dev`, `playable`, `painted-2d`, `previews` and `workshop` (an absolute path to the Codex worktree).
- No check for model names in commits, for secrets in a diff (one test scans `src/` and `public/` text for key patterns), for file sizes, or for steering-file sizes.
- The old `verify-workshop.mjs` at 84f9e42 (594 lines) against the current 74 lines: the sections map in the report, section 10. Of the 29 review fixes, the current checks cover 4 in part.
- Open: the `judge.test.ts` "never lowers W" case took 6 s under a full run (5 s limit) and passes alone; `verify-workshop-cast` expects `./` figure URLs and the dev server gives `/`.
