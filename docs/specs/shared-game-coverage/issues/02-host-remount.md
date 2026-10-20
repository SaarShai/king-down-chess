# Tear down the widget before a host remount

Type: bug
Status: claimed

## Plan

1. Map the six blocked artwork requests to their caller.
2. Follow the installed SDK's resource teardown order in the local host.
3. Remove the temporary probes. Keep the CSP and final error assertion.

## Cause and change

The HTTP browser trace records six image requests from the board portrait update (`strips`), with the local host's iframe replacement on the caller stack. The host removes the old document before it closes its bridge. The installed SDK requires `teardownResource` before iframe removal. The app's teardown saves its state and disposes its board.

The host now awaits teardown before replacement when the app has advertised its capabilities. An app that has not initialized can still remount. A failed teardown from an initialized app remains an error.

## Checks

- The pure driver tests and full typecheck must pass through `npm test`.
- The registered `plugin-ui-http` check must pass all existing functional assertions and `assertNoErrors` with no probes or policy change.
- The compiled real-host remount check must still boot with its held clock.

## Evidence

- Red: root run `app-j4BgMX/plugin-ui-http.log` records six blocked portrait image requests. CDP maps them to `strips` and iframe replacement during remount.
- Source: installed `app-bridge.d.ts` requires resource teardown before iframe removal (lines 539–549 and 1082–1084).
- The candidate keeps resource domains, connection domains, allowed errors and the final assertion unchanged.
- `KINGDOWN_TEST_FILE=tools/plugin-ui-check.test.ts KINGDOWN_TEST_LOCK_WAIT=180 npm test` passes: full typecheck, 3 pure driver tests and 54 artwork checks. Log: `/tmp/kingdown-csp-remount-tests.log`.
- UI-only compilation passes into `/tmp/kingdown-csp-art-ui`; it maps the minified portrait caller to `strips`. No browser starts in this worktree.
- Browser acceptance remains with the root task after integration.
