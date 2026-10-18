# Choose the test and device gate

Type: grilling
Status: open
Blocked by: 04, 07, 13, 14
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

Which checks are enough to ship each slice, and which checks guard the whole web release? Do the test seams in [the spec](../spec.md) match the owner's expectation?

## Rule

Verify the public boundary and the visible user action. A mock pass does not replace a saved game or real input.

## Options

1. HTTP and service tests as the main seam, shared pure tests where logic changes, and one web journey driver with the device matrix below.
2. Copy every plugin check into a new web suite.
3. Unit tests and screenshots only.

Recommended: 1. One service seam, the reuse of the costly input and race checks, and cover for browser behavior that the widget cannot prove.

On yes: use the Testing Decisions and phase exits in the spec. Tests run only through `npm test`; browser checks only through `npm run check:browser <name>`. Register `web-online` as a new name (it does not exist yet). Keep `plugin-ui` and `plugin-ui-http` when shared UI or server code changes. Checks on this Mac stay within the house limits (tests and a short smoke); longer checks go to the M1 or Kaggle under the run rules.

## Matrix

- Desktop Chromium, Firefox and WebKit at 1280 × 800 or larger.
- Phone portrait at 320 × 568, 390/393 × 844/852, and 412/440 px widths; short landscape.
- A tablet in both orientations.
- 200% zoom, with the 197 × 426 fit case, and larger browser text.
- Keyboard-only and screen-reader journeys; reduced motion; long content.
- Real iOS Safari and Android Chrome for pan, drag, keyboard, safe areas, Share and the real End turn hit point.
- Cold and warm loads, active and blocked worker, offline return, hidden tab, sleep and wake, Back and Forward, token expiry and an account switch.

## Pass criterion

No confirmed release fault remains. Each changed control selector has its affected checks run. Render compares use two stable main captures in the same environment. The report names devices, source, skipped cover and known limits. The cold-load compare includes a run with workers blocked.
