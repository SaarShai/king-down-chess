#!/bin/bash
# Usage: tools/release/merge.sh <pr> <head> <reviewed head> [reconcile note]
# Records one complete independent review (reviewed head and its merge base; a reconcile note when the head or the base
# moved since) and merges the PR on green with tools/merge-on-green.mjs. The record goes to a temp file named on stdout.
# Three tries cover a GitHub network error; a failed check or review record stops at once.
set -u
[ $# -ge 3 ] && [ $# -le 4 ] || { echo 'usage: tools/release/merge.sh <pr> <head> <reviewed head> [reconcile note]' >&2; exit 2; }
pr=$1 head=$2 rhead=$3 note=${4:-}
repo=$(cd "$(dirname "$0")/../.." && pwd -P)
record=$(mktemp "${TMPDIR:-/tmp}/review-$pr.XXXXXX") || exit 2
echo "merge: review record $record"
for try in 1 2 3; do
  git -C "$repo" fetch -q origin || { sleep 30; continue; }
  base=$(gh pr view "$pr" --repo SaarShai/king-down-chess --json baseRefOid,baseRefName --jq .baseRefOid) || { sleep 30; continue; }
  bref=$(gh pr view "$pr" --repo SaarShai/king-down-chess --json baseRefName --jq .baseRefName)
  rbase=$(git -C "$repo" merge-base "$rhead" "origin/$bref" 2>/dev/null || echo "$base")
  node --input-type=module - "$pr" "$head" "$base" "$rhead" "$rbase" "$note" > "$record" <<'NODE'
const [pr, head, base, rhead, rbase, note] = process.argv.slice(2);
const review = { id: 'independent', head: rhead, base: rbase, result: 'complete', openFindings: [] };
if (rhead !== head || rbase !== base) {
  if (!note.trim()) { console.error('merge: the head or the base moved since the review; give a reconcile note'); process.exit(2); }
  review.reconcile = { head, base, result: 'pass', note };
}
console.log(JSON.stringify({ pr: Number(pr), head, base, reviews: [review] }));
NODE
  [ $? -eq 0 ] || exit 2
  output=$(node "$repo/tools/merge-on-green.mjs" "$pr" "$head" "$record" 2>&1); rc=$?
  echo "$output"
  [ $rc -eq 0 ] && exit 0
  case "$output" in *"Error connecting"*|*"error connecting"*|*"timed out"*|*ETIMEDOUT*) sleep 30 ;; *) exit 1 ;; esac
done
echo 'merge: gave up after three network failures' >&2; exit 1
