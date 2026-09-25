# Squire and medium drop — depth 3 look (2026-09-24)

> Recovery status, 2026-09-24: Lab-only historical reserve experiment. The implementation and raw games are archived; its movement/attack, hash, material and evaluation limitations prevent adoption or a balance verdict. [Catalog and qualifications](../cursor-recovery/2026-09-24-0213b442/RESEARCH.md) · [Adoption record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).

Exploration only. Neither rule is in the game you play. Eighty games an arm, depth 3,
twenty shared arrangements, seed 94, four workers. Records: `sim/out/s3-*.jsonl`.

Eighty games at depth 3 is a look, not a final verdict. White’s score still moves around
(0.43–0.58 across arms); treat that as noise, not a new edge.

The reserve is an extra piece, not a hole in the back rank. Each side may spend it once, on
any empty square.

| arm | rule | decisive | draws | mean plies | drop games | drops | what was dropped | shoves / game | archer shots / game | beast chains / game | drop square later shoved | drops that later capture |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| off | today's game | 0.80 | 16 | 101 | 0 / 80 | 0 | — | 1.89 | 3.51 | 0.46 | — | — |
| step | one square, any direction, captures | 0.94 | 5 | 91.5 | 80 / 80 | 159 | Squire 159 | 1.69 | 3.0 | 0.34 | 5 times in 5 games | 74 of 159 |
| forward | three forward squares, captures there | 0.89 | 9 | 105.6 | 80 / 80 | 159 | Squire 159 | 1.59 | 3.2 | 0.40 | 1 time in 1 game | 68 of 159 |
| block | one square, any direction, never captures | 0.82 | 14 | 100.3 | 80 / 80 | 159 | Squire 159 | 1.41 | 3.6 | 0.45 | 1 time in 1 game | 0 of 159 |
| medium | choose a knight, bishop, maester, or ogre | 0.90 | 8 | 101.3 | 80 / 80 | 160 | maester 55, ogre 39, knight 37, bishop 29 | 1.88 | 3.12 | 0.44 | 9 times in 8 games | 69 of 160 |

“Drop square later shoved” means an ogre shove whose shoved-from square is a square that
earlier received a drop in that game. “Later capture” follows that same dropped piece on
later moves (a Squire drop is written `E@…` and then moves under the knight letter).

## What a player would see

Both sides spend the reserve in almost every game (159 or 160 drops in 80 games — one side
skipped once on each Squire arm). The first drop lands on ply 1 or 2. It is not a piece they
save for the endgame at this depth.

The **step** Squire is the one that changes the session most: shortest games (about 92 plies),
fewest draws (5 of 80), and nearly half of the dropped Squires go on to take something. Ogre
shoves and archer shots are a little quieter than today’s game, not louder.

The **forward** Squire makes the longest games. It still captures often (68 of 159), and almost
never gets shoved off the square it arrived on.

The **block** Squire — the one that cannot take — looks closest to today’s game on decisive
share and length. It never captures (0 of 159), which is what the rule says. Shoves fall a
little; shots and chains stay in the same band as the control.

**Medium** choice is spent immediately too. The engines pick the maester most often, then the
ogre, then the knight, then the bishop. About two in five dropped pieces later capture. A
dropped piece is shoved off its arrival square more often here than under any Squire shape
(9 times across 8 games) — usually because an ogre itself was the drop. Fairy traffic otherwise
matches today’s game: shoves, shots, and chains stay in the same range.

None of these rules replace the rest of the board. You still see archer shots a few times a
game and a beast chain every other game or so, with or without a drop.

## What this does not say

Do not add either rule to the random game on these numbers. The earlier depth-2 pass already
said the same. If a deeper look is wanted, the step Squire and the medium choice are the two
that still look unlike “nothing,” and they need more games or depth before anyone talks about
fairness.
