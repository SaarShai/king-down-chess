#!/bin/bash
# Usage: tools/release/release.sh <release pr> <head> [reconcile note]
# The whole live release of a reviewed release PR (release/N -> main, pinned to a checked staging commit): merge on green,
# the read-only engines check, then the publish of origin/main. Run it detached (tmux) and read its last lines.
set -uo pipefail
[ $# -ge 2 ] && [ $# -le 3 ] || { echo 'usage: tools/release/release.sh <release pr> <head> [reconcile note]' >&2; exit 2; }
tools=$(cd "$(dirname "$0")/.." && pwd -P)
bash "$tools/release/merge.sh" "$1" "$2" "$2" "${3:-}" || { echo 'release: merge failed'; exit 1; }
engines=$(bash "$tools/release/live.sh" engines 2>&1); echo "$engines"
grep -q 'engines-check: pass' <<<"$engines" || { echo 'release: engines check failed'; exit 1; }
bash "$tools/release/live.sh" publish; rc=$?
echo "release: publish exit $rc"; exit $rc
