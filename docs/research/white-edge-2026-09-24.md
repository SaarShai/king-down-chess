# White’s first-move edge (2026-09-24)

> Recovery status, 2026-09-24: Historical studies use different pools, source versions and comparisons. Their scores cannot establish a precise first-move advantage for the adopted engine. Catalog and qualifications (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) · Adoption record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`).

Question: in the shipped game, how big is White’s first-move advantage, and is it large enough to worry?

Score is White’s point of view: 1 = White win, 0.5 = draw, 0 = Black win. A few points of White edge on a tiny sample is noise. An edge that stays above its interval in a large run is real.

This note reads existing summaries and reports only. No new simulation. It does not recommend a rule or a pool change.

## Scores that matter

### Today’s pool (small)

| Source | Pool | Games | Depth | White score |
|---|---|---:|---:|---:|
| `sim/out/shipped-traffic-2026-09-24.summary.json` | `QORRBBNNAAGMMSS` (today’s: Ogre in, Paladin out) | **24** | 2 | **0.5625** (13 W / 1 D / 10 B) |

Call this what it is: a traffic sketch. Twenty-four games at depth 2. A score of 56% here is compatible with anything from “roughly even” to “a mild White lean.” Do not treat it as a balance measurement.

### Older paladin pool (large, still near the shipped rules)

| Source | Pool | Games | Depth | White score |
|---|---|---:|---:|---:|
| `sim/out/kit-pool-shipped.summary.json` | `QLRRBBNNAAGMMSS` (Paladin letter `L`; older random pool) | **2,000** | 3 | **0.5525** (915 W / 380 D / 705 B) |

Same number is reported in `docs/research/sim-kit-pool-2026-09-17.md`. That report’s paired fairness check against a kit-richer pool moved White by only −0.43 points (paired 95% interval about −3.2 to +2.3). The absolute score itself is the better first-move reading: White about **55%** on two thousand games.

### Direct-campaign White scores with intervals (near-current rules)

From `docs/research/direct-campaign-phase-2-2026-09-22.md`: equal armies, frozen residual search, 50 ms per move, 2,000 games per arm, intervals resample whole setups.

| Designated piece (both sides) | White score | 95% interval | Games |
|---|---:|---:|---:|
| Paladin | **54.03%** | **51.29–56.84%** | 2,000 |
| Knight | **50.27%** | **47.77–52.69%** | 2,000 |
| Maester | **48.23%** | **45.59–50.85%** | 2,000 |

The Paladin arm’s interval sits entirely above 50%. That is a real first-move lean under those settings, still in the mid-50s — not a blowout. Knight and Maester arms sit near even; their intervals include or hug 50%.

Phase 1’s equal-budget residual scores (~0.60) measure one evaluator against another, not White’s colour advantage. Phase 1’s Archer White-score *deltas* crossed zero (−0.94 to +5.44 linear; −5.77 to +4.20 residual). Those are not absolute White-edge numbers.

### Other large context (older pool / Ogre pricing)

- Composition mining on 56,000 arrangement games under `QLRRBBNNAAGMMSS`: White score **0.5272** (`docs/research/sim-composition-mining-2026-09-17.md`). Huge sample; mild White lean.
- Ogre push priced at 318, depth 4, 1,600 games per arm: White about **0.522 → 0.526**, paired shift **+0.004 ± 0.024** (`docs/research/sim-ogre-combos-2026-09-17.md`). Fair under the push setting the game now ships.
- Earlier queue work on the full paladin pool: White about **0.533**; classical chess accepts about **54–55%** at master level (`docs/research/sim-queue-2026-09-14.md`). A measured Black double-first-turn over-corrected (0.533 → 0.472) and was rejected.

## How big is the edge?

On large runs under the older paladin pool and near-current search, White sits roughly in the **52–55%** band. That is a few points of first-move advantage — the same neighbourhood chess already lives with. The 24-game sketch at 56% does not raise that ceiling; it is too small to move the needle.

Nothing in the files above shows a lopsided White monopoly (for example a large run whose interval stays well above ~60%). Paladin-heavy equal armies can push the mid-50s with the interval still above half; that is worth knowing, not a crisis, and the Paladin is already out of today’s random pool.

## Should anything change?

**No.** The trusted large samples show a modest, chess-like White lean. The only number for today’s exact pool is a 24-game sketch. Until a large run on the live pool shows a clear, lopsided edge above its interval, leave the first-move order alone.

**One-sentence conclusion:** Trust White ≈ 0.55 on 2,000 older-pool games and ≈ 0.54 [0.51–0.57] on the 2,000-game Paladin campaign arm; the 24-game 0.56 sketch is noise — the edge is real but mild, and nothing should change.
