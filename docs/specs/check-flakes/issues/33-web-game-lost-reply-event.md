# Web game: the lost reply event comes after navigation

Type: task
Status: in review
Branch: staging/fix-lostreplies-flake

## Plan and verification

1. Find which deliberate failure has no `requestfailed` event in CI run 41326478564 (`4 !== 5`, failures `[]`, six commands).
2. Make the check wait for the real condition. Keep the count of five.
3. Reproduce with CPU throttle on the old page, before and after. Run `web-game` at least three times with the fix.

## Results

`route.abort()` returns when the browser fails the request. The renderer reports `requestfailed` later. The check navigates as soon as the abort returns. Local runs show the first event 0 to 1 ms after `page.goto` starts, so the event wins only by a small margin. On a slow runner the new document commits first, and the old document's event is lost with it. The four recovery events are on the new page and always arrive.

The check now waits for the old page's `requestfailed` event for the first command before it navigates. No assertion changes. No app code changes: the durable command recovers on the new page in both orders.

## Checks

- Diagnostic runs log each abort, each counted event and the start of `page.goto` (temporary code, not committed).
- Unthrottled, before the fix: pass, but the first event arrives 0 ms after `page.goto` starts.
- Before the fix, with 20x CPU throttle from the click to the end of `page.goto`: 3 of 3 runs fail with `4 !== 5`, failures `[]`, six commands. The CI fault is the same. The first event never arrives. In two more runs a 15 s wait for that event also times out, so the event is lost, not late.
- After the fix, with the same throttle: 3 of 3 runs pass (97.1, 94.5, 101.1 s). The first event arrives 8 to 9 ms after the abort and before `page.goto`.
- Final code, no throttle: the CI set `web-online signin-speed web-game` passes (121.7, 23.9, 82.9 s). Two more `web-game` runs pass (83.3, 80.5 s).
