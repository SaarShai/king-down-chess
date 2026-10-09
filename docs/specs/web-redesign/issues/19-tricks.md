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
4. [x] Show one gold dot on Menu. Clear it when Menu opens. Add no stamp or flight motion.
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
