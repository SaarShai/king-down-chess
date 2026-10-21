# Recover an interrupted rematch opening

Status: claimed. Parent: U07.

## Plan and acceptance

The result screen remembers a rematch as opened before its selection completes. A newer host result can cancel that selection. On return, the remembered attempt can suppress the opening of the accepted rematch.

1. Prove the cancelled-selection case in the shared result screen. Keep the old result, avoid a second rematch and preserve normal Retry for transport failure.
2. Use the existing command outcome to distinguish a cancelled selection from a completed or failed attempt. Allow the cancelled selection to run again when the result is current. Do not add a new request layer or change game rules.
3. Extend the existing compiled journeys to cover return to the same accepted rematch after an interruption. Verify the existing loss/retry path and no duplicate rematch.
4. Run focused source tests, affected compiled clients and the exact artifact check. Publish only to staging. Reuse the unchanged engine, archives and mechanics evidence. Record actual-host limits separately.

The second-account check does not block this work. Production is outside scope.
