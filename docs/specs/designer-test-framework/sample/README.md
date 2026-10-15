# Saved study sample

This is an approval sample. It changes no game screen. The result values are
illustrative. Save shows a storage failure. Open, import and export are labels.

From this worktree, run:

```sh
node docs/specs/designer-test-framework/sample/render.mjs
```

The command renders board, Test, Results and save failure at 1440 × 900 and
390 × 844. It checks page errors, failed resources, horizontal overflow, board
bounds and save-alert bounds. Images go to `/tmp/king-down-study-sample`.
Use `--serve` to keep the sample server open. It prints the local URL.

The sample uses the game fonts, floor, plinth and art. `board.mjs` copies the
existing ChatGPT sample helper. It uses the engine, PaintedView, marks, rails
and targets. The fixture has White king a1, Black king h8, a custom T Rook d4,
own pawn d5 and enemy pawn f4. White acts. The T slot keeps the source Rook
figure in this sample through the scene's `setFigure` method.

The eight renders pass the checks. The desktop board, phone board, phone
Results and phone save failure have a visual check. This sample does not run
a game campaign or the full test suite. The owner approves the layout on
2026-10-13: “Approve the layout”. The connected controls now use the selected
Workshop figure in both the sidebar and the board. The [usage guide](../usage.md)
describes the implemented controls.

## Measurement controls sample

Add `--measurements` to render the test form, plan preview and result-file
selection at both sizes. These six renders pass the layout and resource checks.
Images go to `/tmp/king-down-measurement-sample`. Add `--serve` to open the
interactive sample. The numbers are examples. No control saves or runs games.
The owner approves this layout. The measurement controls are built.

## Browser run sample

Use `--runs` to render nine run states at 1440 × 900, 390 × 844 and
375 × 667. Images go to `/tmp/king-down-run-sample`. Add `--serve` for
an interactive preview. This sample uses the existing board and game style.
All counts and check evidence are examples. Controls do not launch or save.
The renderer checks resources, errors, page overflow, sheet bounds, target
allocations, state navigation and the approval-to-link flow. The run layout
waits for the owner's approval.

All 27 renders pass. The desktop ready view and small-phone approval view
have a visual check. The small-phone sheet scrolls to the approval statement
and control. The sample does not run remote commands or games.

## Interaction discovery sample

`discovery.html` shows proposals, coverage, sequence review and a saved failing
regression. It reuses the run sheet's game styles. Every count and replay fact
is illustrative. The existing Rook board remains a background study; the sample
explicitly says it is not the nominated replay. No game, scan or save occurs.
The spec is [interaction discovery](../interaction-discovery.md).
