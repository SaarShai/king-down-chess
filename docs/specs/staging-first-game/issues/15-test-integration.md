# Restore integrated race and remount checks

Status: source verified; combined release gate remains open. Parent: U09.

## Plan and acceptance

The combined source run on `3e979f1b` is the baseline red. Scope: the refusal and failed-connect cases in `tools/plugin-races.test.ts`, joined-random remount in `tools/plugin-lobby.test.ts`, old-wait recovery in `tools/plugin-wait-recovery.test.ts`, result → New game scroll in `src/plugin/app.test.ts`, and in-flight move/chat-result in `tools/plugin-app.test.ts`. The confirmed SDK initialization fault adds only its adapter correction in `src/plugin/bootstrap.ts`. Menus and board fixtures have separate owners.

- Use existing source-module readiness at direct module-call boundaries. Preserve the race, refusal, Retry and selected-board assertions.
- Stop the SDK resource while its document can reply; let normal Remount replace it. Preserve both joined-game assertions. Add no shared-host teardown fallback.
- Let the normal unheld list promise settle before checking New game scroll. Preserve the held read and final scroll assertions.
- Diagnose failed connect before any product correction. Preserve explicit teardown, established close and the runtime's closed-queue guard.
- Run the selected failures and relevant lifecycle cases through `npm test`, obtain independent read review, then normal hooks. The parent owns the exact combined suite, compiled checks and staging release.

## Baseline evidence

Final assertions in the parent `evidence/staging-next-ticket-candidates/u09-integrated/source-suite.log`:

- Refusal/other game: `harnessApp.call` is undefined at `soloBoard` (races:31/376), before the scenario. In-flight move: the same undefined export at plugin-app:1812, before its chat result. No refusal defect is shown. The initial hypothesis about waiting for the first widget write is rejected.
- Random remount: no new Get after Remount (lobby:564). Old-wait recovery: no found-game dialog (wait-recovery:37). Both blank the iframe before the host asks its SDK responder to tear down. They now use the existing live teardown helper.
- Scroll: unheld branch sees 0 instead of 800 (app:124); deliberate Play entry now waits for an asynchronous list read.
- Failed connect: its error line never appears (races:560). This remains red after the source harness boot correction `9038f1cb`, incorporated here as `8443d090`. The first focused check passes eight cases but fails R9; 308 are filtered (`/tmp/kingdown-u09-test-integration-focused.log`).

## Confirmed connection fault and correction

A bounded diagnostic confirms the rejected initialize request is consumed, the new frame exports exist, but its queue is already closed, connected is false, mounting is true, and no notice remains. The installed SDK closes its transport before throwing initialization rejection. The adapter forwards that close as full page disposal, so the runtime's correct closed-queue guard suppresses the later connection notice. Log: `/tmp/kingdown-u09-r9-closed-red.log`. Temporary dumps are removed.

The adapter now forwards close only after initialization succeeds. Resource teardown stays unconditional; the runtime guard is unchanged. A direct regression models the SDK's asynchronous close-then-reject order and fails before this correction because the queue is closed (`/tmp/kingdown-u09-r9-adapter-red.log`). An initial synchronous mock hit module initialization instead and is not accepted as red evidence.

## Verification

`KINGDOWN_TEST_FILE='{src/plugin/app.test.ts,tools/plugin-{app,races,lobby,wait-recovery}.test.ts}'` with the six affected scenario names, the new initialization-rejection case, both early teardown outcomes and both established close/teardown disposal cases passes 14 selected cases; 304 are filtered. Typecheck and all 54 art checks pass. Duration: 8.84 s. Log: `/tmp/kingdown-u09-test-integration-green.log`.

Independent read review of the full final diff finds no should-fix. Original meaningful assertions and timeouts remain. This is focused source evidence, not a combined-suite or compiled pass. No archive, database, build or deployment change belongs to this ticket.
