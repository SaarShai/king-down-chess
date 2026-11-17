# Repair learning checks

Status: ready-for-human

## Source

The owner requests repair of the learning play check and code check.
The design project keeps both reports in runs/launch/learning.

## Verified faults

The browser reproduces the missing enemy rule announcement, the occupied staged-tap gap,
the wrong card cancel text, lost focus after resign, and finished play controls in the Tab order.
The source confirms seven unused preview selectors.
New checks fail for all six faults before the repair.
The accepted short-reader scroll stays. Internal scroll reaches Cancel and keeps the board fixed.

## Change

Enemy inspection announces the name, square and short rule once.
Each tap on a closed draft gives the staged-turn reason and red edge.
Card cancel names the card. Power cancel names the power.
A new result moves focus to Rematch.
The finished grid and turn controls are inert. Rematch restores play input.
The unused preview selectors leave the stylesheet.
No shared runtime or save code changes.

## Checks

The full suite passes: 6504 tests, zero failures and the same 384 existing skips.
All 114 Node checks pass. The case lists stay the same, with duplicate counts.
Documentation passes 187 tests with one existing skip. The normal production build passes.
The registered next-save check passes. All 42 repair browser groups and the style assertion pass.
All 18 result, access and old-page regression groups pass.
The browser checks use Chromium and WebKit at all three stage sizes.
They record zero console or page errors and zero unexpected failed requests.
All seven recorded preview ports are closed. All 132 captures receive visual review.
The final results and limits are in the design project's stage report, under Repair.
Tools stay in runs/tools/launch-learning-repair. Evidence stays in runs/launch/learning/repair-checks.

## Comments

The first pilot assumes that Menu stays visible on a phone result.
The result uses that strip. The corrected check uses Menu where it is visible.
The Tab, replay and result-action assertions stay at each size.
No game source changes during the full suite. The final documentation check follows this ticket.
Physical devices, actual screen readers, Firefox and the later full size matrix stay unchecked.
No commit, push, pull request or deploy occurs.
