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

Keep the agreed ink and gold focus pair. Keep .85 for spent cards and .7
for used powers. Add no new colour, size or game rule.

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

At `1783a067`, the lower band reaches 2.35:1. The saved pixels show both
focus colours. The ring is not clipped. The comparison reads the old dark
lower shadow before focus. A spent face now uses stone-500 for that 2 px
lower edge. It keeps its depth, grey filter and opacity. This is the only
new taste choice. The agreed focus colours and coin sizes stay the same.
