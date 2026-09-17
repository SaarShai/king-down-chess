#!/bin/zsh
# The bounded follow-up to the Ogre/Catapult campaign (docs/research/sim-new-pieces-2026-09-14.md §7).
# Waits for the Q6 chain to free the cores, refuses a dirty tracked tree, and runs:
#   1. the re-seed of the two default readings at their measured values (Muller's fixed point),
#   2. the depth-4 confirmation of `push` vs `repel`, the one promising A/B.
# Stops on the first failure. ~25 minutes on 16 free cores.

set -euo pipefail
cd "$(dirname "$0")/.."
LOG=sim/out/newpieces-followup-2026-09-16.log
run() {
  echo "== $(date '+%F %T') $*" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
}

echo "== waiting for tools/q6-chain.sh to finish" | tee -a "$LOG"
while pgrep -f "q6-chain.sh" >/dev/null; do sleep 120; done
echo "== chain done at $(date '+%F %T')" | tee -a "$LOG"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "newpieces-followup: the tracked tree is dirty; commit before running this (LESSONS.md 2026-09-14)" >&2
  exit 1
fi

# Muller step: with the piece priced at its measured value, the odds arm should read about 0 Elo.
run npm run sim -- --id ov-O2-repel --experiment values --pieces O --games 300 --depth 3 --seed 1 --workers 16 --eloPerPawn 64 --values O=195
run npm run sim -- --id ov-C2-stay --experiment values --pieces C --games 300 --depth 3 --seed 1 --workers 16 --eloPerPawn 64 --values C=175

# Second depth for the only A/B a larger sample could still reverse.
run npm run sim -- --spec sim/specs/newpieces/ab-O-push.json --experiment ab --id ab-O-push-d4 \
  --games 800 --depth 4 --seed 51 --workers 16 --rule ogreMode=push

touch sim/out/newpieces-followup-2026-09-16.done
echo "== follow-up complete $(date '+%F %T')" | tee -a "$LOG"
