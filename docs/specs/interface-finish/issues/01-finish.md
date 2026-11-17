# Finish the release candidate

Status: ready-for-human

Spec: [Finish the launch build](../spec.md).

## Work

Verify R01 first. Then verify the 45 short rules.
Build each accepted item that the merge does not supply.
Keep all tests. Use no new dependency.
Record each decision, check, limit and untested item in the stage report.

## Checks

The full test run passes after the last product change.
It has 6,791 passes and 387 conditional skips.
Three source-export cases skip because that run lacks NumPy.
The earlier baseline has 384 skips.
All 114 renderer checks pass.
The seven export checks also pass with the installed NumPy Python.
Document checks pass: 195 passes and one existing skip.
The stage report gives the counts, logs and browser records.
No test is removed, newly skipped or weakened.

The game matrix passes 2,448 states.
The shell matrix passes 1,020 states.
The feature run passes 156 groups at the three core sizes.
The early Menu regression passes 40 cases on the final build.
The final two soak games finish with no fault.
The unsigned final app installs and opens on both simulators.

The rule checks reject six deliberate faults and restore the source bytes.
The old-page browser checks pass in both engines at the three core sizes.

Evidence is in the design project's `runs/launch/finish/report.md`.
The report also lists the full test counts and the document-check result.

## Limits

The physical-phone motion gate stays open.
Native touch, rotation, screen-reader speech and sound quality are not checked.
The smallest choice view uses a short secondary scroll area for optional effects.
The report records the load margin and the untested live-service and store steps.
No commit, push, pull request or deploy occurs.

## Comments
