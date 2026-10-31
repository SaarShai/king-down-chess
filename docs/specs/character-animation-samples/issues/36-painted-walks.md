# Painted walks

Status: ready-for-agent

## Plan and checks

- List every army, character and direction. Count distinct painted frames.
- Keep the catalog placement and timing. Match each figure to its shipped rest with one transform.
- Add move-only gates and runtime playback. Keep the other bank rules and assets intact.
- Render the complete review page and game captures. Compare the eight reference rows.
- Run focused tests, both browser checks and the Vercel checks. Record the results before a pull request.

## Findings

- Ten Ogre cells have four frame slots but only three distinct frame hashes. The four-pose rule excludes them.
- The catalog includes timings other than 160 and 80 ms. Preserve the recorded timing for each frame.
- The source inventory has 196 ready, 66 thin, six empty and four missing cells.
- The owner ruling keeps source order and removes the seam gate. Record the seam and inner steps in the preview and PR.
- At a figure height of 160 px, the Pawn N upper-body seam is 3.45 px; the largest inner step is 1.50 px. The Rook N seam is 14.77 px; its largest inner step is 8.99 px.
- The source comparison has 196 rows. It includes the earlier rebuild and the available Knight and Bishop J studies. The page is not a game capture and does not use the final shared rest transform.
- The source frame hashes and times match all eight reference rows. This does not check final game placement.
- The 800 ready frames use 80, 120, 140, 160, 180, 200 and 240 ms holds. None has the hash of a shipped idle or turn endpoint.
- The catalog supplies numeric placement for 712 frames. The Paladin provenance file supplies it for 64 more. The 24 Ogre transforms are recovered from the retained source crops. Each recovered transform reproduces its registered frame pixel for pixel.
- The runtime has a move-loop sampling path. It holds each frame to its recorded time and repeats during travel. The Knight keeps its existing jump. The builder does not yet publish move banks, so this path is not active in the game.
- The shared rest transform, move gates, catalog promotion, package, game captures and final preview remain open. No pull request is made.
