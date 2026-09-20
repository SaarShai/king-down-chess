# Fairy-piece balance sweep — 2026-09-17

New focus (Saar, 2026-09-17): fairy pieces only — movement, taking, combinations, arrangements.
This is the first sweep under **today's rules** with **fresh controls** (`ab`'s base arm is the
current rule set; `pb-ab-base24` is void as a baseline). Every variant shares seed 71, so the arms
see the same 40 arrangements and the same opening seeds. 1,600 games per arm at depth 3; a
consequential depth-3 result gets a depth-4 arm (seed 72). Adopt only on a depth-4 confirmation.

Log `sim/out/pb-2026-09-17.log`; per-run paired tables in `sim/out/pb-ab-*.experiment.md`.

## Depth-3 sweep (six levers)

| id | lever | white score | decisive | draws | capped | plies | verdict |
|---|---|---|---|---|---|---|---|
| pb-ab-A-shots | `archerShots=plusDiag2` | +0.006 ± 0.020 | **+0.077 ± 0.029** | **−0.069 ± 0.028** | −0.008 ± 0.006 | −7.5 ± 3.5 | **candidate** |
| pb-ab-S-cap | `beastCapture=diagForward` | +0.014 ± 0.023 | −0.002 ± 0.022 | +0.005 ± 0.022 | −0.003 ± 0.006 | −1.4 ± 2.6 | null — keep 7-neighbour |
| pb-ab-M-step | `maesterStep=2` | +0.006 ± 0.019 | +0.021 ± 0.027 | −0.018 ± 0.025 | −0.003 ± 0.005 | −2.8 ± 2.9 | null — free buff on taste |
| pb-ab-L-block | `paladinJumpsFriends=false` | −0.018 ± 0.020 | **−0.039 ± 0.026** | **+0.038 ± 0.025** | +0.001 ± 0.004 | +1.4 ± 2.5 | **rejected** |
| pb-ab-A-move | `archerMove=fwdBack` | −0.002 ± 0.016 | **−0.040 ± 0.028** | **+0.028 ± 0.026** | +0.012 ± 0.011 | +5.7 ± 4.1 | **rejected** (interest min-use −0.026 ± 0.010) |
| pb-ab-S-move | `beastMove=forward` | +0.014 ± 0.019 | +0.022 ± 0.025 | −0.022 ± 0.025 | +0.000 ± 0.006 | +0.9 ± 3.5 | **rejected** (interest min-use −0.060 ± 0.012) |

Readings:

- **The archer's shot set is its live lever; its step set is settled.** Widening the shots
  (`plusDiag2` adds the four two-square diagonals) sharpens games; restricting the steps to
  `fwdBack` blunts them and costs interest. The beast and maester levers changed nothing at
  depth 3; blocking the paladin on friends — the Q5 "reach on an open board" knob — makes games
  **less** decisive and drawish, so the paladin's reach is load-bearing.

## Depth-4 confirmation: `archerShots=plusDiag2`

| arm | games/arm | white score | decisive | draws | capped | plies |
|---|---|---|---|---|---|---|
| 400 | 400 | +0.061 ± 0.046 | +0.063 ± 0.056 | −0.050 ± 0.057 | −0.013 ± 0.022 | −10.2 ± 7.2 |
| 1,600 | 1,600 | +0.026 ± 0.026 | **+0.088 ± 0.038** | **−0.082 ± 0.037** | −0.006 ± 0.009 | **−14.2 ± 4.8** |

**Confirmed at 1,600 games an arm:** decisive +8.8 ± 3.8 points, draws −8.2 ± 3.7, mean plies
−14.2 ± 4.8, white score +2.6 ± 2.6 (includes zero — the +6.1 White flag in the 400-game arm was
noise). Interest and its residualised terms are flat; the extra decisiveness is not "excess"
(excessDecisiveness resid. −0.069 ± 0.011). Capped games do not move.

**Recommendation: adopt `archerShots: 'classic'` → `'plusDiag2'`, and re-price the archer.** The
rule change is one default in `src/rules/rules.ts`; the value pass under the new rule is running
(`pb-A-plusDiag2-value`, odds match vs a knight with `--eloPerPawn 64`). Until it lands, the AI
prices the archer at the old value and would trade it too cheaply.

## The archer widening costs power: value passes (odds match vs a knight, same method)

| rule | Elo vs knight | Δ pawns | implied value | engine seed | next seed |
|---|---|---|---|---|---|
| `classic` (today) | +36 ± 27 | +0.57 ± 0.42 | **3.73 ± 0.42** | 3.37 | 373 |
| `plusDiag2` | +107 ± 28 | +1.67 ± 0.44 | **> 4.66** (out of band) | 3.37 | 483 |
| `plusDiagFwd2` (forward-only) | +113 ± 29 | +1.76 ± 0.46 | **> 4.66** (out of band) | 3.37 | 492 |

`plusDiagFwd2` A/B (depth 3, seed 71): decisive **+8.2 ± 2.7**, draws −7.3 ± 2.6, capped −0.9 ± 0.6,
plies −7.8 ± 3.5, white −0.2 ± 1.9, interest flat — the same sharpening as `plusDiag2` and `ring2`
(+7.7 each) with a cleaner reading (forward-facing, mirrored for Black).

**The sharpening and the power are the same lever.** Every widening tried cuts draws by 7–8 points
and raises the archer from ~3.7 to **> 4.7 pawns** — above a rook, second only to the queen. The
pool has two archers a side, so fairness holds (white score unchanged); what changes is the piece
hierarchy and the AI's pricing (`ARCHER_V` must move 337 → ~490, and the value is out of the ±1.5
pawn band, so the next pass needs a larger swap to bracket it).

**Decision for the owner:** (a) adopt `plusDiagFwd2` + re-price — sharper games, archers become
premium pieces; (b) keep `classic` — the archer stays a ~3.7-pawn piece and games stay drawish;
(c) test a decoupled variant (e.g. shots blocked by the first piece on the ray, with a wider set),
which would need a new rule and its own sweep.

## Follow-ups queued

- `archerShots=ring2` A/B (running) — is an even wider shot set better, or does plusDiag2 sit at a peak?
- Archer value under `plusDiag2` (running).
- Untouched design space: the capital rules C1–C5 (`docs/MATRIX.md` §B.2, all `?`), guard
  arrangement (mined: a guard 4+ files from its king is +9.7 decisive points), maester `step 2`
  as a free buff on the owner's taste.
