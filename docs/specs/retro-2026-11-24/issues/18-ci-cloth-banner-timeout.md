# Cloth banner test had the 5 s default limit

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

tools/tablet-controls.test.ts:41-66: two widths and two presses in a real browser ran inside the 5 s default test limit.

Failing line (exact):

```
FAIL  tools/tablet-controls.test.ts > keeps the cloth banner clear and its whole box active (plugin: false)
Error: Test timed out in 5000ms.
```

Runs (verify, 2026-11-07): 42357732361 (attempt 2 cancelled, not proven), 42363810930 (attempt 2 green).

## Change

Built: e3fb46f7e gives the test 20 s (tools/tablet-controls.test.ts:66).

## Proof

Forced order: a Playwright route that delays the fixture page by 3 s. With a 5 s limit: red with `Error: Test timed out in 5000ms.`; with 20 s: green.

## Known limits

Other browser tests in the file still use the 5 s default.

## Work record

Built in e3fb46f7e (2026-11-07). No failure after it.
