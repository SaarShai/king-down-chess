#!/bin/zsh
# Kings' powers campaign (docs/TAKEOVER-PLAN.md §5): pilot, paired pricing, second depth.
#
# Waits for the Q6 chain and the Ogre/Catapult follow-up (they own the cores), refuses a dirty
# tracked tree, then runs, for each of the six tier-1 powers:
#   1. a 200-game/arm pilot — a correctness and abuse check that stops the chain on any failure,
#   2. a 1,600-game/arm paired A/B on 40 arrangements and common opening seeds, depth 3,
#   3. a 400-game/arm depth-4 confirmation only where tsx tools/kings-summary.ts says one is needed.
# The summary writes docs/research/sim-kings-2026-09-16.md. ~1h40m on 16 free cores.

set -euo pipefail
cd "$(dirname "$0")/.."
LOG=sim/out/kings-2026-09-16.log
run() {
  echo "== $(date '+%F %T') $*" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
}

while pgrep -f "q6-chain.sh" >/dev/null; do sleep 120; done
while pgrep -f "newpieces-followup.sh" >/dev/null; do sleep 120; done
if [[ -n "$(git status --porcelain --untracked-files=no -- src)" ]]; then
  echo "kings-pilot: src/ is dirty; commit before running this" >&2
  exit 1
fi

POWERS=(
  "kp-holylight Spirit:HolyLight"
  "kp-mercy Spirit:Mercy"
  "kp-deathtouch Shadow:DeathTouch"
  "kp-darkness Shadow:Darkness"
  "kp-march Mud:March"
  "kp-leap Mud:Leap"
)

for entry in "${POWERS[@]}"; do
  set -- ${=entry}
  run npm run sim -- --id "$1-p" --experiment ab --games 200 --sample 40 --depth 3 --seed 61 --workers 16 --rule "kings=$2"
done

for entry in "${POWERS[@]}"; do
  set -- ${=entry}
  run npm run sim -- --id "$1" --experiment ab --games 1600 --sample 40 --depth 3 --seed 62 --workers 16 --rule "kings=$2"
done

run node_modules/.bin/tsx tools/kings-summary.ts

if [[ -s sim/out/kings-depth4.ids ]]; then
  while read -r name rule; do
    run npm run sim -- --id "$name-d4" --experiment ab --games 400 --sample 40 --depth 4 --seed 63 --workers 16 --rule "kings=$rule"
  done < sim/out/kings-depth4.ids
  run node_modules/.bin/tsx tools/kings-summary.ts --final
fi

touch sim/out/kings-2026-09-16.done
echo "== kings campaign complete $(date '+%F %T')" | tee -a "$LOG"
