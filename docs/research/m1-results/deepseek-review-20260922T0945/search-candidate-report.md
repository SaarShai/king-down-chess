# Quiescence search-stall prerequisite — diagnosis, minimal repair, evidence

Owner worktree: `codex/deepseek-search` at `/Users/za/.local/share/king-down-supervised-20260922/search`
Base commit: `aa1efa3` ("Validate paired game starts and sparse-sample reporting").
Scope: `src/ai/search.ts`, `src/ai/search-stall.test.ts`, `campaign/search-stall-report.md`,
`campaign/search-stall/measure.ts`. No evaluation values, rule defaults, weights or dependencies
changed. No simulation, no training, no old-game rerun.

## Plan and acceptance checklist

- [x] Read `TASKS.md` and `LESSONS.md`; start from `quiesce` and the existing search tests.
- [x] Prove an independently observable mechanism on a deterministic legal position.
- [x] Test the minimal quiet-node cutoff repair `qdepth <= 0`; keep all in-check evasions.
- [x] Remove temporary instrumentation from production before finalization.
- [x] Measure the same FEN at fixed depth 4, before and after, with `resetSearchState()`.
- [x] Add a focused public-`search` regression (legal move, mate, check evasion, node bound).
- [x] Run TypeScript and the focused search suite; inspect the final diff.
- [ ] Prove a baseline node-bound failure — **not achievable with the one deterministic FEN
      available**; exact reason below.
- [ ] Bound fixed-depth wall time globally — **not done and not claimed**; see safety limitation.

## Deterministic position

Historical missing game 884 of `pb-ab-O-push-d4-v318.base.jsonl`, rank `GSRBNQKO`, seed
`41174341`, O318, depth 4, after 103 plies. Fresh FEN, white to move:

```
g7/6k1/2q3pp/3o4/1p1p1P2/pQ1O2PP/6K1/2G5 w - - 0 1
```

The historical run is reported as 25+ minutes, while a fresh search of the same FEN is about
0.3 s / 25447 nodes. This report **does not reconstruct that historical stall**. It separates an
independently proven mechanism from unproven historical attribution.

## Proven mechanism (diagnostic baseline, instrumentation now removed)

Temporary instrumentation inside `quiesce` counted, for a fresh `resetSearchState()` plus
`search(pos, { maxDepth: 4 })`:

- `hits = 57`: check nodes reached with `qdepth <= 0`.
- `maxNeg = 55`: quiescence reached `qdepth = -55`.
- `maxPly = 71`: quiescence ran to its cap `MAX_PLY + QMAX = 64 + 8 = 72` (last index 71).
- `repeats = 73`: a same-position repeat appeared on the quiescence path.

Facts that follow directly from the source, not from the counters:

1. `quiesce` starts at `QMAX = 8`. In the quiet branch it cuts at an exhausted budget
   (`qdepth === 0` before the repair). The in-check branch has **no qdepth condition at all**.
2. A check node at `qdepth 0` therefore recurses to `qdepth -1`; consecutive in-check evasions
   drive `qdepth` arbitrarily negative (measured to `-55`) with no budget stop.
3. `quiesce` never calls `repeated()`; only `negamax` does. A repeating check sequence inside
   quiescence is stopped only by the `ply >= MAX_PLY + QMAX` cap, i.e. at ply 71.

So the prerequisite is real and deterministic: **quiescence accepts unbounded check extensions
(up to the ply cap) and has no repetition test.** This is independently proven. Whether this
prerequisite was the cause of the historical 25-minute, accumulated-state stall is **not proven**.

## Candidate repair tested: `qdepth === 0` → `qdepth <= 0`

Applied to the quiet branch only (`src/ai/search.ts:288`). The in-check branch and every evasion
are untouched; no stand-pat is used while in check. Final diff is one line.

Measurement on the deterministic FEN, fixed depth 4, `resetSearchState()`, no clock
(`hardDeadline = Infinity`), public API `search`:

| Version | Move | Score | Nodes | Time |
|---|---|---|---|---|
| baseline (`qdepth === 0`) | `Kg2-f2` | -287 | 25447 | ~180 ms |
| repaired (`qdepth <= 0`) | `Kg2-f2` | -287 | 25447 | ~180 ms |

Depth 3: `Qb3-c2`, score -281, 3491 nodes both before and after. The repair changes **no** node,
score or move on the only deterministic legal FEN available here. Internal counters were also
unchanged (`hits = 57`, `maxNeg = 55`), because the negative-qdepth subtree on this position is a
chain of **in-check** nodes, where the quiet cutoff does not apply.

### Why the repair alone is insufficient

The repair only helps when a quiet node is reached with `qdepth <= 0`. It cannot bound an
in-check chain, because that branch ignores `qdepth` by design ("no stand-pat while in check").
On this FEN the negative-qdepth subtree is entirely in-check evasions, so the repair is correct
but produces no measurable improvement and does not explain the historical runtime. Bounding the
chain would need a separate cap on check extensions or repetition detection inside `quiesce`;
that is a larger behavior change and is deliberately **not** included here.

## Regression test

`src/ai/search-stall.test.ts` (4 tests, public `search` only, no test hooks):

- fixed depth 4 on the FEN finishes, returns a legal move, reaches depth 4, and stays under
  **40000 nodes** (fresh baseline 25447; a reintroduced runaway check extension would blow past
  it by orders of magnitude);
- the same search repeats exactly after `resetSearchState()`;
- a root-check position (`4k3/8/8/8/8/8/4r3/4K3 w - - 0 1`) returns a legal evasion;
- mate in one (`7k/8/6K1/8/8/8/8/1Q6 w - - 0 1`) is still found and is checkmate.

**Baseline caveat, stated plainly:** the test also passes against the original
`qdepth === 0` source (verified by stashing the one-line fix and rerunning). It is a **guard**
against a future node explosion, not a proof that the repair fixed a baseline failure. No
deterministic legal FEN in this worktree was found where the one-line repair changes the node
count, so a "baseline fails the bound" regression cannot honestly be written without a new
position search, which this stage was told not to run.

## Verification commands and results

```
npx tsc --noEmit                              → exit 0
npx vitest run src/ai/search-stall.test.ts    → 4 passed (657 ms)
npx vitest run src/ai/search.test.ts          → 16 passed (81.69 s)
npx tsx campaign/search-stall/measure.ts 4    → {move:"Kg2-f2", legal:true, score:-287, nodes:25447}
```

`measure.ts` uses only `resetSearchState`, `search`, `toLan`, `fromFen`, `legalMoves`.

## Remaining uncertainty

- The 25-minute, accumulated-state failure of historical game 884 is **not reproduced**. A warm
  transposition table made the position faster, not slower (depth 4 fell to 187–427 nodes after
  depth-5/6 warm-up), so accumulated TT alone does not explain it.
- The exact branch that made the historical runtime pathological is unknown. Possible but
  untested causes: a check-extension chain wider than this FEN's, or state-dependent move
  ordering. Neither is claimed.
- No broader fix (check-extension cap, quiescence repetition test) was evaluated for strength or
  correctness beyond this diagnosis.

## Safety limitation and campaign gate

Fixed-depth searches remain **unbounded in wall time**. `search(pos, { maxDepth })` sets
`hardDeadline = Infinity`, and the only quiescence bound is the `MAX_PLY + QMAX` ply cap. On this
FEN that cap is reached (ply 71), so a richer check chain can still cost far more nodes than the
fresh baseline. The one-line repair does **not** make infinite-time search globally bounded.

Therefore the campaign safety gate **cannot be satisfied by this change alone**. Any later
campaign spec that uses fixed depth needs a reviewed practical budget (a wall-clock guard or a
node cap) independent of this repair. This report is a diagnosis and evidence record, not an
acceptance of a global bound.

## Files

- `src/ai/search.ts` — one-line quiet-cutoff repair (`qdepth <= 0`).
- `src/ai/search-stall.test.ts` — focused public-search regression guard.
- `campaign/search-stall/measure.ts` — clean, self-contained reproducer/measurement.
- `campaign/search-stall-report.md` — this report.
