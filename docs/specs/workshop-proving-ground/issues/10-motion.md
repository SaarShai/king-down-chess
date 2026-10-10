# 10 · Motion

Status: ready-for-agent
Size: M
Blocked by: 03, 06

## Scope

- A's motion from the approved mockup (decision 27): the piece enters from the ledge by its gait; the figure fades in; the name stamps; a seal stamp with a wax ring, a stone shake and the line unroll; the board ripple after a change; the tag slides in; Move here flies, and a taken or "removed too" piece goes in a puff; the copy flies to "Yours"; the lines shake at 3 of 3; the lock flashes outside the reach.
- The limit of `docs/WORKSHOP.md:77-79`: each motion ends by 600 ms (300 ms at the Fast pace), at the still pose. None with reduced motion or Animations Off. The next action stops a running motion.
- Open decision 6 of the spec: "A is final" covers this list; the phone video is the owner's check.
- Four mockup motions break the limit. The build cuts each to the limit and keeps its look: the preview pulse on the marks (`kdm-pulse`, 1.2 s, infinite, `grammar.css:182`, set at `marks.js:1026`) becomes one 480 ms pulse, then a still highlight; the seal button pulse (3 × 400 ms, `proving-ground.html:331`) one 400 ms pulse; the pill pulse (700 ms, `:1646`) 480 ms; the copy's flight and the slot flash (320 ms, then 600 ms: `:1801`, `:366`) end together by 600 ms. The mockup keeps 120 ms motions under reduced motion (`:439`); the build shows none (decision 27).

## Plan

1. [ ] **No new motion module.** Each duration is a `--dur-*` token of `src/style.css:97-100` (120 to 480 ms; the mockup's `grammar.css:54` has the same values) or the mockup's own value under 600 ms (the 320 ms flights, `proving-ground.html:1524`, `:1547`, `:1711`). Fast halves it, as `motion.ts:49` does. A unit test of a constant table would test only constants; the browser check measures the real end times.
2. [ ] **`src/workshop/ground.css`:** the `kdm-*` keyframes of `grammar.css:182-191` with their reduced-motion block; `[data-pace="off"]` stops them.
3. [ ] **`src/workshop/ground.ts`:** flights with the Web Animations API, as `motion.ts` does; the gait curves from `docs/2d-first-pieces/board/gait.mjs` (as `motion.ts:14`); one running motion per element; a new action, a close or a pace change cancels it.
4. [ ] **Check group `motion`:** each motion ends at the still pose by 600 ms (300 ms at Fast), the four cut motions of the scope too, and no `infinite` animation runs (`noRunningAnimations`, `tools/lib/checks.mjs:141`, 700 ms after each action); none under reduced motion or Off; a second action stops the first (the method of the old `motionSetA` group, `tools/verify-workshop.mjs:1109`).
5. [ ] **W14:** `video: true` on the states `stamped`, `moved` and `painted` (one phone video each).

## Verification

- [ ] `npm test` passes.
- [ ] `npm run check:browser proving-ground` passes three times.
- [ ] W14 renders and the three phone videos.
- [ ] The owner sees the videos before the merge; the ticket records his words and the date.

## Risks

- The stone shake must not move the board in the "table never moves" sense of the game; it is inside the Workshop only.

## Does not do

- No motion outside the mockup's list.
