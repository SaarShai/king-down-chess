# Armour sounds

Status: claimed

## Scope

The owner approved the Pawn and Knight selection sounds, both Knight leap and landing options, and the Pawn walk. The Pawn walk alternates the two approved takes on successive moves, as in the review scene.

Play selection on a player selection. Play a Knight leap at move start and its landing at contact. Alternate the two takes. Keep the capture sound. Sound Off stays silent.

The owner approved Bishop selection B and movement A, and Rook selection A and movement C, from sound review round 7. Play Bishop movement once. Repeat Rook movement during its animated move and stop it when that move ends or is skipped. Keep the capture sound.

The owner approved these round 8 selections: Archer B, Paladin A, Guard A, Maester C, Beast B and Ogre B. The owner says the shortened Rook walk is too fast and does not sound like the selected C. Use the original C at its natural speed for each movement.

The owner then selects Guard A and Guard movement C from round 10. Keep Maester C and Ogre B from round 8 for selection, and use their round 10 C for movement. For the six kings, the round 10 selection and movement choices are Flame A/B, Frost B/A, Stratus B/A, Mud C/B, Spirit C/A and Shadow C/A.

The generated files need Community Licence registration before release. Confirm that registration before the files ship.

## Checks

`KINGDOWN_TEST_FILE='src/{render/sfx,interface/board-api}.test.ts' npm test` passes both type checks and 25 tests. The tests cover Knight launch, contact, capture, pass, lab isolation and mute during a sample.

`npm run check:browser game-screen` passes. The lab check verifies the continuous walk control and its stop behavior. The movement-runtime check cannot start: it needs `MOVEMENT_BASELINE_DIR` for a pinned character package.

After the Pawn walk change, the same focused `npm test` command passes both type checks and 26 tests. The new test covers alternating takes, capture, pass and lab isolation. An independent review finds no actionable fault.

After the Bishop and Rook changes, the same focused command passes both type checks and 37 tests. The tests cover the capture cue, Rook loop stop on move end, skip, replacement, motion off, symbols, dispose and a hidden page, and a cancelled pending audio load. With motion off or symbols, the Rook sound plays once. `npm run check:browser game-screen` passes. The four game sound files match the reviewed files.

The first Rook loop used the reviewed C sound at one third of its length. The owner rejected that sound and speed. The replacement uses the original C without a speed change. The owner then chose to let a sound finish when a normal move ends. The loop stops repeating at the end of motion, and its current take plays to completion. This also applies to Bishop movement. Skip, replacement during motion, a hidden page and Sound Off stop the applicable sound. A short move may end before the sound reaches a repeat. A sound tail may overlap the next action.

Final check: `KINGDOWN_TEST_FILE='src/{render/{sfx,scene-onstart,effects/card},interface/board-api}.test.ts' npm test` passes both type checks and 125 tests. A real scene test covers the immediate start, start after preparation, and cancellation during preparation. `npm run check:browser game-screen` passes on the final source. The four browser screenshots were inspected.

After the round 8 picks and the Rook correction, the same focused command passes both type checks and 127 tests. The tests check all approved selection file paths, Sound Off, the unchanged Rook C file and its original playback rate in both loop and single play. The game-screen browser check passes with system Chrome. Its four screenshots were inspected. The first attempt could not start because the cached Chromium executable was missing.

After the round 10 picks and the natural-tail change, the same focused command passes both type checks and 140 tests. The tests cover the king mappings and plain-king designs, both sides, Maester swaps, Guard and Ogre shoves, Strike, a normal sound tail, cancellation and Sound Off. The 16 new files and the retained Maester and Ogre selection files match the reviewed files. `KINGDOWN_TEST_FILE='tools/offline-build.test.ts' KINGDOWN_TEST_NAME='precaches character sounds' npm test` passes one test, with 52 skipped. It checks the cache lists in both build modes. The game-screen check passes with system Chrome. Its four screenshots were inspected.

The offline cache now includes the 33 used WAV files. Their total size is 3,158,648 bytes. A first offline install downloads this additional data. The sound loader skips a cue if its first decode takes more than 150 ms. Thus a first cue immediately after Sound is enabled can be silent while the files load.

The separate new-game audio browser check did not complete. Its first two fixtures needed correction. The corrected check waited for the shared machine while another lane ran tests, then stopped. It has no passing result.

The sound-review branch is behind its upstream. Reconcile it with current main before a release review.
