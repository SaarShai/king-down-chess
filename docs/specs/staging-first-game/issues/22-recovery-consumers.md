# Continue compiled consumers across the recovery backend

Status: implementation and independent source review complete. The two source suites pass (41 tests), with typecheck and 54 artwork checks. Hooks and compiled acceptance remain open.

## Plan and acceptance

1. Keep the complete shared mechanics check unchanged. Add one named `recovery-consumers` check through the existing `web-game-check.mjs` entry. Require an exact external complete output in `KINGDOWN_WEB_RECOVERY_OUTPUT`, read by the existing output validator. Add no product endpoint, runtime registry or synthetic preview.
2. Reuse the Haste fixture, real workers, `playTurn` controls and scoped disposable database. Run only two paths per surface: current loaded release UI on archived `bab22e94` Haste after the actual backend switches to recovery; fresh recovery UI on a Haste game created with the release runtime's `febb9239` worker. The nominated recovery has its prior `812aef27` default worker and retains the released preview contract.
3. Await the initial preview before switching the loaded client's backend. Keep its document alive through the switch. Require a new prefix preview and accepted whole-turn command from recovery, then check identity, rules, FEN, legal moves, history, transport, reload and browser errors. Fresh recovery UI must load recovery bytes in a new context/harness and preview the release-created game's exact stamp.
4. Switch the real imported `configurePlugin` handler/pool against the same database and credentials. Select static output separately, so backend-only and fresh-UI transitions cannot be confused. Record exact artifact paths, critical/static/archive/helper hashes and four consumer receipts. Check that supplied artifacts remain unchanged.
5. Update the backend checker to require the now-released `kingdown_preview` contract in recovery. Keep its distinct-server guard without imposing a generic different-worker rule on compatible UI releases. Historical no-preview recovery receipts remain historical.
6. No tests, builds or hooks until root grants the CPU lane. Keep the entire checkout unchanged until every selected subcheck and its runner exit. An internal subcheck pass does not count if the runner's checkout guard fails. Parent independently nominates the recovery source and owns publication/deployment. Root is not edited by this worktree.

## Verification limits

This adds a compiled consumer gate, not a replacement for the 112-execution mechanics matrix, backend retry/rating/old-archive checks, controlled AI levels or native host evidence. Source-path and hash receipts establish the supplied outputs; a comment-only artifact difference cannot establish the nominated prior UI/worker identity. The focused check requires the actual nominated release `febb9239` and recovery `812aef27` defaults, while preserving all retained archives. No pass is claimed before execution.

## Run

After root grants the CPU lane, use the approved loopback test database and the exact complete recovery output:

```sh
env -u KINGDOWN_STAGE -u VITE_KINGDOWN_STAGE \
  PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_new_staging_test \
  KINGDOWN_WEB_RECOVERY_OUTPUT=/absolute/path/to/approved-recovery-output \
  npm run check:browser recovery-consumers
```

The check builds the release from this worktree. The external recovery site must use the same public test settings as this check (`https://web-proof.supabase.co`, `sb_publishable_local_test`). It must retain its exact source's emitted UI, server, worker, helper and archives. Do not rewrite supplied output to make the check pass. Root records the source commits and build commands. The check writes `recovery-consumers.json` in its runner output folder and rejects external browser requests. It records initial and post-switch preview responses, the accepted command, and both outputs' immutable hashes.

The existing seed function moves without a behavior change. These four paths exercise both its default-worker and pinned-worker branches against the real database and UI. Keep the original matrix gate; do not repeat its 112 executions solely for this extraction. Use the existing runner and output-reader source tests for the changed entry and selector; do not add source-text mirror tests.

## Evidence

- Independent root read finds no confirmed should-fix. The loaded document, initial preview barrier, real handler switch, both seed branches and accepted history remain covered.
- `KINGDOWN_TEST_FILE='tools/{check,web-online-check}.test.ts' npm test`: 2 files, 41 tests pass; full typecheck and 54 artwork checks pass. Log: `/tmp/kingdown-u09-recovery-consumers-source.log`.
- The approved external recovery source is `18f660c4825215473c6ca6d76df9f840aaaf7635`, output `/tmp/kingdown-u08-preview-combined/recovery/.vercel/output`. Root keeps its source/build receipt in outer `evidence/staging-next-ticket-candidates/u08-preview-recovery/combined-build.json`.
- Pending: normal commit hooks, four compiled consumer paths, exact-output cache takeover, and the updated backend retry/setup/computer/all-nine-archive rehearsal. No compiled pass is claimed here yet.
- First compiled diagnostic (`e877ecd`): the loaded web path passes. MCP host setup fails because it renames an actor whose handle the outer check just set. The existing host has no skip-setup option. Recovery mode now uses a separate actor pair per phase, lets each MCP host set its actor's first handle, then reuses that pair for web. Seed, read, write, token and cleanup scopes match all four actors. No shared host or product changes are needed.
- The first cache subcheck passes internally (104.9 seconds, 89 protected/bypass requests), but the runner rejects it because checker edits started before the whole runner exits. This is diagnostic evidence only. Preserve it in outer `evidence/staging-next-ticket-candidates/u08-recovery-consumers-diagnostic-first`; rerun both named checks from a clean commit and require the full checkout guard to pass. Make no edits during that rerun.
- The same two source suites pass after the actor-pair fix: 41 tests, full typecheck and 54 artwork checks; `/tmp/kingdown-u09-recovery-consumers-source-repair.log`. Root independently reads the actor-pair fix and finds no confirmed should-fix. Compiled acceptance remains open.
