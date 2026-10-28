# Adopt the reviewed white Queen NE-to-E turn

Status: ready-for-review

## Plan and checks

Freeze the independently reviewed white Queen NE-to-E turn as a new immutable selection. Preserve the original rejected bank, the pending candidate, the exact 120 ms schedule, endpoint pixels, pivots, alpha and both matching transparent movie exports. Bind the replacement to the old selected bank hash and to the reviewer and playback evidence. Keep the four other Queen candidates excluded while their missing breakdown drawings are repaired.

Pin the resulting catalog, build a runtime package without overwriting the verified MAIN package, and check that only this selected bank changes. Review the change independently, run the appropriate npm tests and registered character-runtime/effects-states browser checks, then merge through a PR. Retain the previous package for rollback. No deployment.

## Evidence and playback correction

The independently reviewed source is frozen at catalog `7cb9f51895efef2fb1e7cf424bf4884347f75aa085f538d1a9896ea405ed5d1e`. Its bank is `26b52f17f0dcecd991ca42fbdc4ffd6db3e3aa4d61d7c639ca14fbde2e32454a`. The pending candidate and prior rejected bank remain unchanged. Both matching transparent movies and the exact review evidence are content-addressed with the replacement. The 467-bank runtime manifest is `90614d2205a2d23dd1e5dc3cf92e01e3794a78bb3097e534dea4932d190b9656`; all 466 previous runtime banks remain exact.

An independent review of the real Queen move found that reverse playback could briefly jump toward the end of a turn when intermediate images were still loading. The loader now falls back to a loaded frame already passed in the current playback direction. A delayed-decode test covers this case. The registered Queen move checks both directions and rejects non-monotonic frame times. Its trace records the outward sequence `120, 120, 72, 56, 40, 24, 8, 0` and the return rising from 0 to 112 ms.

The first independent review also reproduced a cache-pressure jump in both playback directions. The active drawing is now protected within the bounded cache, and a new regression fills that cache with other banks before checking both directions. A second independent review reproduces the old failure, confirms the fix and finds no actionable issue. The focused runtime test passes 12 cases, type checks and 67 board checks. The registered character-runtime and effects-states checks pass in 81.2 and 16.8 seconds. The verified 467-bank package is retained in MAIN; all prior assets and the 466-bank manifest and asset index are preserved for rollback. PR and CI remain pending.

PR CI exposed the existing F-008 PageDown/End test race. The same test and sheet code are unchanged by the animation work, and the character runtime is disabled in that fixture. The existing fix from commit `0348bfd3d17babdb11b4343f1b80a82ddfafa351` waits for PageDown's `scrollend` before End. Its exact test and evidence ticket are brought into this branch. Independent review finds no actionable issue, and the full local board-input file passes all 45 cases. Fresh CI remains required.
