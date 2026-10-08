# Prevent unintended same-square board actions

Status: resolved

## Source

Independent review A, specification finding F1, confirmed by source inspection. See [review validation](12-independent-review.md).

## Defect

A second tap on a selected piece or a drag start can submit Haste pass, an Archer shot or a same-square power. The board's selection handler also submits moves. The engine uses the selected square as both source and destination for these actions.

## Repair and checks

Separate selection from submission. Keep pass and same-square powers explicit. Match shots against their capture target. Preserve ordinary destination taps, Haste choices and intended swap/shove controls. Use the existing website interaction rules where they apply.

Add browser regressions for repeated selected-square taps and drag start after Haste, with an Archer shot available, and with a Freeze action available. Assert no unintended revision change. Verify that explicit buttons and intended target actions still work. Use the project pull request and approved release path for a repair. No implementation or release occurs in the review task.

## Answer

PR 22 separates selection from submission and uses the existing armed-power rule. Fixture and HTTP/database browser checks pass for repeated selection, drag start, Archer targets, explicit Freeze and Haste. Keyboard checks cover both board orientations.

PR 23 gives changed board content a new resource URI. The real ChatGPT check then passes: after explicit Haste e2-e3, selecting e3 twice clears the choices and keeps White to move. Selecting e3 then e4 completes the action. The computer replies, and a full chat reload restores White to move at move 2. [Ticket 16](16-board-resource-cache.md) holds the release and live evidence.
