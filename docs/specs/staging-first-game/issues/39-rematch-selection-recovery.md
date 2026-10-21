# Recover an interrupted rematch opening

Status: complete in staging. Parent: U07.

## Plan and acceptance

The result screen remembers a rematch as opened before its selection completes. A newer host result can cancel that selection. On return, the remembered attempt can suppress the opening of the accepted rematch.

1. Prove the cancelled-selection case in the shared result screen. Keep the old result, avoid a second rematch and preserve normal Retry for transport failure.
2. Use the existing command outcome to distinguish a cancelled selection from a completed or failed attempt. Allow the cancelled selection to run again when the result is current. Do not add a new request layer or change game rules.
3. Extend the existing compiled journeys to cover return to the same accepted rematch after an interruption. Verify the existing loss/retry path and no duplicate rematch.
4. Run focused source tests, affected compiled clients and the exact artifact check. Publish only to staging. Reuse the unchanged engine, archives and mechanics evidence. Record actual-host limits separately.

The second-account check does not block this work. Production is outside scope.

## Verification

The cancelled-selection source case fails before the patch. After the patch, 203 focused tests in six files pass, with typecheck and 54 art checks. Completed, refused and failed openings keep their existing guard. Only a superseded opening can select the accepted rematch again.

Source `68d29267` passes embedded HTTP in 257.361 seconds, including the new interruption case and the existing lost-reply and failed-board Retry cases. The web check first taps during the result guard, then uses an in-game Back button that is correctly disabled during a pending command. Those test errors are corrected. Final source `cdd700d3` passes web in 45.002 seconds. It uses browser Back/Forward and proves that the mounted document stays the same. Both clients keep the original result and open the same rematch without another rematch command or Retry. Only the web check changes after the embedded pass; that pass is reused.

The exact staging artifact passes. Preview `dpl_2fx3Hjx9mDFvRVBib4juP4ttFGKD` serves the staging alias. Server, runtime and all eleven archive hashes match the prior release. The 112 accepted mechanics executions remain valid.

Actual web finishes one disposable game. Post-Retry ChatGPT reads its result, creates its rematch and completes Ready. Web follows the original result to the same rematch and reads the same Move 1, four cards and Mercy/Darkness powers. The rematch is aborted; the original ten active game IDs remain. No retained game receives a move. Forced interruption is proved in the compiled clients; the live check proves the ordinary cross-host rematch journey.

The review keeps the repair in the shared result screen and existing command outcome. No new service, state store, poll loop, schema or gameplay rule is needed. The shared-runtime design records the cancelled-selection rule. Full evidence is in `evidence/staging-rematch-selection/verification.md` in the parent project.

The existing attached-host first-open failure still needs one Retry. Actual second-account, phone and operator checks remain open. A separate observed follow-up is that an already open solo seat needs Refresh to see its owner's Ready or result from the other host. These limits do not invalidate the rematch repair. Production is unchanged.
