# Motion review improvements

Status: implemented and verified locally; visual results ready for owner review

Implement the eight recommendations from the independent motion review. Preserve the approved painted effects, original figures, static indications, no-combat scope, and absent Ice King ground. Keep all GUI work banked and card refill preview-only.

Plan: strengthen the settled check trace and existing protection exceptions in shared drawing code; fix preview reduced motion, offscreen title work and label alignment; correct check copy, increase timeline type and bring banked result actions forward with their explanations. Use existing APIs and no new dependencies.

Verification: selected effects tests and scene tests; browser assertions for initial and changing reduced motion, Replay, offscreen title stop/resume and labels; rendered phone/desktop checks for check, Guard, Mercy and the revised GUI timings. Inspect the remaining card samples to fill the review's visual coverage gap. Record evidence and show the updated previews. No deployment.

## Result

All eight recommendations are implemented. The settled check trace now retains 90% opacity. Existing crown and pawn exception shapes are 45% larger, with a slightly larger static badge and deeper red. Shared drawing code serves both game and workshop. No new signal animation is added.

The king preview applies system reduced motion on load and on changes, disables ground Replay while reduced motion is on, and explains why. Title studies start only in view and stop offscreen or on page exit. The recording helper now scrolls a title into view before waiting for its first frame. Army labels follow their crop at every preview scale.

The banked check copy says “Get your king out of check.” Card phase labels and the phone sample notice use 12 px text. Banked Defeat shows its action with the explanation at 1300 ms; Victory recap starts at 1350 ms with a short stagger; Abort reveals its next action with the explanation. Draw already groups reason and action. Production GUI timing and banking stay unchanged.

## Verification

- Typechecking and the build pass in both browser runs. `npm run check:browser effects-animation` passes in 38.3 seconds: 280 exact sample frames across 21 cards, 12 signals and 23 interface studies; legal card outcomes; keyboard/touch controls; narrow layouts; reduced motion; and new assertions for king motion preferences, Replay interruption, title viewport stop/resume, label alignment and earlier result actions. The first run found a two-pixel crop/label mismatch at the narrow width; matching max-width constraints fixed it.
- `npm run check:browser effects-states` passes in 13.8 seconds. Inspected actual game captures for Check, Guard and Mercy at phone size, including flipped boards and Guard Symbols mode. Badge shapes remain clear and do not cover adjacent identities in these cases.
- Visually inspected the revised phone signals, replay controls, earlier Defeat action and card action/contact sheets for all 21 cards. These sampled frames fill the prior card appearance gap; they do not certify every frame or physical-device performance. Evidence is in the task visualization folder under `review-improvements/`.
- Impeccable detector: 12 entries. Remaining findings are the previously identified dark-theme contrast false positives and incumbent palette/glow/header styling. The functional timeline and phone notice size warnings are gone; the one remaining undersized text entry is the unchanged 9 px category label.
- The selected unit-test command was queued behind another session's shared test lock and never ran. Cancelled only this queued process. No new unit/full-suite pass is claimed. Logs: `/tmp/motion-review-fixes-tests.log`, `/tmp/motion-review-fixes-browser.log`, `/tmp/motion-review-fixes-states.log`.
- No game rules, combat animations, static-indication choices, original artwork, Ice King ground or deployment changed.
