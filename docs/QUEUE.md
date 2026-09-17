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
- **Q4 — `secondPlayerDoubleFirstTurn`** (`dt-full`, `dt-nopal`): **do not adopt.** Full pool White 0.533 → 0.472 (−0.062 ± 0.026) — it hands Black an edge the size of White's; no-paladin pool 0.526 → 0.490. `RUNS.md` R9 answered. **Retired and qualified (2026-09-16):** the search assumed alternating movers (side derived from ply parity, unconditional score negation, turn-bit hashing, alternating repetition walks), so the numbers are directional only. That does not reopen the rejection; the commands are out of the active queue. A later extra-turn feature (Haste) must fix mover tracking, the score sign, hashing, repetition and exact state serialization first.
- **Q5 — `paladinKamikaze=never` half of the White-edge diagnostic** (`pb-lp-never` vs `pb-lp-base`): White 0.554 → **0.586**, decisive 0.846 → 0.907, plies 90.8 → 82.8. With the jump half already run, **the paladin's White edge is neither the jump nor the sacrifice — it is the piece's reach on an open board.** Limit: ±0.035 paired, ±0.045 on the paladin subset.

**Note for every future A/B:** `pb-ab-base` is **void** as a control (it mixes the two-guard and
one-guard pools — `RUNS.md`, "Void run"). `pb-ab-base24` is clean for the old-paladin comparison it
recorded, **not a timeless current baseline**: after the 2026-09-14 paladin change it names the wrong
rule set, so a new comparison needs a fresh control (a new id, one-guard pool, current rules).

## Q6 — AI: 10× training data from the shipped engine, then a material + residual net — **UNVALIDATED, replacement planned**

Started 2026-09-14. The inherited chain **completed** (marker `q6-2026-09-14.done`, 09:03) after the
takeover review was written, but it is **not accepted**: generation exited 1 on a summary-write bug,
the 80 000 records carry no rule/source stamp, sampling reset to the defaults of the day, and the
400-game rejection gate was skipped. The outputs are preserved as historical evidence and labelled in
`sim/out/UNVALIDATED-Q6.md`; do not train on them, resume them or publish a model from them.

The replacement chain is `tools/q6-chain.sh` (run it in a pinned worktree). It generates `nnue-g2`
with a full stamp on every record, samples under the recorded rules, trains the residual candidate to
`sim/nnue/weights-candidate.ts`, then applies the documented bar stage by stage — gate, decision,
confirmation, speed — through `tools/q6-validate.mjs`, which alone writes the success marker.
Plan and bar: `docs/research/ai-residual-plan-2026-09-14.md`. It gets its own report.

## Q7 — Paladin `nonPawn` at depth 4 (confirmation before it ships; SIM-PLAN §9)

**Ran 2026-09-14, superseded — do not run again.** 400 games an arm, both arms pinned with
`--baseRule paladinKamikaze=always`: white score +0.035 ± 0.034 (edge of its interval; the depth-3
A/B on 1 600 games read −0.003 ± 0.018), decisive −0.025 ± 0.056, draws +0.020 ± 0.054, capped
+0.005 ± 0.014 — nothing resolved at this size. Extended to 800 games an arm (`q7b-2026-09-14.log`):
white score +0.027 ± 0.025, decisive −0.015 ± 0.036, draws +0.018 ± 0.034, capped −0.003 ± 0.005,
plies +0.8 ± 3.7. Pooled with depth 3 (inverse-variance): white +0.007 ± 0.015. Verdict: no change in
decisiveness, draws, stuck endings or length at either depth; a White gain of at most ~2 points cannot
be excluded. **Shipped in v0.7.0.** The earlier "run another 400-game confirmation after Q6" note is
deleted: the extension already answered it with the recorded old-paladin control.

## Dropped

- Warden extension pass (`sim/specs/warden/*` at 3 000 games): Saar rejected the two-square guard
  on draw grounds (2026-09-14).
- `guardDoubleFirst` follow-ups: Q1 answered it. Nothing queued.
