# Resolve the three source conflicts

Type: task
Status: done

The owner says “approved” on 2026-10-09 to the three proposed corrections.

## Approved scope

- When adjusting a king power for balance, do not add changes to how other pieces move.
  Keep its existing approved effects. A card may change how pieces move.
- Each side starts with four cards. This is a starting deal, not a maximum hand size.
- Each army starts with at most one Beast. Morph cannot create a Beast while that side
  has one. Salvation or Sacrifice may return a captured Beast even if that gives the
  side a second Beast.

## Plan and checks

1. Align AGENTS, RULES and MATRIX with these choices. Keep historical decisions intact.
2. Correct Rules C5, Rules C18 and Cards E2 in the workbook. Update the dependent deal
   label and source notes. Fit the two longer Rules rows. Preserve all other cell values,
   version columns, formats and native features. Check the changed views.
3. Update the reviewed source pins and report text. Keep checks for the old conflicts.
4. Rebuild the framework from the checked dataset. Confirm stable output, unchanged
   measurements, zero source findings, passing tests and document checks.

This step changes no game behavior. It makes no commit, merge, deployment or run.
The original workbook remains in Git at `f95b5f7a`, with SHA256
`7b7b998c7f0bb0ff15704533ea484b419eb997927f7f4ff58c1b7c3eb6d75445`.

## Result

AGENTS, RULES, MATRIX, the workbook and the typed records use the approved readings.
The typed hand records now use four. The Beast record applies to the starting army.
Morph keeps its second-Beast exclusion. The audit still detects each old source conflict.

The workbook changes six text cells: Cards E2 and Rules C5, D5, C18, D18, C19.
Rules rows 5 and 18 have enough height for the text. The three changed views pass visual
review. Re-import of the saved file gives the same images. All cell styles, other cell
values, formulas, validations, filters, panes and other package content stay unchanged.
The export changes unrelated fills, so only the authored text and two row heights transfer
to the original package. A byte comparison checks all remaining content.

The source already contains nine invalid formulas used as text in Piece matrix D5:H5,
J5, L5, N5 and Lists B1. These cells stay unchanged. They are outside this correction.

The revised workbook SHA256 is
`a22199dd075b7b9dcbc27028c762a7fe6cbcb0740f64f5476eefa8d43ff79d7d`.

## Verification

- `npm run balance:check`: 97 rule axes, 110 workbook versions, zero errors and warnings.
- `VITEST_MAX_WORKERS=2 npm test`: 1,518 pass; 13 skip. All 42 artwork checks pass.
- `npm run test:docs`: all 74 pass. Typecheck and `git diff --check` pass.
- Regeneration from the checked dataset gives identical output on repeat.
- All 13,145 dataset rows stay byte-identical. All 167 curated measurements stay unchanged.
- The independent review finds no remaining current-source conflict in this scope.
- Game sources, eval prices and main trackers stay unchanged. Nothing is staged or committed.

The work is ready for commit review. Commit, merge and run orchestration are the next step.
