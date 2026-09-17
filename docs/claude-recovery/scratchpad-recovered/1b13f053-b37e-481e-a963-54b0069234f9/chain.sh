#!/bin/zsh
set -e
cd "/Users/za/Documents/king down chess"
S() { echo "\n=== $(date +%H:%M:%S) $* ==="; }

# (a) value arms: the odds match against a knight, 300 games each, pawn calibration carried over.
S ov-O-repel
npm run sim -- --id ov-O-repel --experiment values --pieces O --games 300 --depth 3 --seed 1 --workers 8 --eloPerPawn 64
S ov-O-push
npm run sim -- --id ov-O-push  --experiment values --pieces O --games 300 --depth 3 --seed 1 --workers 8 --eloPerPawn 64 --rule ogreMode=push
S ov-C-stay
npm run sim -- --id ov-C-stay  --experiment values --pieces C --games 300 --depth 3 --seed 1 --workers 8 --eloPerPawn 64
S ov-C-land
npm run sim -- --id ov-C-land  --experiment values --pieces C --games 300 --depth 3 --seed 1 --workers 8 --eloPerPawn 64 --rule catapultCapture=land

# (b) piece vs no piece: 40 mirrored ranks holding the piece, against the same ranks with a knight.
S np-N
npm run sim -- --spec sim/specs/newpieces/np-N.json --workers 16
S np-O
npm run sim -- --spec sim/specs/newpieces/np-O.json --workers 16
S np-C
npm run sim -- --spec sim/specs/newpieces/np-C.json --workers 16

# (c) paired variant A/Bs on each piece's own ranks; both controls are new today.
S ab-O-push
npm run sim -- --spec sim/specs/newpieces/ab-O-push.json --experiment ab --rule ogreMode=push --workers 16
S ab-C-land
npm run sim -- --spec sim/specs/newpieces/ab-C-land.json --experiment ab --rule catapultCapture=land --workers 16
S DONE
