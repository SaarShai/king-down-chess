# Plan measurements and link results in the browser

Status: claimed
Type: task
Blocked by: none

## Outcome and approval

Owner request, 2026-10-14: “continue on this branch and bring measurement plans
into the browser, so designers can choose a test, preview its settings and cost,
and link results without using the command line.” This approves the functional
scope below. The new visual controls wait for approval of the rendered sample.

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
- The six new sample renders pass at desktop and phone sizes. The form, preview
  and result selector are open for the owner's layout approval. No production
  controls are built before that approval.
- Save version numbers alone no longer mark a plan stale. The original plan
  snapshot and fingerprint stay fixed. Identity, rules, design version, actions
  and checks still compare. Review finds a connected CLI issue: it must rebuild
  the original plan snapshot after a save-only version change. That fix is in
  place. Twelve focused tests and 50 art checks pass.
