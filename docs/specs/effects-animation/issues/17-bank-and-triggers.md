# Bank interface motion and show missing triggers

Status: preview ready

## Owner direction

“bank all interface animations” approves the full interface set, including the five later object studies. Bank the art without changing it. “Missing game triggers — do and show me” requests an interactive demonstration of refill and seconds countdown.

## Plan and checks

1. Record all 23 interface studies as approved. Preserve the five later samples; integration remains a separate status from approval.
2. Add an interactive trigger preview with a real seconds clock and a spend/refill action. Reuse approved art and motion. Ask whether refill should change the four-card rule before adding an engine rule.
3. Check expiry, pause/resume, reset, spent-slot replacement, unchanged other cards, reduced motion and visible layout. Show both controls in the browser.

## Result and evidence

All 23 interface studies are approved and banked. The coverage file separates banked art from live wiring. The new `preview/gui/triggers.html` runs a real 15-second deadline and a manual spend/refill slot with the approved artwork. No engine rule changes.

Browser checks verify start, pause at 13 seconds, resume, last-five warning, expiry at zero, restart/reset, Freeze → spent → Leap, unchanged Strike/Haste/Flight, reduced-motion spend/refill and reset. The visible desktop layout is inspected. Phone viewport behavior is not independently checked. JavaScript syntax and `git diff --check` pass. This is a preview check, not a full-suite claim.

The page stays open at port 5199. Screenshot: `/Users/za/.codex/visualizations/2026/10/23/01a168fe-8505-7842-89a3-dd078bd311a1/clock-refill-preview.png`.

The owner chooses “Animation preview only”. Card refill stays in the animation preview. Spending a card does not draw a replacement in real games; the four-card rule stays unchanged. No deployment.
