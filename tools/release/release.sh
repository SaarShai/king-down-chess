#!/bin/bash
# Start in tmux and read the end of the progress file.
set -euo pipefail

usage() {
  echo 'usage: tools/release/release.sh [--dry-run] [--tweak] [--from <stage>] [--force] <PR> <full head> [reconcile note]' >&2
  exit 2
}
stages=(ci staging staging-checks merge main-ci engines publish live-check log)
dry=no tweak=no from=ci force=no
args=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) dry=yes ;;
    --tweak) tweak=yes ;;
    --from) [ "$#" -ge 2 ] || usage; from=$2; shift ;;
    --force) force=yes ;;
    --*) usage ;;
    *) args+=("$1") ;;
  esac
  shift
done
[ "${#args[@]}" -ge 2 ] && [ "${#args[@]}" -le 3 ] || usage
pr=${args[0]} head=${args[1]} note=${args[2]:-}
[[ "$pr" =~ ^[1-9][0-9]*$ && "$head" =~ ^[0-9a-f]{40}$ ]] || usage
[[ " ${stages[*]} " == *" $from "* && -n "$from" ]] || usage

tools=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$tools/.."
main=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
base=${KINGDOWN_RELEASE_EVIDENCE:-$main/../evidence}
kind=release
[ "$dry" = no ] || kind=release-dry
run="$base/$kind-$pr-$head"
mkdir -p "$run"
lock="$base/$kind-active"
mkdir "$lock" || { echo "release: another run holds $lock" >&2; exit 2; }
progress="$run/progress.log"
rm -f "$progress.done"
stage= failure_commit=$head publish_error=
finish() {
  local code=$?
  if [ "$code" -ne 0 ] && [ -n "$stage" ]; then
    write_failure "$code" || echo "release: could not append to $release_log" >&2
    say "$stage failed ($code). ${publish_error:+$publish_error. }See $run/$stage.log"
  fi
  say "exit $code"
  printf '%s\n' "$code" > "$progress.done.tmp"
  mv "$progress.done.tmp" "$progress.done"
  rmdir "$lock"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
say() { printf 'release: %s\n' "$*" | tee -a "$progress"; }
dry_command() { printf 'dry-run:'; printf ' %q' "$@"; printf '\n'; }
outward() {
  if [ "$dry" = yes ]; then dry_command "$@"; else "$@"; fi
}

repository=SaarShai/king-down-chess
staging=https://kingdown-staging.vercel.app
live=https://kingdown.dev
release_log=${KINGDOWN_RELEASE_LOG:-$main/../runs/launch/release-log.md}
pr_view() { gh pr view "$pr" --repo "$repository" "$@"; }

require_release_pr() {
  local fields=state,baseRefName,headRefOid
  local filter="select(.state == \"OPEN\" and .baseRefName == \"main\") | .headRefOid"
  if [ "$dry" = yes ]; then
    dry_command gh pr view "$pr" --repo "$repository" --json "$fields" --jq "$filter"
  else
    [ "$(pr_view --json "$fields" --jq "$filter")" = "$head" ] || { echo 'release: the PR must be open at this head and target main'; return 1; }
  fi
}
wait_head() {
  require_release_pr
  outward bash "$tools/release/ci-wait.sh" "$head"
}
merge_release() {
  require_release_pr
  outward bash "$tools/release/merge.sh" "$pr" "$head" "$head" "$note"
}
staging_deploy() {
  local cmd=(python3 "$tools/release/staging.py" --ci-passed "$head")
  if [ "$(result ci)" != pass ]; then wait_head; fi
  if [ "$dry" = yes ]; then
    "${cmd[@]}" --dry-run
  else
    KINGDOWN_RELEASE_EVIDENCE="$run/staging" "${cmd[@]}"
  fi
}
wait_main() {
  local commit
  if [ "$dry" = yes ]; then
    dry_command gh pr view "$pr" --repo "$repository" --json state,baseRefName,headRefOid,mergeCommit
    commit='<merge-commit>'
  else
    commit=$(pr_view --json state,baseRefName,headRefOid,mergeCommit --jq \
      "select(.state == \"MERGED\" and .baseRefName == \"main\" and .headRefOid == \"$head\") | .mergeCommit.oid")
    [[ "$commit" =~ ^[0-9a-f]{40}$ ]] || { echo 'release: no merge commit for this PR head on main'; return 1; }
    failure_commit=$commit
  fi
  rm -f "$run/main-commit"
  outward bash "$tools/release/ci-wait.sh" "$commit" "${KINGDOWN_CI_WAIT_MINUTES:-50}" --retry-failed
  printf '%s\n' "$commit" > "$run/main-commit"
}
live_step() {
  local mode=$1 commit
  if [ "$dry" = yes ]; then
    dry_command 'KINGDOWN_RELEASE_COMMIT=<merge-commit>' bash "$tools/release/live.sh" "$mode"
    return
  fi
  if ! IFS= read -r commit < "$run/main-commit" || ! [[ "$commit" =~ ^[0-9a-f]{40}$ ]]; then
    echo 'release: start with --from main-ci to record green CI on the merge commit'
    return 1
  fi
  KINGDOWN_RELEASE_COMMIT="$commit" KINGDOWN_RELEASE_EVIDENCE="$run/live" bash "$tools/release/live.sh" "$mode" </dev/null
}
checks() {
  local origin=$1
  shift
  if [ "$dry" = yes ]; then
    dry_command "PLAYABLE_URL=$origin" npm run check:browser "$@"
  else
    PLAYABLE_URL="$origin" npm run check:browser "$@"
  fi
}
check_result() {
  local file="$run/$1.log"
  if [ -f "$file" ]; then
    awk -v name="$2" '$2 == name && $1 == "ok" {result="pass"} $2 == name && $1 == "FAIL" {result="fail"} END {print result ? result : "unrecorded"}' "$file"
  else
    echo unrecorded
  fi
}
append_release_log() {
  if [ "$dry" = yes ]; then
    printf 'dry-run: append %q\n%s\n' "$release_log" "$1"
  else
    mkdir -p "$(dirname "$release_log")" && printf '%s\n' "$1" >> "$release_log"
  fi
}
published_commit() {
  [ -f "$run/publish.log" ] || return 0
  # The deploy starts its live check only after publication succeeds.
  awk '
    /^deploy: checks passed at [0-9a-f]+; publishing the tested build$/ { candidate=$5; sub(/;$/, "", candidate) }
    /^deploy: step live check$/ { commit=candidate }
    /^deploy: published [0-9a-f]+ to kingdown; live checks pass$/ { commit=$3 }
    END { if (length(commit) == 40) print commit }
  ' "$run/publish.log"
}
verify_publish() {
  local expected actual
  IFS= read -r expected < "$run/main-commit"
  actual=$(published_commit)
  if [ "$actual" != "$expected" ]; then
    publish_error="Expected $expected. Published ${actual:-unrecorded}"
    return 1
  fi
}
write_failure() {
  local commit=$failure_commit published=''
  case "$stage" in
    engines|publish|live-check|log)
      if [ -f "$run/main-commit" ]; then IFS= read -r commit < "$run/main-commit"; fi
      [[ "$commit" =~ ^[0-9a-f]{40}$ ]] || commit=$head ;;
  esac
  case "$stage" in publish|live-check|log) published=$(published_commit) ;; esac
  append_release_log "- $(date -u +%FT%TZ) | PR #$pr | commit $commit | $stage failed ($1)${published:+ | published commit $published}"
}
write_log() {
  local commit='unrecorded' published deployed='unrecorded' staged='skipped' site='skipped' history='skipped'
  [ ! -f "$run/main-commit" ] || IFS= read -r commit < "$run/main-commit"
  published=$(published_commit)
  if [ "$tweak" = no ]; then
    staged=unrecorded
    if [ -f "$run/staging.log" ]; then
      staged=$(awk '/^staging: deployment / {d=$3} END {print d ? d : "unrecorded"}' "$run/staging.log")
    fi
    site=$(check_result staging-checks release-site)
    history=$(check_result staging-checks release-history)
  fi
  if [ -f "$run/publish.log" ]; then
    deployed=$(awk '/^deploy: step / {publish=($0 == "deploy: step publish")} publish && match($0, /https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/) {d=substr($0,RSTART,RLENGTH)} END {print d ? d : "unrecorded"}' "$run/publish.log")
  fi
  append_release_log "$(printf -- '- %s | PR #%s | commit %s | published commit %s | staging %s | deploy %s | CI %s | staging alias %s | staging site %s | staging history %s | main CI %s | engines %s | publish %s | live site %s' \
    "$(date -u +%FT%TZ)" "$pr" "$commit" "${published:-unrecorded}" "$staged" "$deployed" "$(result ci)" "$(result staging)" "$site" "$history" "$(result main-ci)" "$(result engines)" "$(result publish)" "$(check_result live-check release-site)")"
}
result() {
  awk -v name="$1" '
    $1 != "release:" || $2 != name { next }
    $3 ~ /^(start|pass|failed)$/ || ($3 == "skip" && !status) { status=$3 }
    END { print status ? status : "unrecorded" }
  ' "$progress"
}
run_stage() {
  case "$1" in
    ci) wait_head ;;
    staging) staging_deploy ;;
    staging-checks) checks "$staging" release-site release-history ;;
    merge) merge_release ;;
    main-ci) wait_main ;;
    engines) live_step engines ;;
    publish) live_step publish ;;
    live-check) checks "$live" release-site ;;
    log) write_log ;;
  esac
}

say "progress $progress"
say "PR $pr $head from $from (tweak=$tweak, dry-run=$dry)"
started=no
for name in "${stages[@]}"; do
  [ "$name" != "$from" ] || started=yes
  if [ "$started" = no ]; then
    if [ "$force" = no ] && [ "$(result "$name")" != pass ]; then
      say "$name has no pass. Start at $name or use --force."
      exit 1
    fi
    say "$name skip"
    continue
  fi
  if [ "$tweak" = yes ] && [[ "$name" == staging* ]]; then say "$name skip"; continue; fi
  stage=$name
  say "$stage start"
  if [ "$dry" = yes ]; then
    run_stage "$stage" | tee "$run/$stage.log"
    [ "${KINGDOWN_RELEASE_FAIL_STAGE:-}" != "$stage" ] || exit 1
  else
    run_stage "$stage" > "$run/$stage.log" 2>&1
    if [ "$stage" = publish ]; then verify_publish; fi
  fi
  say "$stage pass"
done
stage=
