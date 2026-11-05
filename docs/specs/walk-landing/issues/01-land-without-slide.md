# Walk landing without a jump or slide

Status: ready for owner

## Plan and checks

The owner asks for this fix on `fix/walk-landing`, from `origin/staging/first-game`.

1. Compare two methods in the real game in Chromium. Keep the art and pose clock.
2. Check Pawn N, Guard N, Ogre E, Queen N, Pawn W (lowest stride), and Ogre NE (highest stride).
3. Require an end gap at most 3 scene px, no visible slide in a held pose, forward travel, and the same visible pace.
4. Inspect the game-size GIF at normal and quarter speed. Run the focused local tests once.
5. If the fix passes, push and open a PR to `staging/first-game`. Read one CI round. Do not merge or deploy.

## Scope

Only body travel, its focused tests, and this ticket change. The catalog, banks, and issue 39 stay outside this task. No image calls or independent review.

## Methods

- Mixed: keep half linear motion, scale travel to reach the target at the last pose start, then hold.
- Held: put all travel on pose changes and scale the last pose start to the target.

Evidence: `/Users/za/kd-runs/fin-end2/`.

## Clock correction

The single local test run finds a rounding fault on a longer move at 721 ms. Travel first divides by duration, then multiplies by the pose-clock length. The body player uses `t * rate`. Use that same clock for travel, so a pose change and its body step occur together. Keep the focused regression. CI checks the correction; the owner limits local tests to one run.

## Result

Use held travel. Each new pose starts at its step position. Scale those positions so that the last pose starts on the target. Hold that position through the turn. The pose clock, move duration, art, and banks stay the same. The mixed method fails: Ogre E moves 26.25 scene px in one pose, and Ogre NE moves 24.44 scene px.

The final build passes the six Chromium game captures at 60 fps. The game square is 112 scene px and 77.93 display px. Each pair has the same frame hashes, pose-change times, and action length. Travel stays forward. The source Ogre NE bank uses 180 ms holds; those holds stay the same. The other five banks keep their 160 ms holds and the existing playback rates.

| Walk | Old end gap, scene px | New end gap, scene px | Largest new same-pose travel, scene px |
|---|---:|---:|---:|
| Pawn N | 9.82 | 0 | 0 |
| Guard N | 6.04 | 0 | 0 |
| Ogre E | 17.00 | 0 | 0 |
| Queen N | 13.46 | 0 | 0 |
| Pawn W, stride 0.39 | 1.66 | 0 | 0 |
| Ogre NE, stride 1.76 | 6.90 | 0 | 0 |

Pose changes carry larger steps. The largest new pose-change step is 56 scene px for Ogre E. The pose cadence stays exact. Pawn W uses the real scene action, since the board controls cannot make a legal westward pawn move. The other five moves use the real board controls.

The local command `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test` runs once. Both type checks and 74 selected scene tests pass. The painted-scene checks pass 69 of 70; the new gait case finds the clock rounding fault above. The code now uses the body player's clock. No second local test run occurs. The final production build and the six final-build browser captures pass. CI will check the corrected regression.

`/Users/za/kd-runs/fin-end2/side-by-side.gif` has 192 frames at 30 fps, 1200 by 992 px, and a 6.4-second loop. Normal and quarter-speed rows retain the actual game size. I inspect the final GIF after decode: all six normal-speed pose sequences and the quarter-speed final-pose start and end pairs. The wider crops keep each figure in view. The traces and measurements are in the same folder. No independent review, full local suite, other browser, hosted check, merge, or deploy occurs. Other armies and all other directions do not receive visual checks.
