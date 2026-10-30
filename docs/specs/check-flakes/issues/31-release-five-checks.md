# 31 Release 5 check races

Status: in review
Branch: staging/fix-flakes-5

## Plan and checks

- Wait for the Mud and March autosave before the restore. Check both restored portraits and both saved king powers.
- Check the card deal ends from a browser frame, with the existing motion observer.
- Run `npm run check:browser qa` five times, the plugin motion test five times, and `npm test` once.

## Result

- `window.fen` is set before `view.ready()` and the first save. A reload at that point can lose the URL choices. Wait for the save to hold both Mud kings with March before the reload. The restored portraits and saved powers remain checks.
- CI run 41025947080, attempt 1, failed at the 1.5 s animation poll. The poll and its browser read share that budget. A slow reply or a late poll can use it up. The existing frame observer checks that the animations end 1.5 s after the deal begins.
- `npm run check:browser qa`: 5 of 5 complete runs pass.
- `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test`: 5 of 5 runs pass, 29 tests each.
- `npm test`: pass; 5,606 tests pass and 364 skip.
