# F-117 card pool tests timed out under load

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem

tools/plugin-setup-owner.test.ts:32 and the "F-117 guards Create" test. Two causes: the first page paid the cold Vite transform inside a 5 s action limit; each card tile ran `<card-motion>` with software WebGL, which held the renderer.

Failing lines (exact):

```
FAIL  tools/plugin-setup-owner.test.ts > F-117 loads no card painting until the Cards section shows, then tile thumbnails until a card opens
TimeoutError: locator.click: Timeout 5000ms exceeded.
```

```
FAIL  tools/plugin-setup-owner.test.ts > F-117 guards Create and applies both card pool limits inline
Error: Test timed out in 15000ms.
```

Runs (verify, attempt 1 red, attempt 2 green): 42361760843, 42371520534 (2026-11-07, first line); 42490964216 (2026-11-08, second line).

## Change

Built: 23ec83276 (warm-up page in `beforeAll`, tools/plugin-setup-owner.test.ts:12) and cf49a5bd9 (reduced motion in the New game section tests, :213; `<card-motion>` loads no pictures with reduced motion).

## Proof

Forced order: a Vite middleware delay of 6 s on the first module request (cold transform). Without the warm-up: red with `locator.click: Timeout 5000ms exceeded.`; with it: green. For the second line, run the test with motion allowed and CPU throttle (CDP `Emulation.setCPUThrottlingRate` 4): red with `Test timed out in 15000ms.` without cf49a5bd9, green with it.

## Known limits

Other plugin tests with card tiles and motion allowed can still hold the renderer.

## Work record

Built in 23ec83276 (2026-11-08 05:50 UTC) and cf49a5bd9 (2026-11-08 15:44 UTC). Last failure: 42490964216 at 2026-11-08 14:40 UTC, before cf49a5bd9. No failure after it.
