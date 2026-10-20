# The visual-design check reads Home before start-up ends

Status: done
Type: task

## Fault

The deploy's browser checks failed twice on 2026-10-19 (deploy 66 try 2; the deploy of 0a7ec40b) at `docs/visual-design/verify.mjs:62`: the returning player's Continue was not visible. Both runs ended after about 2 s.

## Cause

`open()` in the check waited only until `window.view.ready` existed. `src/main.ts:71` sets `window.view` early, but Home opens only after `await view.ready()` (`src/main.ts:188`), which waits for the decoded board art and one frame. `page.goto` waits for the load event, so the gap is the image decode and the frame after it. Under machine load that gap grows, and the check read Home too soon. On the live site, Home was not yet visible when the old wait returned in 2 of 3 runs (Home about 900 ms later).

## Change

`open()` waits for `view.ready()` to resolve, with the check's own `ready()` helper, as its reloads already do. No assertion, limit or retry changes.

## Proof

- With `HTMLImageElement.prototype.decode` slowed by 1.5 s (a probe, not committed): the old wait fails at the same assertion; the new wait passes the whole check.
- Slow board art or CPU throttling does not reproduce it: the art also delays the load event, and decode runs off the main thread.
- CI on the pull request.
