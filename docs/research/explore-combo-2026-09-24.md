# Arrangement exploration — catapult with the pieces it can actually use (2026-09-24)

> Recovery status, 2026-09-24: Exploratory historical games: depth 2, Catapult value 156, five ply caps. Retained rows are optional examples, not a ranking; the adopted engine has later fixes. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Exploration only. The playable pool and the default rules were not changed. Ninety-six games,
depth 2, sixteen games on each of six mirrored back ranks, the same opening seeds on every rank.
The catapult was priced at 156, the upper bound from the earlier stay reading, not the shipped 400.
Spec: `sim/specs/explore-combo-2026-09-24.json`. Record: `sim/out/explore-combo-2026-09-24.jsonl`.

Depth 2 and sixteen games cannot rank fairness. White’s score on the rank with no catapult is
0.75; that is a small sample, not a finding. The counts below are what the pieces did.

| back rank | company | games that lobbed | lobs / game | first lob | shots | shoves | other | decisive | plies |
|---|---|---|---|---|---|---|---|---|---|
| `COAQNRBK` | ogre, archer, catapult | **11 / 16** | 1.38 | ply 50 | 3.88 | 3.19 | — | 0.94 | 126 |
| `CSAQNRBK` | beast, archer, catapult | **11 / 16** | 1.38 | ply 57 | 3.63 | — | 1.06 chains | 0.69 | 107 |
| `CQNRBKNM` | catapult, maester, no other fairy | **12 / 16** | 1.31 | ply 46 | — | — | 4.69 swaps | 0.69 | 138 |
| `COGQNRBK` | ogre, guard, catapult | 10 / 16 | 1.31 | ply 72 | — | 3.25 | guard shoved 0.06 | 0.56 | 122 |
| `CGAQNRBK` | guard, archer, catapult | **6 / 16** | 1.00 | ply 38 | 3.38 | — | — | 0.69 | 110 |
| `OAQNRBKG` | ogre, archer, guard, no catapult | 0 | 0 | — | 4.31 | 2.19 | — | 0.75 | 88 |

## What made a session

The row that used the most of the board was **ogre + archer + catapult**. The cannon fired in 11 of
16 games, the archer shot about four times a game, and the ogre shoved about three times. That is
the only row that did all three. It was also the row that most often reached a result (15 of 16).

**Beast + archer + catapult** fired just as often and added a chain about once a game. It is the
other row worth sitting down at.

The **guard did not help the catapult**. With a guard and an archer, the cannon fired in 6 of 16
games, the quietest catapult row. With an ogre and a guard and no archer, the ogre shoved the guard
once in the whole set (0.06 a game), and the first lob came late (ply 72). An immortal screen is
not, in these games, the setup the cannon was waiting for.

A catapult with only a maester for company fired often and swapped often, and the games were the
longest. Busy, and slow.

The row with no catapult was the shortest. The archer and the ogre already give a session its
events. The catapult adds a lob on top of those two; it does not replace them.

## What this does not say

This does not put the catapult in the random pool. The earlier study still stands: under a random
catapult rank it stays silent in about 38% of games, and it is well below a knight. Sixteen games
at depth 2 cannot overturn that. They only say which neighbours make the lob show up when you
choose the row yourself.
