#!/bin/zsh
# Collect the Q6 replacement's artifacts from the pinned sim worktree into this repo and write the
# acceptance report (docs/TAKEOVER-PLAN.md §3). The chain runs in ../king-down-sim so its source is
# immutable; this script waits for it and brings the evidence home.
#
# It never overwrites a tracked file: the worktree is read in place, then the small evidence is
# copied into the new (untracked) sim/q6-g2/ tree. The 725 MB corpus and positions.bin stay in the
# worktree, referenced by hash.
#
# The report is written **once, from the collected copies**, after a completeness check: an earlier
# version wrote it twice and a single unmatched glob (no *.report.json for a tune match) made one
# cp copy nothing, so the second pass read an empty gate and reported a false REJECT.
#
#   ./tools/q6-collect.sh        # safe to run any time; waits for the chain first

set -euo pipefail
setopt null_glob # a glob that matches nothing expands to nothing instead of erroring the copy
cd "$(dirname "$0")/.."
SRC=../king-down-sim

while pgrep -f "q6-chain.sh" >/dev/null; do sleep 60; done
echo "q6-collect: the chain has ended; collecting from $SRC"

mkdir -p sim/q6-g2/out sim/q6-g2/nnue
for f in "$SRC"/sim/out/nnue-g2.summary.json "$SRC"/sim/out/q6-nnue-g2.done \
         "$SRC"/sim/out/nnue-res2-*.summary.json "$SRC"/sim/out/nnue-res2-*.tuned.json \
         "$SRC"/sim/out/nnue-res2-*.report.json; do
  [[ -e "$f" ]] && cp -f "$f" sim/q6-g2/out/
done
for f in "$SRC"/sim/nnue/positions.json "$SRC"/sim/nnue/net.json "$SRC"/sim/nnue/train.json \
         "$SRC"/sim/nnue/bench.json "$SRC"/sim/nnue/eval-*.json "$SRC"/sim/nnue/weights-candidate.ts; do
  [[ -e "$f" ]] && cp -f "$f" sim/q6-g2/nnue/
done

# Every gate/decision/confirmation arm that exists in the worktree must be present in the copy.
missing=0
for f in "$SRC"/sim/out/nnue-res2-*.tuned.json; do
  b=$(basename "$f")
  if [[ ! -e "sim/q6-g2/out/$b" ]]; then
    echo "q6-collect: $b exists in the worktree but was not copied — refusing to write a report" >&2
    missing=1
  fi
done
[[ $missing -eq 0 ]] || exit 1

node tools/q6-report.mjs --base sim/q6-g2
echo "q6-collect: done. Raw records stay in $SRC/sim/out/ and $SRC/sim/nnue/"
