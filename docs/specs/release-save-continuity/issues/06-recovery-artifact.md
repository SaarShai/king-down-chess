# Continue release games on the recovery artifact

Status: exact standalone server rehearsal passes; browser and deployment recovery remain separate gates.

## Plan and acceptance

1. Add an optional second compiled function directory to the existing `plugin-server-check.mjs`. Keep its default single-artifact check unchanged. Copy both inputs to separate temporary folders and switch the real server handler, pool and runtime to the second artifact against the same disposable database.
2. On the release artifact, create a game, accept a turn and retain its receipt. Also create a pending setup with one seat ready under migration `0017`. On recovery, prove identical receipt retry with no effects, changed-payload refusal, next-turn acceptance and reload. Finish the pending setup on its stored engine/admission and play it. Compare durable state, engine identity and command counts; reuse the existing read-only archive inventory checks.
3. Nominate exact source `c6ffec4d58569ca4b5c3df1f465ab398bb9e2a61` for recovery. It contains the accepted setup and browser-save fixes and omits the later stored-engine preview path. Its purpose is recovery from a release preview/adapter regression. A marker-only rebuild or copied release is not this proof.
4. Parent builds both exact artifacts, records their source/output identities, and runs the two-artifact rehearsal after integrated compiled acceptance. This branch changes no product code, schema, archive, deployment or staging data. Do not run builds or checks while another worker holds the shared lane.

## Verification criteria

- Existing single-artifact callers retain their current checks.
- The explicit recovery input uses its own imported `configurePlugin` and runtime; swapping static files alone cannot pass.
- Archive validation covers both artifact runtime folders and every engine referenced by the scoped rehearsal games. No archive is published or modified.
- The accepted command retry leaves durable state and command count equal. A changed command with the same ID conflicts. A fresh legal turn advances exactly once, and a fresh recovery process reads the same state.
- The pending setup keeps its engine stamp and admission across the switch, completes and accepts a turn. This checks the added nullable `setup_admission` contract rather than claiming that archive bytes prove schema compatibility.
- Mandatory hooks run only when the parent grants the shared lane. Until parent executes the exact two-artifact command, recovery compatibility remains unproved.

## Implementation and execution

The second argument is optional. The existing command and its checks remain available with one artifact. With a recovery input, the checker copies it into a separate temporary folder, imports its own `server.mjs` and closes the release pool before starting that server. The existing HTTP listener then calls the recovery handler. A second recovery instance proves reload without in-memory game authority.

The check records the SHA-256 bytes of each server, runtime entry and worker. It refuses equal server bytes. It also requires the release to advertise `kingdown_preview` and recovery to omit it. These guards check the intended adapter difference; they do not prove source provenance. Parent supplies the exact source-bound build receipts. The scoped initialized and pending game rows use the existing `summarizeEngines` and `checkRuntime`; both artifact folders must contain matching exact bytes for their referenced engines. The log contains artifact paths, hashes and revision counts, not save data or credentials.

Parent execution, after building two source-pinned standalone function directories with their normal board/art assets:

```
PLUGIN_TEST_DATABASE_URL=<approved-disposable-loopback-database> npm run plugin:server:check -- <release-function-directory> <recovery-function-directory>
```

Use a separate loopback database ending in `_test`, with the production migration order through `0017` already applied. The existing checker creates only its synthetic actors/games, restores the account-access switch and deletes its synthetic records. Do not point it at staging. Record the exact final release commit and recovery source `c6ffec4d`, each output path, build receipts and the checker log together. This command runs compiled artifacts; it does not build, publish or deploy either input.

## Evidence and limits

- `node --check tools/plugin-server-check.mjs` passes. This is a syntax check only, not runtime continuation evidence.
- No new unit test mirrors the script. The new behavior is checked by its real-HTTP, real-database assertions when parent runs the two exact artifacts.
- The rehearsal is bounded to an unfinished initialized game and a one-seat-Ready setup. It checks game/result fields, full command and player rows, game-scoped notifications, player ratings, rating-history and outbox counts for an accepted retry/refusal, then exact durable state and full rules/history/legal position after restart. It does not replace the existing terminal retry, legacy-save or multi-archive engine fixture checks.
- Equal server-byte refusal is an input guard, not proof of source provenance or a repaired fault. Parent must attest both source/output identities. The nominated recovery source omits the preview adapter; this check proves game continuation on it, not browser worker takeover, a deployment rollback or an injected preview failure. Those gates remain separate.
- Independent read-only review finds two proof gaps: byte difference alone does not establish the nominated source, and game-only snapshots miss player/notification effects. The final diff narrows the claim, checks the observed preview capability difference and adds the scoped rows. Re-review reports no remaining confirmed should-fix. No test or build runs during review.

The exact clean release `44e89092a5af42bcece0e39b1e015c6e809b57b6` and recovery `c6ffec4d58569ca4b5c3df1f465ab398bb9e2a61` both build successfully. The two-artifact checker exits zero against the disposable loopback database. It proves accepted retry without effects, changed-payload refusal, continuation to revision 3, one-Ready setup completion and play to revision 4, and fresh recovery reload. Both artifacts retain seven archives, and their hashes stay unchanged after the check.

The parent evidence folder `staging-next-ticket-candidates/u08-recovery-44e89092-c6ffec4d/` holds exact source/clean-tree receipts, server/runtime/worker/archive hashes, both build logs and the checker log. This proof applies to these artifacts and their `d1eb413b` worker. A later worker change needs a new recovery artifact that retains its newly published immutable pair, plus a new rehearsal; do not extend this receipt to untested bytes.
