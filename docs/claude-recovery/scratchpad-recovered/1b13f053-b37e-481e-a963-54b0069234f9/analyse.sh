#!/bin/zsh
cd "/Users/za/Documents/king down chess"
D=/private/tmp/claude-501/-Users-za-Documents-king-down-chess/1b13f053-b37e-481e-a963-54b0069234f9/scratchpad
RUNS=(np-N np-O np-C ab-O-push.base ab-O-push.var ab-C-land.base ab-C-land.var ov-O-repel.O ov-O-push.O ov-C-stay.C ov-C-land.C)
echo "\n## which engine actually played: replay 4 games of each run and compare move for move"
for id in $RUNS; do npx tsx $D/replay.mjs $id 4; done
for id in np-N np-O np-C; do npm run sim:analyze -- --id $id >/dev/null; done
echo "\n## piece vs no piece, two-sample"
node $D/twosample.mjs np-N np-O np-C
echo "\n## counters"
node $D/counters.mjs np-N np-O np-C ab-O-push.base ab-O-push.var ab-C-land.base ab-C-land.var
