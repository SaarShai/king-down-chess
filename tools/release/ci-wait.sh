#!/bin/bash
# Usage: tools/release/ci-wait.sh <full sha> [minutes]   Waits (default 45 minutes) until CI passes on that exact commit
# (tools/ci-green.mjs): exit 0 passed, 1 still pending or no GitHub answer at the limit, 2 a check failed.
set -u
repo=$(cd "$(dirname "$0")/../.." && pwd -P)
sha=${1:?full sha}; minutes=${2:-45}
for ((i = 0; i <= minutes; i++)); do
  node "$repo/tools/ci-green.mjs" "$sha"; rc=$?
  [ $rc -eq 1 ] || [ $rc -eq 3 ] || exit $rc
  [ $i -lt $minutes ] && sleep 60
done
exit 1
