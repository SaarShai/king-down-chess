# 19 · Tricks and seals

Status: done on claude/web-redesign-int (waits for the owner's yes on the sample)
Needs: W1 and W2 (merged)

## Scope

- Owner choice: Menu and Extra C, the Tricks part.
- Keep wax seals, riddles and one gold dot.
- Show Tricks in Extra after the first find.
- Use the Menu demo's six detectors and wax rim.
- The fast plan cuts seal motion and account sync.

## Plan

1. [x] Copy six detectors. Read the position before each legal move. Test a find and a near miss for each detector.
2. [x] Give seals at W1's press. Count this device's human plies since the turn start. In a link game, count only this side after a send succeeds. Lessons, replay, link loads, review and computer turns give no seal.
3. [x] Store seals and the unseen mark in `kingdown.tricks`. Keep them on this device. Leave the lesson store and account sync as they are.
4. [x] Show a gold dot on Menu, Extra and Tricks. Clear the dots when Tricks opens. Add no stamp or flight motion.
5. [x] Show found figures, piece seals, names and find text. Show grey shapes and riddles for the rest. Put found rows first.

## Verification

- [x] Detector and turn tests pass. Test the Archer reading in force. The fast plan cuts tests for other readings.
- [x] Store tests pass. Check reload, seen marks, duplicate finds and blocked storage. Account sync tests are cut.
- [x] Add two `menu-extra` cases: press gives a seal and dot; Undo before the press gives none. Check Menu, Back and reload too.
- [x] Final `npm test` and named browser checks pass.
- [x] Render the dot and Tricks at 390×844 and 1440×900. Inspect both contact sheets.
- [ ] The owner says yes to the sample.

## Risks

- A false find hurts trust. Near-miss tests guard each detector.

## Does not do

- No crowns, unlocks, trick sharing, account sync or seal motion.

## Comments

- Six detectors, a device store, turn awards and the Tricks page are complete.
- W1 gives seals at the press, only after a link send succeeds. Find text uses present tense.
- The 22 focused tests and type check pass.
- `VITEST_MAX_WORKERS=1 npm test`: 85 files pass, 1 skips; 1,535 tests pass, 13 skip; all 50 board tests pass.
- `menu-extra` passes twice after the merge: 11.4 s and 8.4 s. `turn` passes in 5.8 s; `link-game` passes in 2.1 s.
- The M1 launcher runs the checks on this Mac after its cutoff.
- Four sample renders pass. Both contact sheets show no visual faults.
- The fast plan cuts account sync, stamp and flight motion, and other Archer readings.
- The sample waits for the owner's yes.

### W10 integration

- Start: clean `claude/web-redesign-int` at `eb77535f68cd9cd20ad3c79da87afef20d186119`.
- Plan: merge W10, run `npm test` and `menu-extra`, then push the integration branch.
- Check: both checks and the pre-push tests must pass. The worktree must end clean.
- The merge has no conflicts. The starting head is not an ancestor of W10, so the integration needs fresh checks.
- Integration `npm test` passes: 87 files pass, 1 skips; 1,553 tests pass, 13 skip; all 50 board tests pass.
- The M1 launcher routes `menu-extra` to this Mac after its cutoff. After the shared lock clears, the check passes in 7.2 s.
- No code fix is needed. The merge keeps both sides.
- Push the checked commit with one test worker, as in the W9 retry. The pre-push hook runs the full tests and gate.

Batch 3: decided by delegation (2026-10-09).
The new seal dot stays on Menu, Extra and Tricks until Tricks opens.
Extra and Tricks have new-seal names for a screen reader.
A new seal has visible and spoken words. The page and row show the found count.
The turn control keeps the seal notice after hand-over. This small shared edit is required.
Tests: 1,667 pass, 13 skip; all 50 board tests pass. All ten browser checks pass.
W10: eight renders, zero faults. Both sheets get a visual check.
