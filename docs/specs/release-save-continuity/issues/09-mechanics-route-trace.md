# Trace the unexpected mechanics route

Status: claimed

## Evidence

Run `app-WTEsKA` at `44e89092` accepts the Darkness promotion, but the page is already at `/play/` before reload. Reload correctly loads Play and never reads the selected game. The retained trace has no browser error. This does not establish a gameplay or cache fault.

## Plan and verification

- Keep the registered full `shared-mechanics` run, its fixtures, predicates, timeouts and assertions.
- Retain the last 20 route changes, click targets and mount/staging/commit markers in each page document. Capture bounded caller stacks for `pushState` and `replaceState`.
- Keep the pre-reload trace in the runner so document replacement cannot erase the evidence. Dump it only on failure, beside the existing reload capture.
- Capture paths and bounded control labels, not query values, input values, request bodies, headers or tokens.
- Review the diff before the parent reruns the registered check. No tests, builds or hooks run while the parent holds the lane.

## Outcome

Pending review and execution. This is test-only evidence collection. It changes no product code and adds no row filter or separate harness.
