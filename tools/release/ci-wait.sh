#!/bin/bash
# Wait for CI on a full commit. A main release can rerun failed jobs once.
set -u
repo=$(cd "$(dirname "$0")/../.." && pwd -P)
sha=${1:?full sha}; minutes=${2:-45}; retry=${3:-}
[[ "$sha" =~ ^[0-9a-f]{40}$ && "$minutes" =~ ^(0|[1-9][0-9]*)$ && ("$retry" = '' || "$retry" = --retry-failed) ]] || exit 2

wait_ci() {
  local i rc
  for ((i = 0; i <= minutes; i++)); do
    node "$repo/tools/ci-green.mjs" "$sha"; rc=$?
    [ "$rc" -eq 1 ] || [ "$rc" -eq 3 ] || return "$rc"
    [ "$i" -ge "$minutes" ] || sleep 60
  done
  return 1
}

wait_ci; rc=$?
[ "$rc" -eq 2 ] && [ "$retry" = --retry-failed ] || exit "$rc"

# A failed check can finish while other jobs are active. Let the run finish first.
github=SaarShai/king-down-chess
run=$(gh run list --repo "$github" --workflow plugin-checks.yml --branch main --event push --commit "$sha" --limit 1 \
  --json databaseId,headSha --jq ".[] | select(.headSha == \"$sha\") | .databaseId") || exit 2
[[ "$run" =~ ^[0-9]+$ ]] || { echo "ci-wait: no main CI run for $sha" >&2; exit 2; }
gh run watch "$run" --repo "$github" --interval 30 || exit 2
conclusion=$(gh run view "$run" --repo "$github" --json conclusion --jq .conclusion) || exit 2
case "$conclusion" in
  failure|timed_out) ;;
  *) echo "ci-wait: run $run ends with $conclusion" >&2; exit 2 ;;
esac
gh run view "$run" --repo "$github" --json jobs --jq '.jobs[] | select(.conclusion=="failure" or .conclusion=="timed_out") | .name' || exit 2
attempt=$(gh api "repos/$github/actions/runs/$run" --jq .run_attempt) || exit 2
[[ "$attempt" =~ ^[0-9]+$ ]] || exit 2
echo "ci-wait: rerun failed jobs once on main run $run at $sha"
gh run rerun "$run" --repo "$github" --failed || exit 2
for ((i = 0; i <= minutes; i++)); do
  current=$(gh api "repos/$github/actions/runs/$run" --jq .run_attempt) || exit 2
  if [[ "$current" =~ ^[0-9]+$ ]] && [ "$current" -gt "$attempt" ]; then
    gh run watch "$run" --repo "$github" --interval 30 || exit 2
    wait_ci
    exit $?
  fi
  [ "$i" -ge "$minutes" ] || sleep 60
done
echo "ci-wait: updated run $run did not appear" >&2
exit 1
