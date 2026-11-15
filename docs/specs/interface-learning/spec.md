# Learning at the board

Status: ready-for-human

## Source and approval

The owner requests the build of launch decision 9.
The design project supplies runs/learning/learning-spec.md and runs/learning/decisions.md.
The lead accepts the conflicts table in runs/launch/learning/plan.md.

## Scope

Build questions 1 to 6 and 8. Guide uses the same full panel.
Keep the four Guide lists, the engine rules, the shared save and the old page.
Use the current interface kit and light tokens. Add no dependency or art.

## Decisions

1. Show first-minute help until a real move exists. Free marks and pass do not count.
2. Selection shows name, New for six special pieces, the short line and a question button.
3. One full panel gives kind, name, short line, a legal 5 by 5 example, full rule, Limits and Against it.
4. Staged and opponent text names each real result. Preserve the marks repair.
5. Refused targets keep selection and use one proved local reason. Shared read.ts stays unchanged.
6. Replay reads the last opponent turn. It changes the visual board only and cancels before live input.
7. First-use power and card hints use a separate device key. You can reset only that key.
8. One polite region announces each action once. The full panel keeps board and finish controls live.

## Checks

The repair ticket is issues/02-repair.md.
It closes six confirmed checker faults. It keeps the accepted short-reader scroll limit.
Each fix has a failing regression before the change. The full suite and final browser checks pass.
The design project's runs/launch/learning/report.md, under Repair, gives the evidence and limits.

Each new rule has a regression test. Keep source-rule and approved-copy assertions.
Run npm test, npm run test:docs and npm run build.
Use own Vite preview and installed Playwright at 360 by 640, 390 by 844 and 1440 by 900.
Keep logs and captures in the design project's runs/launch/learning folder.
See [the build ticket](issues/01-learning.md) for evidence and limits.

## Build result

The stage builds questions 1 to 6 and 8. Guide uses the same full panel.
The build ticket records the checks and limits. The design-project report is runs/launch/learning/report.md.
The engine, shared rule reader, save writer and marks source stay at the stage baseline.
No commit, push, pull request or deploy occurs. An independent review comes before a pull request.
