# Close the animation records

Status: records prepared. [PR 255](https://github.com/SaarShai/king-down-chess/pull/255) holds the current check and merge state.

## Plan and checks

- Merge the walk, colour, visual-check, catalog and stride rules into the existing art lessons. Check all eight lessons from the owner's brief against the wrap-up plan, log and issue 39.
- Mark the old takeover as history. Record the current state without a change to issue 39, the catalog or the walk banks.
- Update the external hub and rules. Run `npm run test:docs` once. Let the commit hooks run unchanged. Open a docs-only PR into `staging/first-game` and wait for one CI round. Fix only real failures. Do not merge or deploy.

## Current state

- [PR 251](https://github.com/SaarShai/king-down-chess/pull/251) merges the walks and colour picks on 2026-11-05. It has 232 move banks.
- The owner approves all review sequences on 2026-11-05, including the walks left out of that build. Another worker adds the last four white walks and their black versions. This ticket does not claim that work is merged.
- [PR 239](https://github.com/SaarShai/king-down-chess/pull/239) is not merged. It swaps the walk-end jump for a slide in the last pose.
- [Issue 39](39-animation-wrap-up.md) records the earlier build. Its open-review status and four excluded walks describe that build, not the current owner decision. Another worker updates that ticket.

## Evidence

- Source records: `~/kd-runs/wrap-up-plan.md`, `log.md`, `rules.md`, `hub-status.md`, issue 39 and `TAKEOVER.md`.
- Local check: `npm run test:docs` passes once: 17 files, 186 checks pass, one check skipped. No local full-suite or browser run.
- `git diff --check` passes. The diff has only three Markdown files. All eight lessons are in the existing recipe and gates; no dated lesson is added.
- CI: see PR 255 for the result on the current head. The final report is `~/kd-runs/fin-records/fin-records.md`. The owner handles merge and deploy. No independent reviewer is used, as the owner directs.
- Left as it is: MAIN and its local edits; issue 39; the catalog, runtime selection and walk banks. The external hub and rules carry the current status and worker instructions.
