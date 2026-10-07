# Squire and medium drop — first look (2026-09-24)

> Recovery status, 2026-09-24: Lab-only historical reserve experiment. The implementation and raw games are archived; its movement/attack, hash, material and evaluation limitations prevent adoption or a balance verdict. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Exploration only. Both rules stay off in the game you play. Twenty-four games an arm, depth 2,
eight shared arrangements, seed 93. A sample this small cannot decide fairness: the arm with
neither rule scored White 0.65, which is the noise of twenty-four games, not a new edge.

The reserve is an extra piece, not a hole in the back rank. Each side may spend it once, on any
empty square.

| arm | rule | decisive | draws | mean plies | drops | what was dropped |
|---|---|---|---|---|---|---|
| neither | today's game | 0.96 | 1 | 99 | 0 | — |
| step | one square, any direction, captures | 0.79 | 5 | 75 | 48 | Squire, every game, both sides |
| forward | three forward squares, captures there | 0.83 | 4 | 108 | 48 | Squire, every game, both sides |
| block | one square, any direction, never captures | 0.88 | 3 | 90 | 48 | Squire, every game, both sides |
| medium | choose a knight, bishop, maester, or ogre | 0.92 | 2 | 84 | 48 | Knight 18, bishop 12, ogre 10, maester 8 |

## What showed up

Both sides spent the drop in every game. It is not a piece they save for later at this depth.

The original Squire — one step, and it captures — made the shortest games and the most draws
(5 of 24, against 1 of 24 without it). The forward-only Squire made the longest games. The Squire
that cannot capture sat between them.

Choosing a medium piece came closest to the game without a drop: 2 draws against 1, and games
about 15 plies shorter. When they chose, the knight was the most common, then the bishop, then
the ogre, then the maester. Nothing heavier was on offer.

## What this does not say

Do not add either rule to the random game on these numbers. The next useful run, if one is wanted,
is the step Squire and the medium choice at depth 4, with enough games to read the draw rate.
The other two Squire shapes did not look better than those two in this pass.
