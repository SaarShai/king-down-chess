# Piece values — the over-a-piece Archer (`archerShots: 'over2'`), 2026-10-05

Four passes of Muller's method against the Knight (`src/sim/run.ts --experiment values --pieces A`),
depth 3, 1,000 games a pass, seed 1036, 12 workers, one pawn = 77 Elo carried over from `pv-d3`
(the shipped prices). Each pass plays at the price the one before it measured. Passes 1 and 2 ran
at f380602 with `--rule archerShots=over2`; passes 3 and 4 at e5cf07a, where it is the default, with
Muller's second step (`--odds`, added in 292b5cb): the Knight army plays a pawn down, because pass 2
left the ±1.5-pawn band below the Knight.

| pass | price (cp) | arm | Elo vs knight | implied worth (pawns) |
|---|---|---|---|---|
| 1 | 505 (shipped) | knight swap | −94 ± 19 | 1.94 ± 0.24 |
| 2 | 194 | knight swap | −137 ± 18 | < 1.66 (out of band; linear 1.38) |
| 3 | 138 | knight swap, knight army a pawn down | −102 ± 20 | 0.84 ± 0.26 |
| 4 | 84 | knight swap, knight army a pawn down | −102 ± 19 | 0.83 ± 0.25 |

Pass 4 moves the value by 0.01 pawns, inside its error bar: the fixed point. `ARCHER_V` = 83.
The calibration adds about ±0.2 pawns (77 ± 11 Elo a pawn). Commands:

```
npx tsx src/sim/run.ts --experiment values --id pv-A-over2-n1 --pieces A --eloPerPawn 77 --games 1000 --depth 3 --seed 1036 --workers 12 --rule archerShots=over2
npx tsx src/sim/run.ts --experiment values --id pv-A-over2-n2 --pieces A --eloPerPawn 77 --values A=194 --games 1000 --depth 3 --seed 1036 --workers 12 --rule archerShots=over2
npx tsx src/sim/run.ts --experiment values --id pv-A-over2-n3 --pieces A --odds --eloPerPawn 77 --values A=138 --games 1000 --depth 3 --seed 1036 --workers 12
npx tsx src/sim/run.ts --experiment values --id pv-A-over2-n4 --pieces A --odds --eloPerPawn 77 --values A=84 --games 1000 --depth 3 --seed 1036 --workers 12
```

The four reports follow as the tool wrote them.

---

---

## Piece values — pv-A-over2-n1

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: `{"archerShots":"over2"}`.
Engine values: the shipped constants.

### Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [149, 84, 190, 35, 42] | 0.369 | -94 ± 19 | -106 | 0.0% | -3.26 | H0 | 13.7% | 0.4% | 90 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


### Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -94 ± 19 | -1.22 ± 0.24 | 1.94 ± 0.24 | 5.05 | 3.50 | 194 |

Implied value = n (3.16) + Elo / 77.


### Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 194;
```

---

## Piece values — pv-A-over2-n2

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: `{"archerShots":"over2"}`.
Engine values: `A=194` (the rest keep `src/ai/eval.ts`).

### Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [188, 82, 178, 22, 30] | 0.312 | -137 ± 18 | -157 | 0.0% | -4.35 | H0 | 10.8% | 0.4% | 91 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


### Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -137 ± 18 | -1.78 ± 0.23 ** | < 1.66 ** | 1.94 | 3.50 | 138 |

Implied value = n (3.16) + Elo / 77.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


### Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 138;
```

---

## Piece values — pv-A-over2-n3

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. **Muller's second step:** the knight army also plays a pawn down
(one file per config, all eight), so each arm measures the fairy piece plus a pawn. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: `A=138` (the rest keep `src/ai/eval.ts`).

### Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [179, 61, 178, 30, 52] | 0.357 | -102 ± 20 | -107 | 0.0% | -3.29 | H0 | 9.9% | 0.0% | 89 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


### Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -102 ± 20 | -1.32 ± 0.26 | 0.84 ± 0.26 | 1.38 | 3.50 | 84 |

Implied value = n (3.16) − 1 (the pawn of odds) + Elo / 77.


### Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 84;
```

---

## Piece values — pv-A-over2-n4

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. **Muller's second step:** the knight army also plays a pawn down
(one file per config, all eight), so each arm measures the fairy piece plus a pawn. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: `A=84` (the rest keep `src/ai/eval.ts`).

### Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [177, 56, 190, 30, 47] | 0.357 | -102 ± 19 | -110 | 0.0% | -3.36 | H0 | 9.5% | 0.1% | 86 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


### Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -102 ± 19 | -1.33 ± 0.25 | 0.83 ± 0.25 | 0.84 | 3.50 | 83 |

Implied value = n (3.16) − 1 (the pawn of odds) + Elo / 77.


### Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 83;
```
