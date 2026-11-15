# Merge the launch lanes

Status: ready-for-human

Spec: [Launch lane merge](../spec.md).

## Work

Merge the four completed lanes in scope order.
Use each recorded base for a three-way merge.
Keep the current platform and learning repairs.
Add Dark-side reader tests and a picture-request test for S1.

## Checks

The design project report records each file and each hand merge.
The final full npm test passes: 6,734 cases, 387 skips and 114 Node checks.
Three optional source exports skip because the npm process cannot import numpy.
The shipped-asset checks still pass. The earlier full runs include those exports.
Each lane also passes the type checks and its focused tests before the next lane.
Five new join tests cover Dark text, staged duration, actor choice, S1 and launch recovery.
The incoming test files stay. The platform test keeps both sets of cases.

The reader matrix passes 2,448 states in Chromium and WebKit.
The menu matrix passes 136 groups in each engine. The side matrix passes 255 in each.
The launch check passes 72 groups. The old-page smoke passes six groups.
Rule and rotation checks pass in both engines.

The document check passes 195 cases, with one existing skip.
The default build and the launch build pass.
The final registered next-save and next-menus checks pass.
The balance check has zero errors and 101 recorded warnings.

The design project report is runs/launch/merge/report.md.
It gives the exact logs, source lines, screenshots, limits and final build checks.

## Comments
