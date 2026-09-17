#!/bin/zsh
set -u
cd "/Users/za/Documents/king down chess"
LOG=sim/out/queue-2026-09-14.log
while [ ! -f sim/out/queue-2026-09-14.done ]; do sleep 30; done
run() { echo "== $(date +%H:%M:%S) $*" >> "$LOG"; "$@" >> "$LOG" 2>&1; echo "== exit $? $(date +%H:%M:%S)" >> "$LOG"; }
# Q2/Q3 again against a control played on today's pool (pb-ab-base mixed two pools; void as a control)
run npm run sim -- --id pb-ab-L-nonPawn --experiment ab --games 1600 --sample 40 --depth 3 --seed 21 --workers 16 --baseId pb-ab-base24 --rule paladinKamikaze=nonPawn
run npm run sim -- --id pb-ab-M-swapAny --experiment ab --games 1600 --sample 40 --depth 3 --seed 21 --workers 16 --baseId pb-ab-base24 --rule maesterSwapAny
run npm run dashboard
touch sim/out/queue-2026-09-14b.done
