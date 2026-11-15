# Build learning at the board

Status: ready-for-human

## Source

Launch decision 9. The owner requests this build.
The accepted plan is runs/launch/learning/plan.md in the design project.
Its conflict resolutions apply. The scope and owner decisions take priority.

## Baseline

The marks repair ends with 6430 test passes, 384 existing skips and 114 Node passes.
Its report is runs/launch/marks/repair.md. Source copies and hashes are in runs/launch/learning/baseline.
No existing test can be removed, skipped or weakened.

## Plan

Use local content, diagram, hint, refusal and replay helpers.
Keep the current controller, turn draft, rules operations and board API.
Connect the same full panel to Guide and the live reader.
Keep replay separate from saves and the current draft.
Run focused failure proofs, the full checks and the browser matrix.
Record each decision, result and known limit in the report.

## Checks

- Full npm test: 6504 pass, zero fail, 384 existing skips. Node checks: 114 pass.
- New tests: 74. The test audit keeps every baseline case and the same 384 skips.
- Focused tests: 152 pass in seven files. This is not the full-suite result.
- Documentation: 187 pass, one existing skip. The final ticket check repeats it.
- Normal production build, next-save and all nine marks pilot cases pass.
- Browser coverage: 78 flow groups pass across Chromium and WebKit at 360 by 640, 390 by 844 and 1440 by 900.
- The full browser run has 77 passes and one entry-timing assertion failure. The corrected event check passes all six combinations. The source and built files stay the same for these runs.
- Two extra Guide capture checks pass in Chromium, at 360 and 1440. Visual review covers 250 captures on 21 contact sheets and selected originals.
- Five deliberate faults fail assertions. All modified source files return to their prior bytes.

Logs start in the design project's runs/launch/learning folder: tests.log, tests.json, final-focus.log, docs.log, docs-final.log, build.log, next-save.log, marks-regression.log, final-browser.log, entry-complete.log, browser-coverage.json and audit.json.
The report gives source paths, screenshot paths, decisions and all limits.

## Known limits and handoff

Long help and turn text can need internal scroll on a short phone. A refusal with first-use help can need scroll too.
Hints stay on this device. A storage error keeps their memory for this visit only.
Diagrams give examples. They do not give practice or change the live board.
The existing open-chain and unsupported-save limits stay. The report gives their source paths.
The live controller still plays Light. The sides stage owns side choice and grid rows.
Keep one polite region in main.ts. turn-controls.ts adds no second status role.
No physical-device, screen-reader, Firefox or human learning trial runs. The report lists the other unchecked work.
No commit, push, pull request or deploy occurs. An independent review remains.

## Comments

The build follows the owner's request and the accepted plan. The report and ten-line handoff stay in the design project.
