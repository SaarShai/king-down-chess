# Choose the test and device gate

Type: grilling
Status: resolved
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

## Inputs from the browser sample

[The browser sample](14-visual-sample.md) adds these checks: board squares at least 44 CSS px at 390 × 844 and at least 24 CSS px at 320 × 568 and 844 × 390; every DOM control on the account page at least 48 CSS px; focus visible (2.4.7) and not obscured by the sticky board or a sheet (2.4.11); the spent-coin and focus contrast values; the local-home "Play online" row; and real-device checks for the software keyboard, native safe areas, real zoom and larger text.

## Pass criterion

No confirmed release fault remains. Each changed control selector has its affected checks run. Render compares use two stable main captures in the same environment. The report names devices, source, skipped cover and known limits. The cold-load compare includes a run with workers blocked.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Three independent reviews (enough and no more; risk cover; can it run) checked the draft and gave 12 required changes; all are in. The full gate: [test-gate.md](../test-gate.md).

- **Option 1.** T1, the website HTTP boundary with real services and a disposable PostgreSQL database, is the main seam. Keep the pure tests (T2) and the named local checks (T4). Add one registered browser driver, `web-online`, for the top-level page (T3), and grow its cases by phase; do not copy the plugin checks into a second suite. Extend the built-output and worker probes in place (T5).
- **Where checks run.** The web push gate goes into `plugin-checks.yml` only (every PR, and pushes to `main` and `codex/**`); `test.yml` does not change. Its WebKit job and a new Firefox job get a database. `plugin-ui` and `plugin-ui-http` already run there on every PR. This Mac runs unit tests or one test file and one named browser check at a time; full browser sweeps, render compares and load samples go to CI or the M1.
- **Per phase.** Each phase of the spec has its smallest added set in the gate's phase table, with the new cases the reviews asked for: log and Referer redaction of sign-in codes and invite tokens (phases 2, 5, 8); one create budget across MCP and `/api` from phase 3; the local save across sign-in, account switch and sign-out (phases 2, 8); two tabs that sign in at the same time and crossed, stale or missing flow records (phase 2).
- **Release gate.** The device matrix of this ticket plus the sample's rows (board squares, 48 px controls, focus visible and not obscured, the contrast values, the "Play online" row, real keyboard, zoom and larger text). Each row is automated, scripted manual or owner-run, and names its person: the main session on this Mac (Chromium, WebKit, Firefox, the iOS Simulator and VoiceOver through computer use), the owner (real iPhone, real provider sign-in, the support procedure, the publish go). Real Android has no device or person yet: it stays open and blocks the release until the owner names one.
- **Speed.** Proposed targets: 2.5 s to the first account screen and 300 ms for local visual response (median of three cold runs, 4× CPU, Slow 4G, workers blocked and real). The main session fixes the numbers after the baseline measurements.
- **Stops.** A confirmed release fault, an unknown source, a skipped required database, engine or device result, an unsafe cache, an unsupported active game, an incomplete public-safety gate or a missing publish go stops the release.
