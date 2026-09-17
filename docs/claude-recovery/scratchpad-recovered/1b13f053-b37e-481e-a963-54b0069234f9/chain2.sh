#!/bin/zsh
set -e
cd "/Users/za/Documents/king down chess"
S() { echo "\n=== $(date +%H:%M:%S) $* ==="; }
S np-N
npm run sim -- --spec sim/specs/newpieces/np-N.json --workers 16
S np-O
npm run sim -- --spec sim/specs/newpieces/np-O.json --workers 16
S np-C
npm run sim -- --spec sim/specs/newpieces/np-C.json --workers 16
S ab-O-push
npm run sim -- --spec sim/specs/newpieces/ab-O-push.json --experiment ab --rule ogreMode=push --workers 16
S ab-C-land
npm run sim -- --spec sim/specs/newpieces/ab-C-land.json --experiment ab --rule catapultCapture=land --workers 16
S DONE
