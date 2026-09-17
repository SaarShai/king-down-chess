#!/bin/zsh
set -u
cd "/Users/za/Documents/king down chess"
LOG=sim/out/q6-2026-09-14.log
while [ ! -f sim/out/queue-2026-09-14b.done ]; do sleep 60; done
run() { echo "== $(date +%H:%M:%S) $*" >> "$LOG"; "$@" >> "$LOG" 2>&1; echo "== exit $? $(date +%H:%M:%S)" >> "$LOG"; }
# Q6: 10x training data from the shipped engine (rules pinned explicitly, see LESSONS.md), residual net, acceptance matches
run npm run sim -- --id nnue-g1 --games 80000 --depth 3 --sample 4000 --seed 914 --workers 16 --rule archerMove=any --rule beastMove=any --rule guardCaptures=none --rule guardStep=1 --rule guardCaptureLimit=0 --rule promotionSet=anyNonKingNoGuard
run npm run nnue -- sample --runs nnue-g1
run npm run nnue -- train --loss res --lambda 0 --epochs 16 --batch 8192 --lr 0.015
run npm run nnue -- arms
run npm run tune -- match --id nnue-res-d3 --games 1600 --depth 3 --seed 7103 --workers 16 --tuned sim/nnue/eval-residual.json --base sim/nnue/eval-linear.json
run npm run tune -- match --id nnue-res-d4 --games 200 --depth 4 --seed 7104 --workers 16 --tuned sim/nnue/eval-residual.json --base sim/nnue/eval-linear.json
run npm run nnue -- bench
touch sim/out/q6-2026-09-14.done
