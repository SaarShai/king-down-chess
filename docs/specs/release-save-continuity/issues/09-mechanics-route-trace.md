# Trace the unexpected mechanics route

Status: claimed

## Evidence

Run `app-WTEsKA` at `44e89092` accepts the Darkness promotion, but the page is already at `/play/` before reload. Reload correctly loads Play and never reads the selected game. The retained trace has no browser error. This does not establish a gameplay or cache fault.

## Plan and verification

- Keep the registered full `shared-mechanics` run, its fixtures, predicates, timeouts and assertions.
- Retain the last 20 route changes and click targets in each page document. Capture bounded caller stacks for `pushState` and `replaceState`. Do not insert awaited phase markers between the player's actions.
- Keep the pre-reload trace in the runner so document replacement cannot erase the evidence. Dump it only on failure, beside the existing reload capture.
- Capture paths and bounded control labels, not query values, input values, request bodies, headers or tokens.
- Review the diff before the parent reruns the registered check. No tests, builds or hooks run while the parent holds the lane.

## Outcome

Run `app-SHPXt9` at `02390c15` passes all 55 mechanics on both surfaces and the archived Haste row on web. It fails on archived Haste in the embedded client: the driver tries to close the choice sheet while the remote preview starts animation, then the close button disappears. The prior Darkness navigation does not reproduce with the extra awaited phase markers; no navigation fix is claimed.

The remote `choose` call returns before the preview arrives. The existing board readiness selector can still see the old non-animating position. The accepted prefix calls `stageMove`, which closes the sheet and starts the animation. The driver now waits for the choice sheet to close after its exact LAN click, then uses the unchanged animation/readiness check. A failed preview leaves the sheet open and still fails. No forced click, delay, timeout change or ignored error is added.

The awaited phase markers are removed. Synchronous click/history capture remains. Successful Darkness cases print the already-copied pre-reload trace only after their state, reload, history and browser-error assertions pass. This adds no action-time evaluation.

Pending independent review and the registered full matrix rerun for the readiness correction. The retained compiled failure is the regression red; no static test duplicates the driver. Product code and the unexpected-navigation diagnosis remain unchanged.
