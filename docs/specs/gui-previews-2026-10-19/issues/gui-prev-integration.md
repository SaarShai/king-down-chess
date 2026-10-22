# GUI preview integration

Status: done
Type: task

## Scope

Build part 1 of gui-integrate only. The owner asks for coin focus on
`claude/gui-previews`. Parts 2 and 3 stay out of this build.

## Plan and proof

1. Put each board coin face in one `.coin-paint` span. Keep the image,
   symbol and notches inside it. Move the rim, dim and grey filter to it.
2. Keep the focus pair on the button at full opacity. Keep the coin sizes,
   card image sizes, touch targets, armed ring and motion.
3. Add tests for the paint span, spent and used focus, and motion. Measure
   the drawn focus against the same coin without focus. Require at least
   3:1 in light and dark, with Freeze and Vault at 390 × 844.
4. Run `npx tsc --noEmit`. Commit the change. Run the full unit suite with
   `m1-unit.sh` and `plugin-ui` with `check-runner.sh`. Record each result.

The card-face helper must measure the button through the new span. Existing
size and card-face assertions keep their values. No server code changes.

## Choices

Keep the agreed ink and gold focus pair. Draw its two 2 px bands inside
the coin, above the face and notches. The board and segments use this
inset method. Keep .85 for spent cards and .7 for used powers. Keep the
original lower shadow. Use stone-500 for the spent card rim, so the ink
focus band changes it at more than 3:1. Ready and armed rims keep their
colours. Add no new colour, size or game rule.

## Part 1 build

Each board coin has one paint span. It holds the image or symbol and the
power notches. The face, rim, opacity, grey filter, deal and spend effects
use that span. The button keeps its full-opacity focus pair.

The focus pair sits inside the coin and above its paint. This keeps the
frame from cutting it and keeps the face, shadow and notches below it.
The spent card rim uses stone-500. The dark spent rim otherwise changes
at only 2.35:1 under the ink focus band. The new rim clears the 3:1 guard.

The card-face helper finds the button through the paint span. Its size
assertions keep the same values. The symbol and motion tests now read the
paint span. The focus tests use separate card and power games, as the
engine requires. No assertion or time limit is removed or weakened.

## Check results

The complete code passes at `1da936a7`:

- Type check, script syntax checks and `git diff --check`: pass.
- Full M1 suite: 194 files pass; 3,436 tests pass; 164 database tests skip.
  The M1 has no test database. The suite takes 326.21 seconds. All 53 art
  tests pass. The board file passes 184 tests; motion passes 19 tests.
  Log: `unit-coin-focus-6.txt` in the lane output folder.
- `plugin-ui`: pass on this Mac in 329.5 seconds. The required runner
  reports exit 0. Log: `checks-coin-focus-5.txt` in the lane output folder.
- All four sides of each spent card and used power coin pass at 390 × 844
  in light and dark. The card set includes Freeze and Vault. The lowest
  card result is 3.76:1. The lowest power result is 3.36:1.
- Coin and card image sizes keep their old test values: 44/36 px with
  touch, and 34/26 px for desktop cards. The ready hand rings keep at least
  3.66:1 on their faces. The resource is 925,769 JSON bytes, below 1,000,000.
- No server code changes. This part needs no `plugin-ui-http` check.

The lane output folder holds 40 before/focus PNGs and `contrast.json` in
`coin-focus-proof/`. The reviewed card and power images show a full focus
pair and clear face art. The original lower shadow stays in place.

## Final record check

This record covers part 1 only. Parts 2 and 3 remain outside this run.
There is no merge conflict and no A4 id change in part 1.

The record commit changes this file only. Final-head checks use
`unit-coin-focus-final.txt` and `checks-coin-focus-final.txt` in the lane
output folder. Stop a launch if its commit fails. Read HEAD before each
launch, since both runners check committed files.
