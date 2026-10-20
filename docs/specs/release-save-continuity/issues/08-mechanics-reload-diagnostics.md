# Mechanics reload diagnostics

Status: claimed

## Evidence and scope

The compiled `shared-mechanics` run `app-SWDHAx` at `0698807f` passes the earlier rows, then times out waiting for the `promotion-darkness/web` reload response. The reload wait is outside the existing capture blocks. The log does not establish a product cause.

## Plan and verification

- Keep the response predicate, timeout, status checks and state assertions unchanged.
- Handle the response observer rejection at once. On reload failure, capture the route before and after, bounded body text, screenshot, existing trapped errors and the last 20 relevant same-origin network events.
- Log paths without query values. Do not read request bodies, headers or tokens.
- Remove the row's network listeners after the reload check, whether it passes or fails.
- Review the exact diff. The parent owns the failed-lane rerun after integration. Do not run tests, builds or commit hooks while its painted check owns the compute lane.

## Outcome

Pending independent review and the next compiled failure capture. This change adds evidence only. It does not diagnose or change product behavior.
