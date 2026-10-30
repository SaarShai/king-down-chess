# Army contrast candidates

Status: in-progress

The owner asks for color changes to seven characters. Keep the selected banks,
selection and catalog unchanged. Use the current rest masters as sources.

## Plan and checks

- Add an optional per-color-group mapping. Keep the current mapping as default.
- Test opposing lightness changes, soft transitions, alpha and repeat output.
- Make two targets for each of the eight changed armies. Fit each target and
  check the rest frame and three action frames. Measure the named and unchanged
  parts. Review both board squares and save the report in the run folder.
- Open a pull request to staging/first-game. Check CI before the handoff.

## Result

The group mode and same-army target option are in PR #220. The preview uses
16 target masters and 48 action samples. Each fitted frame keeps its source
alpha. The king selections have no attack bank. Beast has no idle bank.

The color checks fail. The Paladin beard and boots change. The Ogre tooth
changes. The Beast teeth and mouth change. The Mud mask stays too light.
Stratus white gold and skin also change. The sample sheet and measurements
are in the run folder. Do not run the full banks from these fits.
