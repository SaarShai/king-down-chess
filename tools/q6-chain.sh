#!/bin/zsh
# Q6 replacement chain — the material + residual candidate, with the documented acceptance bar.
#
# Rules of this script (docs/TAKEOVER-PLAN.md §2/§3):
#   - `set -e` and no fallbacks: the first failed stage stops the chain.
#   - The success marker is written only after tools/q6-validate.mjs passes at the end; a marker
#     therefore proves the gates ran, and `writeSummary` runs inside the runner before any of this.
#   - The candidate is written to sim/nnue/weights-candidate.ts, never into src/.
#   - Run it from a Git worktree pinned to a committed revision (`git worktree add ../king-down-sim
#     <commit>`), so a live run never shares files with the working tree (LESSONS.md 2026-09-14).
#
# The ids carry a "2" so nothing can resume the unvalidated Q6 files (sim/out/UNVALIDATED-Q6.md).

set -euo pipefail
cd "$(dirname "$0")/.."

ID=nnue-g2
GATE=nnue-res2-gate
D3=nnue-res2-d3
D4=nnue-res2-d4
LOG=sim/out/q6-$ID.log

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "q6-chain: the tracked working tree is dirty; commit first or run in a pinned worktree" >&2
  exit 1
fi

run() {
  echo "== $(date '+%F %T') $*" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
}

# 1. Data: 80,000 games under the shipped rules. The resolved rules are stamped on every record, so
#    the explicit --rule flags are documentation, not the provenance.
run npm run sim -- --id "$ID" --games 80000 --depth 3 --sample 4000 --seed 914 --workers 16 \
  --rule archerMove=any --rule beastMove=any --rule guardCaptures=none --rule guardStep=1 \
  --rule guardCaptureLimit=0 --rule promotionSet=anyNonKingNoGuard

# 2. Sample under the recorded rules and train the residual candidate.
run npm run nnue -- sample --runs "$ID"
run npm run nnue -- train --loss res --lambda 0 --epochs 16 --batch 8192 --lr 0.015

# 3. Arms, then the acceptance bar: 400-game rejection gate first.
run npm run nnue -- arms
run npm run tune -- match --id "$GATE" --games 400 --depth 3 --seed 7103 --workers 16 \
  --tuned sim/nnue/eval-residual.json --base sim/nnue/eval-linear.json
run node tools/q6-validate.mjs gate "$GATE"

# 4. 1,600-game decision at depth 3, then the depth-4 confirmation.
run npm run tune -- match --id "$D3" --games 1600 --depth 3 --seed 7104 --workers 16 \
  --tuned sim/nnue/eval-residual.json --base sim/nnue/eval-linear.json
run npm run tune -- match --id "$D4" --games 200 --depth 4 --seed 7105 --workers 16 \
  --tuned sim/nnue/eval-residual.json --base sim/nnue/eval-linear.json
run npm run nnue -- bench --depth 5 --positions 12

# 5. Every gate at once, then — and only then — the done marker.
run node tools/q6-validate.mjs final "$GATE" "$D3" "$D4"
echo "== $(date '+%F %T') ACCEPTED" | tee -a "$LOG"
touch "sim/out/q6-$ID.done"
