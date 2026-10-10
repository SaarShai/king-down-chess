# 07 · Check shows its cause

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Blocked by: none

## Scope

- Owner choice: Their turn A, The tell (spec §1.1). The fast plan keeps the check causes below.
- Demo: `feat-their-turn-check`. Reuse its cause words and still marks with the real engine.
- Files: `src/move-text.ts`, `src/context-line.ts`, `src/ui/table.ts`, both board views, `src/render/sfx.ts` and their tests. Keep `src/main.ts` changes to calls. Add `tools/verify-their-turn.mjs`.

## Plan

1. [x] Add pure `checkersOf(pos)` beside `threatsIn`. Return each checker, its king and its path. Count frozen pieces. Compare with `inCheck` under the powers rules.
2. [x] Show a still ember ring and thin cause lines above the figures. Show them at landing. Keep them during a read or selection.
3. Cut shot lines for takes with no contact.
4. [x] Add cause words on the second context row. Name an Archer's screen, a knight, both checkers and a checker moved by Strike. Keep staged-turn words above the cause.
5. [x] Play one low check note at landing: a triangle from 110 to 98 Hz with 220 Hz. Add no vibration.
6. Cut changes to the other sounds.
7. [x] With Motion Off or reduced motion, show the still marks at once.

## Verification

- [x] `src/move-text.test.ts`: seeded legal games under powers rules and the current Archer reading. Cover rule flags, Holy Light, Darkness, a frozen checker, double check and discovered check.
- [x] Pure cause and context tests: name the actual checkers. Keep the cause out of staged turns, reads and selections.
- [x] Sound test: the low note has the required tones at one start time.
- [x] `their-turn`: ring and lines at landing, staged check words, Undo clears marks. Run twice after the final merge.
- [x] `npm test`, typecheck and touched browser checks pass. Both plugin checks pass. Record the page size below.
- [x] Render three stills at 390×844 and 1440×900. Inspect both contact sheets. The sample waits for the owner's yes.

## Risks

- A wrong checker gives a false cause line. The corpus test guards it.
- A line across a figure can hide detail. Keep it thin, with a light halo.

## Does not do

No bloom, draw-on, timing module, shot lines, vibration, other sound changes or video. No tell (13), red flash or king shake.

## Comments

W5 is complete. The sample waits for review.
- Cause words use W2's context line. Staged turns keep their words.
- Checkers and still marks use the real engine. The low note plays at landing.
- Cut bloom, timing, shot lines, vibration, other sound changes and video.
- Test-first: cause and context tests fail, then pass. Typecheck and build pass.
- `VITEST_MAX_WORKERS=2 npm test`: 83 files pass, 1 skips; 1,513 tests pass, 13 skip; 50 scene tests pass.
- Browser: `their-turn` passes twice (5.1 s, 3.6 s). `turn`, `game-screen`, `painted-game`, `playable-clay`, `plugin-ui` and `plugin-ui-http` pass. The M1 runner selects its local fallback.
- Plugin default stays. Phase 1: 4,291,869 → 4,292,443 bytes. After W2: 4,292,542 → 4,292,542 bytes.
- `SAMPLE=W5`: six renders, no faults. Both contact sheets are clear. No video.
- The review finds no work from the fast plan's cut list. W2 merges with both units' tests.

## Integration

Plan: merge W5 without a fast-forward, check the tree, then push the integration branch.
Checks: no lost changes, no conflicts, and a passing pre-push test and gate.
The owner asks for this merge and push. The starting branch is clean.
The start is `dd3d7f67f53dadae04ff55331d39e4c7e817e95c`, an ancestor of W5.
Merge `e71df1f2aee23972cab2bc5977bea050a8f51a52` has no conflicts.
Its tree is the same as W5. The builder's full run above stands under the owner's rule.
The push hook must pass before the branch goes to origin.

## Batch 3 words

- decided by delegation (2026-10-09).
- Check names the colours on one device. Computer and link play use their and your.
- The Archer names the king and states the present fact. The line has eight words or fewer.
- The plugin keeps its default words. Its page is 4,295,044 bytes before and after.
- Checks: npm test passes (1,695 tests; 13 skipped). Typecheck and all ten required browser checks pass. Three extra checks pass.
- Sample W5: 6 renders, 0 faults. Both contact sheets are inspected.
## Board review fixes

Decision: decided by delegation (2026-10-09).
Both check rings have a light halo. Edge contrast: painted 4.31:1; 3D 3.41:1.
Phone cause lines use a 1.5 CSS px core and a 3.5 CSS px halo.
The 3D halo draws after the board. A pixel check guards this order.
Plugin defaults stay. Page size: 4,295,044 → 4,295,953 bytes.
W5: 10 inspected renders, 0 faults. Tests and both plugin checks pass.

## Batch 3 repair 2

Items 4 and 7: decided by delegation (2026-10-09).
Check words name the viewer's king or the friend's king as required.
The computer-move line wins when the computer is in check. Online wait words keep the cause.
On one device, causes use Black's or White's piece and the other king.
Cause and rank tests pass. The browser checks all eight viewer/check-side combinations.

Item 8: decided by delegation (2026-10-09). The board keeps the check ring and cause during computer search. The cause words and board agree. The tell and move still use their former timing. their-turn checks the ring and checker in each computer and link state.
