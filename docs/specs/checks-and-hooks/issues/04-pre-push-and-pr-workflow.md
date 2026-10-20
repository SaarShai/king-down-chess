# 04 · Pre-push hook and CI

**Status:** done
**Design update:** [One CI suite per update](../../retro-2026-10-20/issues/01-retro-ci.md)

## Current behaviour

The pre-push hook skips ref deletions. It runs the repo gate in `push` mode with the remote, URL, git variables and stdin lines. A missing gate or a failed gate refuses the push and shows its reason. The hook runs no unit suite. It accepts a non-HEAD commit and tracked edits.

A direct push to main cannot change a protected path. The hook checks paths from the remote head to the pushed commit. An unknown remote head refuses the push and says “fetch first”. A branch push still runs the gate.

`plugin-checks.yml` runs one suite on each PR update and on pushes to main. The `verify` job uses Node 24 and PostgreSQL. All browser jobs stay.

## Files

`.githooks/pre-push`, `.githooks/pre-push.mjs`, `tools/lib/changed-files.mjs`, `tools/lib/changed-files.test.ts`, `tools/git-hooks/pre-push.test.ts`, `.github/workflows/plugin-checks.yml`, `tools/workflow.lint.test.ts`.

The temporary-repo helper copies the modules that the hooks import. The gate fixture records its arguments, stdin and git variable names.

## Checks

- The hook tests cover gate-only pushes, a failing suite script that never runs, the secret-gate refusal, a missing gate, deletions, non-HEAD pushes, staged and unstaged edits, all protected paths, a rename out of a protected path and unknown remote heads.
- The workflow lint checks the PR and main triggers, Node 24, PostgreSQL and each browser job.

## Required status names

The removed `test.yml` has workflow name `Test` and job ID `test`. The first ticket called the required check “Test”. GitHub required no checks on main at the 2026-10-20 read-only check. See the design update for the API results. No GitHub setting changes.
