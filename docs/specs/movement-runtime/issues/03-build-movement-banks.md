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

## Review fixes: plan and checks

- Use the character and army idle registration for each movement bank. Keep other banks unchanged.
- Include entry and settle frames in order. Reject duplicate movement facings.
- Test the scale, joins, duplicate selection and larger canvas. Compare the committed package before and after.
- Run the focused tests and movement browser check. Inspect the joins at game size. Record CI.

## Review fix evidence

- The committed selection builds 473 banks and 5,313 assets. The manifest is byte-identical before and after the fix.
- A Pawn study with entry and settle frames builds ten frames in order. Its full duration is 1,000 ms. Its registration height is 240 px, the idle height.
- The E and W Pawn movement banks both use the 240 px idle registration. Their former heights were 228 px and 238 px.
- The independent builder review found wrong movement scale, lost entry and settle frames, and duplicate movement facings. The fix uses the idle height, joins the authored sections, and rejects duplicates.
- `KINGDOWN_TEST_FILE=tools/character-runtime-package.test.ts npm test` passes five builder cases. The cases cover each review fault.
- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts KINGDOWN_TEST_NAME='padded movement canvas' npm test` passes. It checks pivot, scale and draw position.
- `MOVEMENT_BASELINE_DIR=<package> MOVEMENT_MEDIA_DIR=<media> npm run check:browser movement-runtime` passes. The game-size Pawn joins show no scale change. The draft poses still change at the joins.
