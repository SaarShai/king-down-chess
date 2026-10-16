# Base branch for the owner's picks of 2026-10-15

Status: resolved
Type: task

## Scope

Saar picked J1 a, J2 a, J3 a, D2 a, L0 b, L3 a, J8 a and C1 a.
`taste/recommended` had C1 b. Make `claude/owner-decisions` from it,
use stone option a, and merge the fault fixes and the Beginner notes.
Commit locally. Do not push. Do not merge to main.

## Plan and checks

1. Replace the stone-b look with the stone-a look (`taste/stone-a`, `5e1b77ec`).
   Keep layout B, quick start and Lively motion.
2. Merge `claude/fault-round-2` (`ec044593`). Each conflict keeps both sides.
   Update an integration test only where it checks a layout that the taste
   picks change on purpose. Remove no fault-fix test.
3. Merge `taste/teach-notes` (`bcaf866c`).
4. Run the type check, the build and `npm test` on this Mac. Run
   `npm run -s check:browser plugin-ui` on the M1. Raise no time limit.

## Result

- Stone a: the stone selector covers each button, choice, toggle and
  Settings check row. The stone-a row gaps apply. The tap rule keeps its
  `:where(#app-root)` form. The other stone-a changes were the same on both
  options.
- Fault merge, five conflicts:
  - `app.css`: layout B's portrait rows take the zoom floors
    (`--board-floor`, `--context-floor`) in the board and context rows.
  - `app.ts`: one wait promise (`commandDone`). The fault form stays: chat
    results mount one at a time, select the new game, then wait for the
    command in flight before the read. The taste form waited at the start
    of each mount and blocked that select. The taste test for this case
    still passes.
  - `index.html`: Settings keeps Sound and gets the U18 arrow icon.
  - `plugin-app.test.ts` and `plugin-ios-size.test.ts`: both sides stay.
- Teach-notes merge, two conflicts (imports and board state): both sides stay.
- Review fix: the fault merge took `ec044593`, but `claude/fault-round-2`
  ends at `f5f05879`. Without it, a late page reply put the old board back
  after a chat result chose its board (LIVE-2), and a newer chat result
  waited for each older mount (LIVE-1). Merged `f5f05879`. One conflict, at
  the start of `call()` in `app.ts`: both lines stay (`commandScreen` and
  `late`).
- Test changes for the taste layout: the zoom and width tests start in the
  hall. The New game Retry test checks the hall. The width test uses the
  layout B widths and sets Cards and King powers itself. The 320 px cards
  row is 88 px (U6). Size checks wait until no motion runs, also when a
  strip rebuild restarts a coin animation.

## Verification

- `npx tsc --noEmit -p .`: pass.
- `npm run -s build`: pass.
- `npm test`: 155 files pass, 10 skip; 2,436 tests pass, 130 skip;
  node tests 50 pass. 163.6 s.
- `npm run -s check:browser plugin-ui` on the M1 at `d748b1b6`: pass, 236.9 s.

## Open points for Saar

- At 320 × 568 with Cards and King powers, the board is 135 px wide
  (the old phone rows gave 158 px). Both player rows take two rows (U6).
- Stone a puts the stone face on every button, as the sample did. This
  includes the power and card coins: a computed-style probe on the M1
  (393 × 852) shows them as stone squares with 5 px corners, not round
  coins. The Back button, Moves, Resign and Menu are stone too. Keep the
  coins round, or keep them stone? This is a taste call for Saar.
