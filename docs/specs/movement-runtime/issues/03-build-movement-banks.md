# Build movement banks

Type: task
Status: claimed

## Plan and checks

- Map an explicitly selected movement study to the runtime movement contract. Keep the current selection unchanged.
- Check the direction, frames, duration, pivot and normal asset gates. Test good and bad fixture banks.
- Build a local package with the white Pawn E and W drafts. Run the movement browser check and inspect game-size joins.
- Record the results and open the requested staging PR. CI runs the full suite.

## Evidence

- The local package contains 475 banks. It includes the white Pawn E and W studies. The committed selection has no movement bank.
- `MOVEMENT_BASELINE_DIR=<local package> MOVEMENT_MEDIA_DIR=<local media> npm run check:browser movement-runtime` passes. It checks both Pawn directions and the existing movement, capture and Undo cases. The Pawn direction check calls the scene for a one-square sideways move; it does not claim that a Pawn can make that move in a game.
- The check saves 20 game-size frames. The walk joins show a pose pop. The return to rest also changes the lance pose. The drafts need art review and repair before selection.
- The package and frames stay outside the repo. The frozen catalog stays unchanged.
- `KINGDOWN_TEST_FILE=tools/character-runtime-package.test.ts npm test` passes: 2 builder tests and 67 board tests. It checks a good bank, bad facing, missing frames, an opaque edge and a bad pivot.
