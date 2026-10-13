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
a game campaign or the full test suite. Owner approval is still required.
