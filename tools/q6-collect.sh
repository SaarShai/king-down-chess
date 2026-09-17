#!/bin/zsh
# Collect the Q6 replacement's artifacts from the pinned sim worktree into this repo and write the
# acceptance report (docs/TAKEOVER-PLAN.md §3). The chain runs in ../king-down-sim so its source is
# immutable; this script waits for it and brings the evidence home.
#
# It never overwrites a tracked file: the worktree is read in place, then the small evidence is
# copied into the new (untracked) sim/q6-g2/ tree. The 725 MB corpus and positions.bin stay in the
# worktree, referenced by hash.
#
#   ./tools/q6-collect.sh        # safe to run any time; waits for the chain first

set -euo pipefail
cd "$(dirname "$0")/.."
SRC=../king-down-sim

while pgrep -f "q6-chain.sh" >/dev/null; do sleep 60; done
echo "q6-collect: the chain has ended; collecting from $SRC"

mkdir -p sim/q6-g2/out sim/q6-g2/nnue
cp -f "$SRC"/sim/out/nnue-g2.summary.json "$SRC"/sim/out/q6-nnue-g2.done sim/q6-g2/out/ 2>/dev/null || true
cp -f "$SRC"/sim/out/nnue-res2-*.summary.json "$SRC"/sim/out/nnue-res2-*.tuned.json "$SRC"/sim/out/nnue-res2-*.report.json sim/q6-g2/out/ 2>/dev/null || true
cp -f "$SRC"/sim/nnue/positions.json "$SRC"/sim/nnue/net.json "$SRC"/sim/nnue/train.json \
      "$SRC"/sim/nnue/bench.json "$SRC"/sim/nnue/eval-*.json "$SRC"/sim/nnue/weights-candidate.ts sim/q6-g2/nnue/ 2>/dev/null || true

# The report is written twice: once from the worktree, then once from the collected copies, so the
# stable path is the one it names.
node tools/q6-report.mjs --base "$SRC/sim"
node tools/q6-report.mjs --base sim/q6-g2
echo "q6-collect: done. Raw records stay in $SRC/sim/out/ and $SRC/sim/nnue/"
