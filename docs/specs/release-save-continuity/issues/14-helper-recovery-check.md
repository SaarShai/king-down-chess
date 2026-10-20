# Exercise fresh computer turns on recovery

Status: existing-artifact checker passes; future helper recovery nomination and rehearsal remain open.

## Plan and acceptance

1. Start at root `0b504fb3` in a new isolated worktree. Extend only `tools/plugin-server-check.mjs`, the existing real-HTTP and PostgreSQL two-artifact checker. Keep the current `812a` rehearsal compatible; do not require a helper file or add a protocol/version option.
2. After the recovery server accepts the next human turn, request a fresh computer turn. Check the accepted history, command receipt, revision and fixed engine identity. Retry the same input and refuse changed input with the same ID, with no durable effects. Keep the existing pending setup completion/play and fresh-service reload checks.
3. Import the runtime from the copied recovery artifact. For each retained source archive fixture, verify both artifact copies have the exact published bundle bytes. Load the fixture through that copied runtime, select a bounded computer move, require a legal LAN, apply it and reload on the same engine. The old LAN-only workers stay on their original path; this also supports a future tagged worker when its runtime adapter is present.
4. Obtain the parent's CPU grant before any build, test or commit hook. Keep root, product code, schema and archives unchanged. The parent owns helper hash receipts, the final recovery-source nomination, publication and deployment.

## Verification criteria

- Single-artifact checks stay unchanged. The optional two-artifact path has no mandatory helper asset, so existing `812a` release/recovery outputs remain valid inputs.
- The fresh recovery computer request cannot pass by returning a release-side receipt. It uses a new command ID after a new human turn.
- Identical retry and changed-payload conflict preserve game, command/player/notification/rating rows and rating-history/outbox counts captured by the existing durable comparison.
- The computer's accepted LAN sequence extends the full saved history and preserves the save/row fingerprint. A fresh recovery process reads the resulting full position.
- Every retained archive fixture is run by the copied recovery runtime, with no TypeScript engine or current-engine substitution. Search leaves its loaded save unchanged until apply; apply and reload retain the exact pin.
- This checker is an assert-based integration test. Do not add a unit test that merely matches its source text. Record real existing-artifact verification when the parent grants it; no pass is claimed before that run.

## Scope limits

The helper candidate changes the private `chooseMove` reply from a LAN to a tagged search context. An old runtime plus only the new archive cannot support it. This ticket verifies the needed behavior but does not select or build that new recovery source. Controlled AI levels, budgets, random thresholds, helper failure/timeout and source-free build checks remain with the directly affected runtime tests. The current old-worker artifact pair cannot establish future helper compatibility. Browser rollback and deployment remain separate gates.

## Review and existing-artifact verification

Root reads the source diff and reports no requested correction. After the CPU grant, the extended checker runs against the unchanged exact catalog artifacts, with no rebuild:

```
PLUGIN_TEST_DATABASE_URL=<approved-disposable-loopback-database> npm run plugin:server:check -- /tmp/kingdown-u08-catalog-release /tmp/kingdown-u08-catalog-recovery
```

The command exits zero. Release source is `0b504fb30e7fabaf75ca4d5c9dec42a73d0bf2bf`; recovery source is `6bd5f93bc8de528cf0e4ea7017f83d5697b1dc84`. Both runtime copies retain the accepted hashes from the prior catalog receipt. A new recovery computer command advances the solo game to revision 4. Its accepted history/receipt, identical retry and changed-payload conflict pass the durable comparisons. Pending setup completes and plays to revision 4, and a fresh recovery service reloads both full positions. All eight archive fixtures select a legal computer move through the copied recovery runtime, preserve the save before apply, apply once and reload with the same pin. The two oldest workers and the source-stamp alias pass too.

The new log and artifact comparison receipt are in the outer `evidence/staging-next-ticket-candidates/u08-helper-recovery-check-existing812a/` folder. The prior catalog recovery receipt stays unchanged. This is real new coverage of old LAN-only workers; it is not a pass for the unpublished delegated helper or its ninth archive. No product, archive, schema or deployment changes occur.
