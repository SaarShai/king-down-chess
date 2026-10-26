# F7: Load clips after the board

Status: resolved
Type: task

## Fault

The first board waits for two optional clip sheets with Motion Off.
The review measures 1.80 MB of clip art in a 4.85 MB cold load.
The load promise in `scene.mjs` includes the clips.
The offline install also fetches both sheets from the build graph.

## Plan and checks

1. Measure the cold load with Motion Off and no service worker.
   Save the title, board and selected figures at all five normal sizes.
2. Add a test with clips that never load. Show that readiness fails.
3. Keep the board decode, figures and kings in the readiness wait.
   Start clips after the first frame with motion on. Defer them with motion off.
   Keep a plain figure when its clip is not ready.
   Exclude the two optional sheets from the offline install list.
4. Run the focused tests, doc checks and registered board motion checks.
   Repeat the transfer measure and compare the screen captures.
5. Record the proof and commit this finding on the current branch.

## Acceptance

- A stalled clip does not block the first board.
- Stone and pieces appear together on the first frame (F13).
- Motion Off requests no clips. Motion on requests each sheet once.
- A late or failed clip does not break a selection or a move.
- The five normal sizes keep their layout and art.

## Fix

The readiness promise waits for stone decode, figures and kings.
Clips start on the next frame after the first draw with motion on.
Motion Off keeps both sheets unloaded. Motion on or a clip selection starts each sheet once.
The clip check requires a complete image with a non-zero width.
A late or failed sheet keeps the plain figure. A late sheet does not start during a selection.
The offline install excludes both optional sheets. An offline board can use the plain figures.

## Proof

- Red: `KINGDOWN_TEST_FILE='src/render/scene-load.test.ts' npm test` fails five cases.
  The two readiness cases stay unready when the clips never load.
- Red: `KINGDOWN_TEST_FILE='tools/offline-build.test.ts' npm test` fails the new install case.
- Green: `KINGDOWN_TEST_FILE='{src/render/{scene-load,PaintedView},tools/offline-build}.test.ts' npm test`
  passes 36 selected tests and 67 art tests. The first frame draws stone, figures and kings together.
  The tests use a fake clock. They cover late, failed and partial clips, moves and disposal.
- `npm run test:docs` passes 180 checks.
- `npm run check:browser character-clips painted-game motion-concepts king-effects`:
  the painted game, motion concepts and king effects pass.
  The first clip run times out in the check's resource wait. The check now waits for completed requests.
- `npm run check:browser character-clips cache-registration`: cache registration passes.
  Clip playback and the zero-request check with reduced motion pass.
  The dark Knight pixel check fails at 9.2%. The same case with the original scene and check fails at 9.4%.
  This existing pixel fault stays outside F7. No art or check limit changes.
- The cold built site uses a fresh profile with reduced motion and no service worker.
  Each normal size transfers 4,859,144 bytes before and 3,056,263 bytes after: 37.1% less.
  Clip transfer falls from 1,802,942 bytes in two requests to zero.
- The screen proof covers 375×812, 320×568, 852×393, 768×1024 and 1280×800.
  Each size has the title, first board and selected Knight and Rook with motion off and on.
  Two original runs check for capture variation. Of 30 before/after pairs, 29 match exactly.
  The remaining pair differs by at most 2 levels in a color channel. No layout or art change appears.
  Evidence files: `before-transfer.json`, `after-transfer.json`, `clip-states-compare.json`
  and `clip-states-compare.png` in the requested output folder.

## Review

The change keeps the existing scene API and first-frame gate. It adds no dependency or UI control.
The owner asks for one commit on this branch. No push, rebase or deploy occurs.
