# Merge the approved UI changes with the current base

Status: resolved
Type: task

## Scope

Merge PR #154 at `a377c3dd` with `origin/staging/first-game` at `9e006308`.
Keep both sets of tests. Add no new UI change. Do not push or deploy.

## Plan and checks

1. Resolve the seven conflicts. Keep save recovery, `gameAt`, URL ownership,
   friend invitations, spent presses, A8/A9, and the approved V1 to V10 changes.
2. Run the play tests, doc tests, then `new-game web-game end visual-design`.
   Use one command at a time and a disposable local database.
   Start no browser check or full suite while the owner's quiet lock exists.
3. Compare each failure with the UI parent or base. Record the result.
4. Check the final diff. Commit the merge with the unchanged hooks. Do not push.

Pass: no conflict marker remains; both sets of tests stay; each requested check
has a result; each failure has a parent comparison; the merge commit exists.

## Resolution

- `index.html`: keep the context scroll area and Learn. Put both recovery
  controls inside the same actions area.
- `src/screen/play.test.ts`: keep both imports, setup access, URL-aware fixtures,
  account readiness, and every test from both parents.
- `src/screen/play.ts`: keep the new-game sheet for two-human rematches and
  the base initial-save flag. Recovery keeps `endUrlGame()` and `gameAt`.
- `src/style.css`: keep the narrow-title spacing and 11 px names, with the
  base landscape scroll range.
- `src/ui/table.css`: keep the base narrow-screen board rules and recovery
  rows, with the approved text scroll area, lesson text and Back label.
- `tools/lib/registry.mjs`: keep the sample check and all three layout checks.
- `tools/verify-end.mjs`: keep the real-clock A8/A9 checks and the approved
  New game flow. Keep the base clock step after Start.

## Evidence

- `KINGDOWN_TEST_FILE='src/screen/play.test.ts' npm test`: pass, 156 play
  tests and 67 painted-board tests. The normal type checks pass.
- `npm run test:docs`: pass, 180 tests in 15 files.
- `npm run check:browser new-game web-game end visual-design`: all pass.
  Times: 43.2 s, 74.5 s, 31.8 s and 28.0 s. The build passes.
- `git diff --cached --check`: pass. No conflict marker remains in the seven
  files. Every test and suite name from each parent remains in the play file.
- Final diff review: the merge combines both behaviors without a new UI fix.
  No check fails, so no failure comparison with either parent is needed.
- The quiet lock is absent before the browser run. Commands run one at a time.
- The local `ui_approved_merge_1026_test` database uses port 55432 and the
  `kingdown_test` user. All 22 migrations run twice. The database is dropped.
- The task output is in the session scratch folder.
  It holds `play-merge.log`, `docs-merge.log` and `browser-merge.log`.
  Browser detail logs are in `kingdown-check-runs/ui-approved-merge-WKejtz`.
- Scope limits: no full suite or `plugin-ui` run. The known PR #154 layout
  faults stay outside this merge. No push or deploy.
