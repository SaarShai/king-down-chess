# PHASE 1 protocol/report — setup and measurement package

Status: **ready_for_review**. No campaign game has been played. Human study pending.
This is a request for supervisor verification, not acceptance.

## 1. Plan and acceptance checklist

| # | acceptance item | status | evidence |
|---|---|---|---|
| 1 | ≥ 80 explicit representative legal current-game setups, stable IDs, full FENs | done | `campaign/setups/phase-1.json`: 96 (`P1-001`…`P1-096`); validator round-trips and legality checks all pass |
| 2 | Documented composition/permutation coverage | done | `coverage` block: 71 distinct White compositions; per-letter counts; 61 both-archer; 73 both-beast; 54 guard |
| 3 | Deterministic pair/colour mapping via existing `buildJobs` | done | `pairColorMapping` block; validator checks `pairId = i>>1`, `colourSwapped = i&1`, and `fen`/`fenSwapped` selection per game |
| 4 | Freeze adopted Archer/Beast/promotions/values | done | explicit `rules` in every spec; adopted arm equals today's defaults (checked); classic arm differs only in `archerShots` (checked) |
| 5 | Exact-classic-Archer arm, all else fixed | done | `phase-1-archer-classic.proposed.json`; validator confirms a single rule difference and identical setups/seed/search |
| 6 | Linear vs residual at equal budget + deeper linear check | done | `evalParams` per side, `pairs: true`; `phase-1-eval-linear-vs-residual.proposed.json`, `phase-1-eval-deep-linear.proposed.json` |
| 7 | Prove a real residual blob is available and used | done | see §3; no game played |
| 8 | Protocol with hypothesis, endpoints, SWE, clustered uncertainty, caps, budget, stopping rules | done | `campaign/protocols/phase-1.md` |
| 9 | Validate setups, `buildJobs` counts/mapping, spec parsing without playing | done | `campaign/verify-phase-1.ts`: **98/98 checks pass**, exit 0 |
| 10 | Timing/depth explicitly pending a reviewed M1 throughput pilot | done | specs labelled `PROPOSED`; depth 4 is a placeholder; gate T1 |
| 11 | No gameplay/default/weight/dependency change | done | only `campaign/**` files added/edited |

## 2. Artifacts

- `campaign/setups/phase-1.json` — 96 frozen setups (64 mirror, 32 asymmetric).
- `campaign/setups/phase-1-generate.ts` — deterministic generator (reproduces the setup file, the
  specs and the pinned arm; no search, no games).
- `campaign/specs/phase-1-archer-adopted.proposed.json`
- `campaign/specs/phase-1-archer-classic.proposed.json`
- `campaign/specs/phase-1-eval-linear-vs-residual.proposed.json`
- `campaign/specs/phase-1-eval-deep-linear.proposed.json`
- `campaign/specs/phase-1-beast-guard-focus.proposed.json`
- `campaign/specs/phase-1-throughput-d3.proposed.json`
- `campaign/specs/phase-1-throughput-d4.proposed.json`
- `campaign/specs/phase-1-residual-eval.json` — pinned residual arm (exact adopted blob bytes).
- `campaign/verify-phase-1.ts` — validator (no game, no search).
- `campaign/protocols/phase-1.md` — the protocol.

## 3. Exact verification evidence

Command:

```sh
node_modules/.bin/tsx campaign/verify-phase-1.ts
```

Result: **98 PASS, 0 FAIL, exit 0.** `sourceId = 3545663dcf97`.

Setups: 96 total; every FEN round-trips (`fromFen` → `toFen` equals the stored FEN); every setup has
exactly one king per side, no pawn on a back rank, no lab piece, status `playing`, and ≥ 1 legal
move; `fenSwapped` equals the independently computed colour-and-rank mirror and is legal. All nine
current piece kinds appear; the archer-bearing and beast-bearing subsets meet their minimums.

Specs (parsed with the real `loadSpec`, mapped with the real `buildJobs`):

| spec | games | configs | specKey |
|---|---|---|---|
| `phase-1-archer-adopted` | 400 | 61 | `8c6682d5fc96` |
| `phase-1-archer-classic` | 400 | 61 | `05dd50c82a84` |
| `phase-1-beast-guard-focus` | 200 | 73 | `6af3cb76e924` |
| `phase-1-eval-deep-linear` | 400 | 96 | `dbed57768db8` |
| `phase-1-eval-linear-vs-residual` | 400 | 96 | `668d8755489c` |
| `phase-1-throughput-d3` | 24 | 12 | `94be836143d7` |
| `phase-1-throughput-d4` | 24 | 12 | `03f1fb58cf0d` |

For every spec: `buildJobs(spec).length == spec.games`; one `configId` per listed setup; pair/colour
mapping correct; every job FEN is a frozen setup FEN; `usePairs` true; `adjudicate: false`.

Archer arms: exactly one rule differs (`archerShots`); adopted `plusDiagFwd2` versus classic
`classic`; identical setups, seed and search; adopted arm equals today's defaults; classic arm
freezes Beast, promotions and values.

Residual path:

- `netLoaded = true`, `netKind() = 'residual'`, blob base64 length 120408.
- `sha256(base64) = e17a27bfbadb029e419082ce8dae4b3c6df7ca6e4d983e02b975772f60c9b58c`, matching the
  accepted Q6 model sha in `docs/research/ai-q6-acceptance-2026-09-16.md`.
- Simulation default evaluator is `linear`; the pinned arm loads as `residual`.
- Residual applied on **94/96** setups: `mean |Δ| = 21.10 cp`, `max |Δ| = 50 cp`, `overClip = 0`.
- Ogre position falls back to linear (`Δ = 0`) — documented lab fallback, not residual evidence.
- Campaign pinned arm: `evaluator = "residual"`, `net.kind = "residual"`, `net.b64` byte-identical to
  the committed blob, sha matches the accepted Q6 model.

## 4. Limitations and unresolved gates

Not blockers for review of this package; all are supervisor decisions or prerequisites.

- **T1 (throughput/depth).** The confirmation depth and time are not chosen. The proposed specs use
  placeholder depth 4. The reviewed M1 throughput probes (`phase-1-throughput-d3/d4`) must be run
  first; the supervisor selects `d*`. No setting here is claimed validated.
- **S1 (search stall).** The known in-check quiescence stall must have a reproducer and a
  regression-backed fix before full-game batches. Owned outside this package.
- **E1 (clustered estimator).** The head-to-head setup-clustered cluster bootstrap for P1/P1b is not
  implemented in `src/sim/analyze.ts`; a small helper or external computation is required before
  reading those endpoints.
- **Archer re-pricing.** Both archer arms keep the shipped `ARCHER_V` (priced for `plusDiagFwd2`).
  The classic arm is therefore not re-priced; this can understate the classic arm and is stated.
- **`net.json` divergence.** `sim/nnue/net.json` re-quantises to a different blob than the committed
  one, so `gen.ts arms` would pin the wrong net. Do not regenerate the arm files from it.
- **`sim/nnue/eval-residual.json`** has no `net` field; the campaign pinned arm replaces it for
  phase-1 runs. The repository file was not edited.
- **Telemetry gaps.** No cluster bootstrap, no head-to-head per-side report, no per-evaluator cost
  aggregation, no Guard-block counter, no automated endgame-tail selection.
- **Human study** remains pending; no feedback is fabricated.

## 5. Recommended next action

1. Supervisor reviews this package and the protocol endpoints/SWE/budget.
2. Run the two throughput probes on M1 (24 games each) and select `d*` (gate T1).
3. Confirm the search-stall prerequisite (gate S1) and add the clustered estimator (gate E1).
4. Set `ai.depth = d*` in the proposed specs, re-run `campaign/verify-phase-1.ts`, then start the
   stage-1 pilots (400 per condition) under the contract.

## 6. Exact commands used to build the artifacts

```sh
node_modules/.bin/tsx campaign/setups/phase-1-generate.ts   # regenerate setups/specs/pinned arm
node_modules/.bin/tsx campaign/verify-phase-1.ts            # 98/98 checks
```

No game, no search and no training was run. Total campaign games played under this package: 0.
