# Ghost limb gate and hold repair

Status: claimed

## Plan

- Measure distant semi-transparent pixels and compare in-betweens with authored keys.
- Add an optional nearest clean frame hold with source hashes.
- Test the gate and repair. Rebuild four local banks and inspect the sheet.
- Open a PR to staging/first-game and check CI.

## Checks

- The focused animation bank tests pass.
- The four rebuilt banks have gate reports and a game-size sheet.
- The PR checks pass.

## Evidence

- `KINGDOWN_TEST_FILE=tools/animation-bank.test.ts npm test`: 10 tests pass.
- Four local movement bank pairs fail the ghost gate before repair and pass all eight gates after repair.
- The hold counts are Archer 6, Knight 1, Ogre 6 and Stratus 6.
- The sheet shows an abrupt Stratus pose change. A hold removes the smear but does not make that walk smooth.
- A scaled Stratus key exposed a foot alignment error. Registration now measures the placed pixels after scaling.
