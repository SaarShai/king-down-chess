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
