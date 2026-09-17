# Simulation queue

Runs that are ready but **not launched**. Saar launches by name; nothing here starts on its own
(Saar, 2026-09-14). Each entry: why, the exact commands, machine time on 16 cores at depth 3, and
the rule that decides. Move an entry to `Ran` below, and to `RUNS.md`, when it has run.

## Ran (2026-09-14)

Q1–Q5 ran as one sequential chain on Saar's go, 16 workers, **41 600 games**, all depth 3.
Log `sim/out/queue-2026-09-14.log`, marker `sim/out/queue-2026-09-14.done`.
Report: **`docs/research/sim-queue-2026-09-14.md`**. Ledger: `docs/RUNS.md`, batch 4.

- **Q1 — guard double step from the home rank** (`ab-guard-dbl-slide`, `ab-guard-dbl-leap` vs `ab-warden-wall`): **rejected, keep the Wall.** `slide` clears nothing but branching; `leap` costs capped +0.017 ± 0.010 and +5.2 plies; both drag drawn games to 51.5% / 51.9% against the Wall's 40.5% — the same drag as the rejected Warden. `guardDoubleFirst` stays a lab toggle.
- **Q2 — `paladinKamikaze=nonPawn`** (`pb-ab-L-nonPawn` vs `pb-ab-base24`): **nothing measurable** (score −0.003 ± 0.018, decisive −0.008 ± 0.022, draws +0.009 ± 0.022, plies −0.3 ± 1.3). A free buff: value 2.21 → 2.87 pawns, no cost. **Saar's call, on taste.**
- **Q3 — `maesterSwapAny`** (`pb-ab-M-swapAny` vs `pb-ab-base24`): **balance and draws unchanged**; plies −4.3 ± 3.4, branching 33.1 → 39.1, kings never move in 25.4% of games against 16.6%. Free buff: value 2.18 → 3.12 pawns. **Saar's call, on taste.**
- **Q4 — `secondPlayerDoubleFirstTurn`** (`dt-full`, `dt-nopal`): **do not adopt.** Full pool White 0.533 → 0.472 (−0.062 ± 0.026) — it hands Black an edge the size of White's; no-paladin pool 0.526 → 0.490. `RUNS.md` R9 answered.
- **Q5 — `paladinKamikaze=never` half of the White-edge diagnostic** (`pb-lp-never` vs `pb-lp-base`): White 0.554 → **0.586**, decisive 0.846 → 0.907, plies 90.8 → 82.8. With the jump half already run, **the paladin's White edge is neither the jump nor the sacrifice — it is the piece's reach on an open board.** Limit: ±0.035 paired, ±0.045 on the paladin subset.

**Note for every future A/B:** `pb-ab-base` is **void** as a control (it mixes the two-guard and
one-guard pools — `RUNS.md`, "Void run"). Use `pb-ab-base24`.

## Q6 — AI: 10× training data from the shipped engine, then a material + residual net — **RUNNING**

Started 2026-09-14 after the chain's marker. Log `sim/out/q6-2026-09-14.log`; plan, commands and the
acceptance bar in `docs/research/ai-residual-plan-2026-09-14.md`. Three stages: generation
(~2.3 h, 80 000 games), sampling, then training and acceptance matches. Several hours; it runs alone.
Do not read its JSONL while it is being written. It gets its own report.

## Q7 — Paladin `nonPawn` at depth 4 (confirmation before it ships; SIM-PLAN §9)

**Ran 2026-09-14** (400 games an arm, both arms pinned with `--baseRule paladinKamikaze=always`): white score +0.035 ± 0.034 (edge of its interval; the depth-3 A/B on 1 600 games read −0.003 ± 0.018), decisive −0.025 ± 0.056, draws +0.020 ± 0.054, capped +0.005 ± 0.014 — nothing resolved at this size. Extended to 800 games an arm (`q7b-2026-09-14.log`): white score +0.027 ± 0.025, decisive −0.015 ± 0.036, draws +0.018 ± 0.034, capped −0.003 ± 0.005, plies +0.8 ± 3.7. Pooled with depth 3 (inverse-variance): white +0.007 ± 0.015. Verdict: no change in decisiveness, draws, stuck endings or length at either depth; a White gain of at most ~2 points cannot be excluded. Shipped in v0.7.0.

Q2 measured "no change" at depth 3 only. One paired A/B at depth 4, same 40 arrangements, fresh
control on today's pool. Run after Q6 has freed the cores.
```
npm run sim -- --id pb-ab-L-nonPawn-d4 --experiment ab --games 400 --sample 40 --depth 4 --seed 22 \
  --workers 16 --baseId pb-ab-base24-d4 --rule paladinKamikaze=nonPawn
```
~10–12 min (two arms at ~1.3 games/s). Decides: ship the rule if white score, decisive and capped
shares stay inside their intervals, as at depth 3; a sign flip on decisive share sends it back.

## Dropped

- Warden extension pass (`sim/specs/warden/*` at 3 000 games): Saar rejected the two-square guard
  on draw grounds (2026-09-14).
- `guardDoubleFirst` follow-ups: Q1 answered it. Nothing queued.
