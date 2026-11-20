#!/bin/bash
# Usage: tools/release/merge.sh <pr> <head> <reviewed head> [reconcile note]
# KINGDOWN_REVIEW=lead-read records a review of a screen tweak. The default is independent.
# Records one complete review (reviewed head and its merge base; a reconcile note when the head or the base
# moved since) and merges the PR on green with tools/merge-on-green.mjs. The record goes to a temp file named on stdout.
# Three tries cover a GitHub network error or server error (HTTP 500, 502, 503); a failed check or review record stops at once.
set -u
[ $# -ge 3 ] && [ $# -le 4 ] || { echo 'usage: tools/release/merge.sh <pr> <head> <reviewed head> [reconcile note]' >&2; exit 2; }
pr=$1 head=$2 rhead=$3 note=${4:-} review=${KINGDOWN_REVIEW:-independent}
case "$review" in independent|lead-read) ;; *) echo 'merge: KINGDOWN_REVIEW must be independent or lead-read' >&2; exit 2 ;; esac
repo=$(cd "$(dirname "$0")/../.." && pwd -P)
record=$(mktemp "${TMPDIR:-/tmp}/review-$pr.XXXXXX") || exit 2
echo "merge: review record $record"
for try in 1 2 3; do
  git -C "$repo" fetch -q origin || { sleep 30; continue; }
  base=$(gh pr view "$pr" --repo SaarShai/king-down-chess --json baseRefOid,baseRefName --jq .baseRefOid) || { sleep 30; continue; }
  bref=$(gh pr view "$pr" --repo SaarShai/king-down-chess --json baseRefName --jq .baseRefName)
  rbase=$(git -C "$repo" merge-base "$rhead" "origin/$bref" 2>/dev/null || echo "$base")
  node --input-type=module - "$pr" "$head" "$base" "$rhead" "$rbase" "$note" "$review" > "$record" <<'NODE'
const [pr, head, base, rhead, rbase, note, id] = process.argv.slice(2);
const review = { id, head: rhead, base: rbase, result: 'complete', openFindings: [] };
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
  case "$output" in *"Error connecting"*|*"error connecting"*|*"timed out"*|*ETIMEDOUT*|*"unexpected EOF"*|*"handshake timeout"*|*"i/o timeout"*|*"HTTP 50"*|*"Something went wrong"*) sleep 30 ;; *) exit 1 ;; esac
done
echo 'merge: gave up after three network failures' >&2; exit 1
