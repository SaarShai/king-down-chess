# Launch lane merge

Status: ready-for-human

## Source

The design project sets launch decision 40 and the merge scope.
The scope adds the speed and reply lane and accepted item S1.

## Plan

1. Merge reading A and B from the completed lane.
2. Merge sides and menus against their base.
3. Merge speed and reply against their base.
4. Merge the completed iOS shell against its base.
5. Keep each lane's tests, tickets and documents.
6. Test each merged lane before the next lane starts.
7. Run the full tests, document tests, build and browser matrix.

## Acceptance

The game keeps both sides, the B reader, the new menus and the load rules.
The player side and the effect turn have separate text arguments.
The board picture preload uses the same request mode as the board.
The default old-page options stay off.
No commit, push, pull request or deploy occurs.

## Evidence

The design project keeps the report, logs and images in runs/launch/merge/.
The [ticket](issues/01-merge.md) records the checks.

## Verification

The four lanes join in scope order. The full tests pass.
The merge report records the unit counts, build logs and browser evidence.
The changes stay in the working tree.

## Repair

The repair follows both stage check reports.
Issue [02](issues/02-repair.md) records the fixes and regression checks.
A full kept slot stops replacement. A changed game during code load needs a new choice.
A save conflict stops turn input and offers Load the newer game.
The opted-in engine bounds each request from its start, even without a ready message.
The old engine keeps its default timer.
The design project report gives the full repair record and the evidence paths.
