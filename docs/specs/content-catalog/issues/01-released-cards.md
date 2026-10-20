# Store released card content once

Type: task
Status: claimed

## Plan

1. Add one typed record for the released 21-card deal outside `src/rules/`.
2. Derive the setup roster from it. Use its names and art in the existing card and Collection controls.
3. Check the preserved order, admission, fixture links, names and twelve paintings plus nine rule pictures. Keep experimental cards and contextual text unchanged.

## Checks

- The current 21 IDs and deal order stay exact; all other engine cards stay outside account admission.
- Each released ID links to its existing signature fixture.
- Name consumers agree, including Mirror, Morph, Earth Quake and Sky Lift.
- Every painting exists and the other nine cards retain their rule pictures.
- Run focused unit tests through `npm test` after the shared test slot is free. No browser, build or deploy is part of this slice.

## Evidence

- Base source: `92be70f0`, in the isolated `staging/u06-content-catalog` worktree.
- `KINGDOWN_TEST_FILE='{src/content/cards,src/match/setup,src/plugin/card-face,src/powers-ui}.test.ts' npm test` passes: full typecheck, 4 files, 61 tests and 53 artwork checks. Exit 0. Log: `/tmp/kingdown-u06-content-tests.log`.
- `git diff --check` passes. No assets, engine rules, contextual text or costs change. No browser, build or deploy runs.
- Independent review and integration remain with the main U06 task. The broader U06 acceptance stays open.

## Artifact boundary

This change leaves the source-rule hash inputs unchanged: the catalog sits outside `src/rules/`, the AI and Workshop trees, `game.ts`, `game-rules.ts` and `match/worker.ts`. The compiled worker uses a different rule: it hashes the emitted bundle. `GameRules` already reaches display helpers, so moving their card names to a record may change that bundle and its fingerprint. This slice runs no build and makes no claim that the compiled fingerprint stays equal. U08 retains that artifact-identity check; this slice changes no version policy.
