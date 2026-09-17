#!/bin/zsh
set -u
cd "/Users/za/Documents/king down chess"
LOG=sim/out/queue-2026-09-14.log
run() { echo "== $(date +%H:%M:%S) $*" >> "$LOG"; "$@" >> "$LOG" 2>&1; echo "== exit $? $(date +%H:%M:%S)" >> "$LOG"; }
run npm run sim -- --spec sim/specs/guard/dbl-slide.json --experiment ab --workers 16
run npm run sim -- --spec sim/specs/guard/dbl-leap.json --experiment ab --workers 16
run npm run sim -- --id pb-ab-L-nonPawn --experiment ab --games 1600 --sample 40 --depth 3 --seed 21 --workers 16 --baseId pb-ab-base --rule paladinKamikaze=nonPawn
run npm run sim -- --id pb-ab-M-swapAny --experiment ab --games 1600 --sample 40 --depth 3 --seed 21 --workers 16 --baseId pb-ab-base --rule maesterSwapAny
run npm run sim -- --id pb-lp-never --experiment ab --games 800 --sample 40 --pool QRRBBNNL --depth 3 --seed 41 --workers 16 --baseId pb-lp-base --baseRule promotionSet=anyNonKing --rule paladinKamikaze=never
run npm run sim -- --id dt-full --experiment ab --games 4000 --sample 40 --depth 3 --seed 31 --workers 16 --baseId dt-full-base --rule secondPlayerDoubleFirstTurn
run npm run sim -- --id dt-nopal --experiment ab --games 4000 --sample 40 --depth 3 --seed 32 --workers 16 --pool QRRBBNNAAGMMSS --baseId dt-nopal-base --rule secondPlayerDoubleFirstTurn
run npx tsx tools/warden-report.ts --runs ab-warden-wall,ab-guard-dbl-slide.var,ab-guard-dbl-leap.var
run npm run dashboard
touch sim/out/queue-2026-09-14.done
