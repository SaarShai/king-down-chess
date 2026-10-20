# GUI preview integration

Status: in-progress
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

## Part 1 checks

At `5be926c1`, the type, script syntax and diff checks pass. The M1 suite
passes 3,432 tests. Only the two new focus cases fail. Their fixture puts
spendable powers and cards on the same side, which the engine refuses.
The tests now use separate card and power games in each theme. No check
limit or contrast assertion changes. The motion and card-face checks pass.

The first browser run at `78fb4da7` finds a lower-edge contrast of 1.60:1.
The inner face keeps the old 2 px lower shadow. It covers the outer ink
focus band. Keyboard focus now removes that lower shadow only. It keeps
the face and inset rim. The test keeps the 3:1 check on all four sides and
saves both images before it checks contrast, so a failure keeps its proof.

At `1783a067`, the lower band reaches 2.35:1. The saved card pixels show
both focus colours. The card ring is not clipped. The comparison reads
the old dark lower shadow before focus. At `e40f0c43`, stone-500 on that
edge makes all card cases pass at 4.71:1 or more. The power case then finds
a second fault: the frame clips the outer focus pair at the top edge.

The final design uses one inset focus pair above the paint span. This
clears the shadow, notches and frame edge. It replaces both lower-shadow
changes above and restores the original face finish. The test reads the
new band positions, adds an inset assertion, and keeps 3:1 on each of the
four sides. At `fcd225c4`, the test finds 2.35:1 over the opponent's dark
spent rim. The spent card rim now uses the existing stone-500 border
colour. The inset focus position and neutral spent rim are the two taste
choices. No assertion or time limit is removed or weakened.
