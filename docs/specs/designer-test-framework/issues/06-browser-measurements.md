# Plan measurements and link results in the browser

Status: resolved
Type: task
Blocked by: none

## Outcome and approval

Owner request, 2026-10-14: “continue on this branch and bring measurement plans
into the browser, so designers can choose a test, preview its settings and cost,
and link results without using the command line.” This approves the functional
scope below. Owner approval, 2026-10-14: “Approve the layout” for choosing
measurement tests, previewing cost and settings, and linking results.

## Plan

1. Extract shared planning code so the browser and command line generate the same
   jobs, settings, counts and identity. Keep file access and run launch code out
   of the browser. Use the existing isolated worker for bounded work.
2. Add a measurement form to Studies. Choose worth, activity, power field,
   two-factor interaction or power cross-play. Show relevant inputs and support
   limits. Preview shows games, blocks, depth, seed and fixed settings. It gives
   no invented time or money estimate. Saving a plan never starts games.
3. Add a local result-file picker. Choose a run and measurements, inspect their
   validity and context, then link the selection. Keep exact source hashes and
   all measurement fields. Refuse malformed, duplicate or oversize data without
   changing the study. No browser file leaves this device.
4. Keep plans and evidence in the existing saved-study version chain. An edit
   invalidates its preview. Old evidence remains visible with its original scope.

## Verification

- Browser and command-line plans agree for all five recipes and policy inputs.
- Shared schedules retain their current fixtures. Hash and source changes fail
  verification. Missing or incompatible custom designs have clear errors.
- Browser controls create, preview, save, reopen and export a plan. Editing a
  field invalidates the preview before save. Unsupported combinations cannot save.
- Result files list runs and rows, preserve selected metadata and exact byte
  hashes, and reject bad or duplicate rows without losing the current study.
- Keyboard and phone controls work. Errors appear in the active panel. Cancel
  changes no saved record. Tests do not launch games or change the live game.
- Run `npm test`, doc checks and registered Studies and Workshop browser checks.
  Get independent review and record each confirmed fix before completion.

## Limits

This stage adds no run launcher, server or game rule. It does not audit raw games
in the browser or turn a linked result into approval. The two rule-document audit
conflicts in ticket 04 remain separate. The existing remote confirmation follows
its own recorded schedule and authorization.

## Progress and evidence

- The shared planner is in commit `c21042b0`. All five recipes match the CLI.
  Four schedule hashes from before extraction still match. Independent review
  finds no regression in schedules, source identity or rule-state restoration.
- The six sample renders pass at desktop and phone sizes. The owner approves
  the rendered layout before the controls are built.
- Save version numbers alone no longer mark a plan stale. The original plan
  snapshot and fingerprint stay fixed. Identity, rules, design version, actions
  and checks still compare. Review finds a connected CLI issue: it must rebuild
  the original plan snapshot after a save-only version change. That fix is in
  place. Twelve focused tests and 50 art checks pass.
- Typed worker methods now prepare and verify plans, open local result files,
  page through runs and rows, select rows and release the file. The worker keeps
  large data off the page thread. Independent review finds no issue in hashes,
  metadata, bounds, failed reads or concurrent file selection.
- A real 41,194,429-byte export exposes a prior limit: eleven conflict rows have
  more than 100 audit reasons. The largest has 7,003. The importer keeps all
  reasons. File and storage byte limits still apply. A regression test and an
  independent review pass. The real export now opens all 13,886 rows in 852 runs
  and selects nine Haste rows. Its SHA-256 is
  `08c63780caf4f8b5db5dd67542840b60c8da9b372b37355bb150465bdf3f032a`.
- Broad checks before that final reason-limit fix pass: 2,335 tests, 129 skipped,
  50 art checks and 113 doc checks. Registered Studies and Workshop checks pass
  in 19.0 and 110.8 seconds. After the fix, twelve focused tests and 50 art checks
  pass. Browser evidence is in
  `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/designer-test-framework-2SC1HQ`.

- The approved controls now use the shared worker planner and result importer.
  All five recipes expose their settings. The preview shows exact games and
  paired blocks. Saved plans and selected results use the study version chain.
  A failed save or canceled panel leaves the saved study intact. A late worker
  reply cannot save or reopen a canceled panel. A stale plan needs a fresh
  preview for the current study.
- The result picker pages through runs and rows. It keeps selections across
  pages and filters. A failed replacement file keeps the current selection.
  Keyboard focus stays on a usable page control. All measurement fields and
  the exact file hash remain attached.
- Render checks find inherited Workshop styles that narrow the panel, inputs
  and buttons. Scoped styles fix these controls. Desktop and phone checks now
  enforce panel fit, full field width and 44-pixel buttons. The live game and
  Workshop Try board stay unchanged.
- The tracked balance export has two queue-only pending rows with no raw
  source. They now retain their pending state without blocking the file.
  All other validity states still require a raw source. The regression test
  also checks that a bad replacement file preserves the previous catalogue.
- The full browser flow opens the real 31,424,635-byte tracked export: 11,991
  measurements in 681 runs. It pages to a run, filters and links a measured row,
  then compares every original field and the exact file SHA-256:
  `378df8237a0dac09bd88788749b364530290de6b676c6cb34a6e16828baa1ec6`.
- Final `npm test` passes: 2,339 tests, 129 skipped, and 50 art checks. All 113
  doc checks pass. The final registered Studies browser check passes in 27.9 seconds at 1440 × 900,
  390 × 844 and 375 × 667. It covers all recipes, stale plans, late replies,
  save errors, file errors, paging, selection and the real export. The Workshop
  browser check passes in 115.3 seconds before the last panel-scoped style and
  pending-row fixes. Those fixes do not change Workshop behavior.
- Independent review finds no remaining issue in plan identity, canceled work,
  save failure, metadata, paging or support limits. A second review clears the
  pending-row fix and scoped styles. A final read finds no misleading claim in
  this ticket or the usage guide. The reviewer writes none of these changes.
- Final renders and check logs are saved at
  `/Users/za/.codex/visualizations/2026/10/13/01a1338c-36c7-71e1-9c8a-05503302ca75/browser-measurements-built-20261014`.

## Result

Open Studies, then Results. Choose **Plan a measurement** to prepare and save a
checked plan. Choose **Link results** to retain selected measurements from a local
balance export. Planning and linking need no command line. Game counts describe
the work; time and money have no measured estimate. A saved plan starts no games.
Raw-game audit, run launch and design approval remain separate steps.
