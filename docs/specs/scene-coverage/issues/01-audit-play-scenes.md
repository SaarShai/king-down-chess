# Audit play screen scenes

Type: task
Status: needs-info

Check the web app in light mode at four sizes and two text scales. Cover Home, setup, Guide and settings. Use production control names in the release checks.

Test the review rule at the changed-path gate. Test layout faults through the scene page with temporary CSS. Keep known faults in a file that requires independent review.

## Findings

- At 320x568 and 150%, the Pieces and Cards views have overlapping tab names.
- At 320x568 and 150%, text on Sacrifice extends past the right edge. Text on Firewall and Control extends into the next card.
- At 320x568 and 360x640 at 150%, text on Salvation extends into Mirror.

Chromium and WebKit find these faults in the same cases. The lead decides which faults to repair.

## PR 411 review

The overlap check uses the full scroll area when a switch and the other item share a scroll box. The Cards label seed in New game at 320x568 now reports both switch overlap faults at 100% and 150%.
