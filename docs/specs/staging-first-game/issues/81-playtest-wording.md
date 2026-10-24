# Fix the wording and lesson findings of the staging playtest

Status: resolved on branch `staging/lane-wording` (from `origin/staging/first-game` `2f70eab2`); not merged, not deployed.

## What

The four-player staging playtest confirmed these wording and lesson faults. The tickets and the evidence are in the playtest folder (`playtest/reports/tickets/`, `playtest/findings/`), outside the repository.

| Finding | Severity | Fault |
|---|---|---|
| F-006 | S3 | After a casual friend match, the end card says `Return to Ranked to find another ranked opponent.` The match did not come from Ranked. |
| F-102 | S3 | The Beast chain note `Nothing moves until you stop.` is wrong: the chain also completes by itself when no bite is left. |
| F-105 | S3 | In a lesson, the selection replaces the lesson task with the piece summary. In the Ogre lesson, the Take or Shove sheet does not show `Choose Shove.`; on a phone, the sheet also covers the context line. |
| F-033, F-030 | S4 | On staging, the Leap and the Sky Lift move text did not name the card. |

## Why

Each fault gives the player wrong or missing guidance. A learner cannot predict when a chain commits, or loses the lesson goal at the choice. A friend player gets guidance for an entry path that they did not use.

## Scope

- `src/plugin/screens/end.ts`, `src/plugin/screens/end-model.ts` (F-006).
- `src/context-line.ts` (F-102, F-105).
- `src/screen/play.ts`, `index.html`: the lesson task in the Take or Shove sheet (F-105, phone).
- `src/move-text.ts`: no change; tests only (F-033, F-030).
- Tests: `src/plugin/screens/end-model.test.ts`, `src/context-line.test.ts`, `src/move-text.test.ts`.
- Browser checks: `tools/verify-lessons.mjs`, `tools/verify-special-moves.mjs`.
- No rule, engine, rating or rematch behaviour changes.

## Acceptance

- A casual friend result (winner and loser) does not name Ranked. A ranked result names Ranked only where the build offers Ranked (staging, ticket 67).
- The chain note says that the chain ends when no more bites are available, or when the player selects Stop here. The chain rules do not change. Stop here and the automatic completion both work in the Beast lesson.
- In a lesson, the task stays in the context line while the player selects a piece. The Take or Shove sheet shows the lesson task. Cancel and a wrong Take still reset as before.
- The Leap and Sky Lift move sentence, short history line and account Moves list name the card, also for a computer's Sky Lift.
- Each new test fails on the base code, except the F-033/F-030 tests (see Result).

## Result

### F-006: the rematch line after a friend match

Cause: `endScreen()` (`src/plugin/screens/end.ts`) added `Return to Ranked to find another ranked opponent.` to each human result when the build offers Ranked (ticket 67). It did not read the game's rating policy.

Fix: the line moves to `rematchNote(view, ranked)` in `src/plugin/screens/end-model.ts`, unchanged at first. The Ranked sentence now needs both a Ranked build and a `ranked-v1` game. The friend line is `A rematch is Casual. It keeps the features and swaps the colours.` for the winner and the loser. A ranked result on staging keeps the Ranked sentence; production keeps none (ticket 67).

### F-102: the Beast chain note

Cause: `contextLine()` (`src/context-line.ts`) gave the chain the note `Nothing moves until you stop.` A chain also ends when the last available bite is selected.

Fix: the note is `The chain ends when no more bites are available, or when you select Stop here.` Without Stop here, it is `The chain ends when no more bites are available.` The chain rules do not change.

### F-105: the lesson task during a selection and the Take or Shove sheet

Cause: in `contextLine()`, the `selected` rank comes before the `lesson` rank, so a selected piece replaced the task. The Take or Shove sheet (`src/screen/play.ts`) gives no task. On a phone the sheet also covers the context line.

Fix:

- In a lesson, a selection does not replace the task (`!s.lesson && s.selected`, the form of the mid-way, staged-end and waiting ranks). Outside a lesson, the selection shows as before.
- In a lesson, the sheet shows the lesson task in a new paragraph, `#move-choice-goal`, above the Take and Shove words. The dialog reads it first (`aria-describedby`). Outside a lesson the paragraph is hidden and empty.
- `src/lessons.ts` does not change: the Ogre task already says `Choose Shove.`

### F-033 and F-030: Leap and Sky Lift text

Cause: the playtest (2026-10-23) used a staging build of `staging/first-game` from before the merge of main (`2f70eab2`, 2026-10-24). Ticket 59 (`84d77baa`, on main) names each released card in `describeMove`. The staging side of the merge (`0041783d`) does not have it; `2f70eab2` has it.

Result: no code change. New tests in `src/move-text.test.ts` hold the two playtest moves: a bishop Leap over its own pawn that takes on e5, and Black's Sky Lift of a maester and an archer. Each checks the move sentence, the short history line (`shortMove`), and `applyLan`, the path of an account game's history and Moves list, where a computer's move arrives as its LAN. They pass on the base code, as expected.

### Tests and checks

| Check | Before (base `2f70eab2` with the new tests) | After |
|---|---|---|
| `KINGDOWN_TEST_FILE='src/{context-line,move-text,plugin/screens/end-model}.test.ts' npm test` | 4 failed, 87 passed: F-006 (1), F-102 (2), F-105 (1). The F-033/F-030 tests pass. | typecheck and 3 files, 91 tests pass (on the merge with `4651f6da`) |
| `npx tsc --noEmit -p .` | — | pass |
| `npm run test:docs` | — | 13 files, 166 tests pass |
| `npm run check:browser lessons` | FAIL: `the selection keeps the lesson task` (actual `White ogre.` / `Can shove a neighbour.`) | ok |
| `npm run check:browser special-moves verb-marks lesson-return` | — | ok |
| `VITE_KINGDOWN_STAGE=staging npm run check:browser plugin-ui` | — | ok, 345.8 s |

New checks: `tools/verify-lessons.mjs` (the Ogre task through the selection, the sheet and Cancel; the Beast note, then the last bite completes the chain with no Stop here) and `tools/plugin-ui-check.mjs` (a friend result shows no Ranked line). `tools/verify-special-moves.mjs` asserts the new chain note in place of the old one.

## Owner decisions

1. The Take or Shove sheet shows the lesson task as a plain paragraph. Pick: keep. On no: drop it; a phone sheet then covers the task.
2. Take stays the red primary button in the Ogre lesson. To stress Shove in a lesson is a visual change; not in this ticket.
3. After a casual friend match, the line still says `A rematch is Casual.` Pick: keep.

PR: https://github.com/SaarShai/king-down-chess/pull/95
