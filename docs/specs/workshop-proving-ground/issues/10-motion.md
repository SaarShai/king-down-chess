# 10 · Motion

Status: done (PR #42, merged to main with #41, 2026-10-11)
Size: M
Blocked by: 03, 06

## Scope

- A's motion from the approved mockup (decision 27): the piece enters from the ledge by its gait; the figure fades in; the name stamps; a seal stamp with a wax ring, a stone shake and the line unroll; the board ripple after a change; the tag slides in; Move here flies, and a taken or "removed too" piece goes in a puff; the copy flies to "Yours"; the lines shake at 3 of 3; the lock flashes outside the reach.
- The limit of `docs/WORKSHOP.md:77-79`: each motion ends by 600 ms (300 ms at the Fast pace), at the still pose. None with reduced motion or Animations Off. The next action stops a running motion.
- Open decision 6 of the spec: "A is final" covers this list; the phone video is the owner's check.
- Four mockup motions break the limit. The build cuts each to the limit and keeps its look: the preview pulse on the marks (`kdm-pulse`, 1.2 s, infinite, `grammar.css:182`, set at `marks.js:1026`) becomes one 480 ms pulse, then a still highlight; the seal button pulse (3 × 400 ms, `proving-ground.html:331`) one 400 ms pulse; the pill pulse (700 ms, `:1646`) 480 ms; the copy's flight and the slot flash (320 ms, then 600 ms: `:1801`, `:366`) end together by 600 ms. The mockup keeps 120 ms motions under reduced motion (`:439`); the build shows none (decision 27).

## Plan

1. [x] **No new motion module.** Each duration is a `--dur-*` token of `src/style.css:97-100` (120 to 480 ms; the mockup's `grammar.css:54` has the same values) or the mockup's own value under 600 ms (the 320 ms flights, `proving-ground.html:1524`, `:1547`, `:1711`). Fast halves it, as `motion.ts:49` does. A unit test of a constant table would test only constants; the browser check measures the real end times.
2. [x] **`src/workshop/ground.css`:** the `kdm-*` keyframes of `grammar.css:182-191` with their reduced-motion block; `[data-pace="off"]` stops them.
3. [x] **`src/workshop/ground.ts`:** flights with the Web Animations API, as `motion.ts` does; the gait curves from `docs/2d-first-pieces/board/gait.mjs` (as `motion.ts:14`); one running motion per element; a new action, a close or a pace change cancels it.
4. [x] **Check group `motion`:** each motion ends at the still pose by 600 ms (300 ms at Fast), the four cut motions of the scope too, and no `infinite` animation runs (`noRunningAnimations`, `tools/lib/checks.mjs:141`, 700 ms after each action); none under reduced motion or Off; a second action stops the first (the method of the old `motionSetA` group, `tools/verify-workshop.mjs:1109`).
5. [x] **W14:** `video: true` on the states `stamped`, `moved` and `painted` (one phone video each).

## Verification

- [x] `npm test` passes.
- [x] `npm run check:browser proving-ground` passes three times.
- [x] W14 renders and the three phone videos.
- [ ] The owner sees the videos before the merge; the ticket records his words and the date.

## Risks

- The stone shake must not move the board in the "table never moves" sense of the game; it is inside the Workshop only.

## Does not do

- No motion outside the mockup's list.

## Comments

### 2026-10-10 · built on `claude/proving-ground`

Evidence (the logs, the frames, the renders and the videos are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/10-motion/`):

- `npm test`: exit 0. 115 test files pass (1 skipped); 1,895 tests pass (21 skipped); the 50 node tests pass. Log: `npm-test-2.log`, the run with this ticket text; `npm-test-a.log` is the run before the text (exit 0).
- `npm run check:browser proving-ground`: passes three times (99.3 s, 102.6 s, 100.3 s; 59 s before this ticket). Logs: `logs/pg-1.log` to `logs/pg-3.log`, and each run's `logs/check-N.proving-ground.log` ("proving-ground: all groups pass").
- The new group `motion` plays 13 actions at 1440 × 900 and 8 at 390 × 844. It records each animation in the Workshop (a CSS animation, a transition and a script motion) from the action's press or key. For each action it finds the motions of the action, the end of each at 600 ms or less (300 ms or less at Fast), the board in its place, and after the wait no running animation (`noRunningAnimations`), no animation at all and no flight or wax element. The actions: the entry from the menu door and from the ledge (the flight, the open piece hidden while it flies, the figure's fade, the ripple); a kept rule (the pill's pulse); the tag; Move here (the flight that ends in a puff, the taken piece's puff); S at 3 of 3 (the lines shake); the first paint (the ripple of the painted squares, the name's stamp, the copy's flight and the slot's flash); a paint out of reach (the lock); Done (the ripple); a seal on the shelf (the seal's pulse, the preview pulse); Stamp (the seal, the wax ring, the stone, the line's unroll, the ripple); a placed piece (the ripple). With Animations Off and with reduced motion it finds no motion, and after each action the still pose (the transform, opacity, filter, clip path, shadow and place of each element that shows) is the pose of Motion Normal. Then a tap on the board, Fast, reduced motion and a close each stop the motions of an entry that the check holds.
- The group alone takes 36.2 s (`timed-4.log`: 10.4 s Normal, 2.5 s Off, 2.5 s reduced motion, 6.5 s Fast at 1440 × 900; 6.5 s Normal and 4.2 s Fast at 390 × 844).
- Checks that fail without their code (each a probe against the dev server, in `probe/`): with each script motion twice as long, `motion` fails with "the Workshop opens: img ends at 960 ms, after 600 ms" (`neg-slow.log`); with no stop on a press in `ground.ts`, it fails with "a tap on the board stops the running motions" (`neg-stop.log`); with the old lock of a 450 ms timer, it fails with "a paint out of reach: the still pose of Animations Off" (`timed-2.log`).
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5183/ /private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/10-motion/w14` makes 92 renders with 0 faults (`w14.log`): 89 stills and the three phone videos `w14/painted-phone.webm` (5.5 s), `w14/stamped-phone.webm` (6.4 s) and `w14/moved-phone.webm` (4.9 s). `vframes/*-sheet.png` shows each video at 12 frames a second.
- The stills do not change. Beside the renders of ticket 09 (`../09-landscape/w14/`), 80 of the 89 stills are equal (no pixel more than 5% different; `stills-compare.txt`), and 9 differ by 2 to 477 pixels at line and figure edges. `link-card-desktop` (477), `why-g7-phone` (170) and `beast-phone` (15) render again from the source of the last commit (`againhead/`) and from this change (`again1/`, `again2/`): the two are equal (0 pixels) for all three. So no difference comes from this ticket.
- Beside the mockup: the frames of the build (`frames/`) and of the mockup (`mockup-frames/`) at the same times, at 1440 × 900 and 390 × 844: the copy's flight at 100 ms (`1440-copy-100.png`; `pairs-390-copy-100.png`) and the stamp at 100 ms (`1440-stamp-100.png`) look the same. Move here differs (change 16). The stills of `painted` and `stamped` beside the mockup (`pairs/`) show only the differences that tickets 02 to 09 and 18 record.

Changes from the ticket, each with its reason:

1. The entry's ripple starts with the flight. In the mockup it starts when the 320 ms flight lands, but its rings take up to 480 ms, so it would end at 800 ms, after the limit.
2. Move here: the taken piece and a piece removed too go in a puff of 200 ms that starts when the 320 ms flight lands (520 ms). The mockup waits 200 ms and then puffs for 320 ms (840 ms). The piece removed too puffs itself; the mockup puffs a dagger stamp in its place.
3. Move here and the entry go by the piece's gait (plan step 3), not by the mockup's slide or arc. The flight plays the gait in 320 ms (`gait.mjs` gives 420 to 480 ms). The Knight, the Paladin and a token without a pool body hop, as in `motion.ts`.
4. The copy's flight is 320 ms, and the slot's flash is the 200 ms after it (520 ms in all, scope).
5. The unroll is on the text of the new line (`.txt`): the mockup's `.plate` and `.flag` are not in its markup.
6. The seal's pulse plays when the player picks a seal on the shelf. The mockup has the `.sbtn.pulse` rule, but no script adds the class.
7. The pill's pulse plays when a tap keeps any rule that has a pill (the wide layout). The mockup plays it for the Paladin's rule III only.
8. The phone's tag does not slide in: ticket 05 made it a bottom sheet with no motion. The phone has no stone and no line text, so its stamp is the seal, the wax ring and the ripple.
9. Reduced motion: the rule of `src/style.css` (`animation: none` and `transition: none` on all elements) stops the CSS motions, so `ground.css` has no reduced-motion block of its own. The old `kdm-fade` block had no effect under that rule, and it is removed.
10. The next action does not stop a transition (a button's press, 80 ms). The press itself starts the action, and to stop its transition makes the button jump 2 px.
11. The preview pulse plays again on each new draw of a preview (a new choice under the pointer). Each pulse ends by 480 ms.
12. The check's `iso()` reads only the isolate class of a mark (`kdm-iso` or `kdm-dim`): the ripple adds `kdm-ripple` to the marks of an entry.
13. The motion check stops the toast's fade: the toast goes on its own timer (3.6 s), so its fade can run at any step.
14. No motion for Undo, Take back, a removed rule or a nub. The die, the broom, a placed piece and "Put an enemy here" ripple, as in the mockup.
15. The lock outside the reach is a script motion, and its element goes when the motion ends. Before, a CSS animation and a 450 ms timer showed it: with Animations Off or reduced motion an invisible lock stayed for 450 ms, so the still pose was not the pose of Motion Normal.
16. Move here draws the new board at once, under the flight. The mockup keeps the old marks and the old tag until the flight lands. The still pose comes first, so a stop at any time leaves the true board.
17. Plan step 4 says that the check looks 700 ms after each action. The check looks 100 ms after the limit: 700 ms at Normal, 400 ms at Fast, and 100 ms with no motion (Animations Off and reduced motion). With 700 ms after every action the check took 118 s, and one run went past the 180 s limit (`logs/first/pg-3.log`, 207 s). The end of each motion comes from its own timing (`endTime`), so a motion past the limit fails at any wait. Before the still pose, the check waits for the fonts and for each image that shows.
18. In a W14 video, each step's motion plays out (700 ms) before the next step. Without the pause, the Escape after the first paint stopped the copy's flight at once, so the video did not show it. The stills do not wait.
19. The check finds a motion by its exact name; a name with a class also matches that element with more classes. So `img` (the plinth figure) does not match `img.pg-fly` (fixed after the review, finding 1).

Reviews:

- Review of the commit `ece88c04` (`build/review-10.md` in the scratchpad):
  1. should-fix, confirmed: the `motion` check matched the want `img` with the flight `img.pg-fly`, so "the figure fades in" passed with no fade. The proof: with the fade line of `arrive()` removed, the group `motion` alone passes (`build/10-review/neg-before-fix.log`). The fix: a want with no class matches only by its exact name (`tools/verify-proving-ground.mjs`, one line). With the fix and no fade, the group fails with "the Workshop opens: plays img; it played kdm-pop, ..., img.pg-fly, image" (`neg-after-fix.log`); with the fade back, it passes (`motion-fixed.log`).
  2. nit, confirmed but not changed: `gaitOf` of `ground.ts` repeats `gaitOf` of `motion.ts`. Ticket 11 (step 2) deletes `motion.ts`, and with it the copy; its search for each removed name also finds the comment "(motion.ts gaitOf)" in `ground.ts`.
- After the fix: `npm test` passes (`build/10-review/npm-test.log`), and `npm run check:browser proving-ground` passes (`build/10-review/pg.log`).

Open problems:

- The owner has not seen the videos (the last Verification box).
- `docs/WORKSHOP.md` still tells the motion of the old Workshop (Set A, `motion.ts`). Ticket 11 writes it for A (its step 6) and deletes `motion.ts`, whose `gaitOf` line `ground.ts` repeats.
- The check takes about 41 s more (about 100 s of its 180 s limit).
