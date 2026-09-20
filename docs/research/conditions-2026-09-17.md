# Condition-aware piece evaluation — 2026-09-17

Owner direction: a piece's score/value is one axis, not the verdict. A cheap piece can break a
condition; a dear piece can be paralysed by one; combinations can be stronger than their parts; the
starting square matters. This report collects the first pass of that framework: what was measured,
what was screened, and what the next paired experiments must settle.

## Instruments

| tool | what it answers |
|---|---|
| `tools/conditions.ts` | per run and piece: moves per game, **paralysis** (share of owner-armies where the piece never moves), survival, captures; and a paired comparison of two runs |
| `tools/placement.ts` | screens: outcome and activity split by the starting file of every piece, and by starting adjacent to its own king |
| four-arm factorial (`sim/specs/newpieces/cx-*`) | combination power: neither / A only / B only / both, fixed composition, identical ranks, paired openings; interaction = (AB − A − B + base) |
| `tools/interactions.ts` | what happens in games at scale (frequency and decisive association per interaction) |

## 1. Paralysis and activity (depth 3, 2,000 games a run)

| piece | moves per army-game | never moves | survives | captures |
|---|---|---|---|---|
| Templar (T) | 3.95 | **7.7%** | 33.1% | 0.26 |
| Guard (G) | ~0.8 | 5.9–6.3% | 22.8% | 0 |
| Rook (R) | 2.0–2.2 | 3.1–3.8% | 13–15% | 0.35 |
| Reaver (V) | 2.78 | 3.9% | 20.5% | **0.85** |
| Ogre (O) | 4.34 | 1.8% | 32.9% | 0.27 |
| Archer / Paladin / Maester / Beast / Queen / Knight | 0.7–4.1 | <1.5% | 1–20% | 0.2–0.9 |

The Templar is the piece the framework is for: **busiest after the Ogre and least effective**
(0.26 captures), parked two thirds of the time (33% survive to the end, 7.7% never move), because its
queen mode never triggers. Activity without effect is a distinct failure mode from inactivity.

## 2. Condition experiment: the Ogre against guard-heavy armies (refuted)

The Ogre's whole design is moving walls. Three guards an army (`gh2-N`/`gh2-O`, 1,000 paired games,
identical ranks, 40 arrangements):

| arm | decisive | draws | plies | guard shoves per game |
|---|---|---|---|---|
| guard-heavy, knights | 61.3% | 38.7% | 127 | 0 |
| guard-heavy, Ogre replacing one knight | 55.5% | 44.5% | 130 | **0.22** (10× the normal rate) |

The Ogre shoves guards ten times as often and the game gets **worse**, not better: decisive
−5.8 ± 4.3 points. "A weak piece that breaks the balance in its designed condition" is refuted for
the Ogre — moving a wall is not the same as removing it, and the extra guards drag draws regardless.

## 3. Starting locations: screens vs paired tests

`tools/placement.ts` screens sampled ranks; each cell is confounded with the army's neighbours, so
the screens were followed by **paired placement swaps**: identical composition, one piece moved,
shared opening seeds (525–800 paired games per test, 40-rank corpus).

| question | screen (confounded) | paired test | verdict |
|---|---|---|---|
| Maester next to its king vs ≥3 files away | decisive 77.5% vs 69.5% | decisive **−1.3 ± 5.4**, plies −0.7 ± 5.0, balance −1.6 ± 5.0; maester moves 13.3 → 13.0 | **no starting-square effect** |
| Bishop next to its king vs ≥3 files away | decisive 64.0% vs 75.8% | decisive **+0.5 ± 4.8**, plies −3.1 ± 5.4, balance −4.3 ± 4.9 | **no effect** (the screen was army confounding) |
| Ogre on the a-file vs its sampled file | decisive 76.8% vs 61.2% | decisive **+1.4 ± 4.3**, plies −0.8 ± 4.7, balance +1.1 ± 3.5; ogre moves 16.7 → 14.9 | **no effect** |

The screens were noise from rank sampling. One caution: the batch-3 "maester beside the king +15
Elo" result measured a different thing (a composition-level comparison across pools), so this null
does not overturn it; it says **the starting square itself** does not move these results.

Other screen reads worth keeping as hypotheses only: beast on the a-file was far busier (12.0 moves,
1.67 captures) but that is likely the same confounding; no outcome effect was established.

## 4. Combinations: nothing game-breaking found

**Ogre + Beast** (4-arm factorial, 1,000 games an arm; fixed template `Q?RBB?NK`, slots at files b and g):

| arm | decisive | draws | plies |
|---|---|---|---|
| neither | 85.8% | 14.2% | 90 |
| Ogre | 76.6% | 23.4% | 96 |
| Beast | 80.5% | 19.5% | 97 |
| both | 75.0% | 25.0% | 101 |

Interaction on decisive share: **+3.7 ± 4.9 points** — the interval covers zero. The mechanism also
does not appear: the Beast captures 1.51 a game alone and **1.48** with an Ogre beside it, and the
Ogre's shove count is unchanged. The hypothesised "shove them into the bite" does not happen.

**Two Reavers** (2V vs 2N, 1,000 paired games): decisive **+4.5 ± 2.9 points**, draws 14.2% → 9.7%,
plies −12.2 ± 3.4, balance neutral. Two escape knights compound the sharpening, but this two-arm
design cannot separate compounding from an interaction; a four-arm (NN / VN / NV / VV) run would.

## 5. Game-breaking, as a measurement

`tools/jev-conditions.ts` asked Jev to flag game-breaking conditions, combinations, locations and
suspects, with two measured controls: the Reaver's full step (overpowered) and its orthogonal reading
(fine). **The controls failed twice** (0.39, then 0.35 against a 0.6 bar) — the model will not call a
measured-overpowered piece game-breaking from evidence text. The instrument was discarded, and
game-breaking is now defined in code (LESSONS.md 2026-09-17):

1. **value non-convergence** — the odds match still favours the owner at the raised price;
2. **matched-price dominance** — the owner scores more than +100 Elo with both sides priced at the
   measured value;
3. **combination interaction** — (AB − A − B + base) beyond its interval;
4. **condition collapse** — a condition that should help makes the game worse.

Worked example: the Reaver's full step fails test 1 (does not converge, +188 ± 32 Elo at a 5.04-pawn
price); the orthogonal reading passes (converges at 4.04 ± 0.56, neutral balance). The Ogre against
guards fails test 4 in the opposite direction (it is refuted, not breaking).

## Practice from here

Every piece or rule candidate reports **value + paralysis + condition + combination + location**
before adoption, and the game-breaking screen runs on the measured numbers, not on prose. Jev stays
where it has passed controls: verifying claims against numbers, and triaging which *experiments* to
run — not judging power.
