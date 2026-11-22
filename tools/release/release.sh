#!/bin/bash
# Start in tmux and read the end of the progress file.
set -euo pipefail

usage() {
  echo 'usage: tools/release/release.sh [--dry-run] [--tweak] [--from <stage>] [--force] [--reviewed <full sha>] <PR> <full head> [reconcile note]' >&2
  exit 2
}
stages=(ci staging staging-checks merge main-ci engines publish live-check log)
dry=no tweak=no from=ci force=no reviewed=
args=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) dry=yes ;;
    --tweak) tweak=yes ;;
    --from) [ "$#" -ge 2 ] || usage; from=$2; shift ;;
    --force) force=yes ;;
    --reviewed) [[ "$#" -ge 2 && "$2" =~ ^[0-9a-f]{40}$ ]] || usage; reviewed=$2; shift ;;
    --*) usage ;;
    *) args+=("$1") ;;
  esac
  shift
done
[ "${#args[@]}" -ge 2 ] && [ "${#args[@]}" -le 3 ] || usage
pr=${args[0]} head=${args[1]} note=${args[2]:-}
reviewed=${reviewed:-$head}
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
run=$(cd "$run" && pwd -P)
lock="$base/$kind-active"
progress="$run/progress.log"
frame_record="$run/live/frame-checks.pass"
stage= failure_commit=$head publish_error= bypassed= ci_pid=
finish() {
  local code=$?
  if [ -n "$ci_pid" ]; then
    kill "$ci_pid" 2>/dev/null || :
    wait "$ci_pid" 2>/dev/null || :
  fi
  if [ "$code" -ne 0 ] && [ -n "$stage" ]; then
    write_failure "$code" || echo "release: could not append to $release_log" >&2
    say "$stage failed ($code). ${publish_error:+$publish_error. }See $run/$stage.log"
  fi
  say "exit $code"
  printf '%s\n' "$code" > "$progress.done.tmp"
  mv "$progress.done.tmp" "$progress.done"
  rm -f "$lock/pid"
  rmdir "$lock"
}
say() { printf 'release: %s\n' "$*" | tee -a "$progress"; }
dry_command() { printf 'dry-run:'; printf ' %q' "$@"; printf '\n'; }
outward() {
  if [ "$dry" = yes ]; then dry_command "$@"; else "$@"; fi
}

repository=SaarShai/king-down-chess
staging=https://kingdown-staging.vercel.app
live=https://kingdown.dev
staging_tree=${KINGDOWN_RELEASE_WORKTREE:-$main/.claude/worktrees/release-staging}
live_tree=${KINGDOWN_RELEASE_WORKTREE:-$main/.claude/worktrees/release-live}
release_log=${KINGDOWN_RELEASE_LOG:-$main/../runs/launch/release-log.md}
pr_view() { gh pr view "$pr" --repo "$repository" "$@"; }

require_release_pr() {
  local fields=state,baseRefName,headRefOid,isCrossRepository
  local filter="select(.state == \"OPEN\" and .baseRefName == \"main\" and .isCrossRepository == false) | .headRefOid"
  if [ "$dry" = yes ]; then
    dry_command gh pr view "$pr" --repo "$repository" --json "$fields" --jq "$filter"
  else
    [ "$(pr_view --json "$fields" --jq "$filter")" = "$head" ] || { echo 'release: the PR must be open at this head and target main from this repository'; return 1; }
  fi
}
require_reconciled_base() {
  outward gh api "repos/$repository/compare/main...$head?per_page=1" --jq \
    'if .base_commit.sha and .base_commit.sha == .merge_base_commit.sha then empty else error("release: the base moved since the review; give a reconcile note") end'
}
require_reconcile() {
  if [[ "$note" =~ [^[:space:]] ]]; then return 0; fi
  if [ "$reviewed" != "$head" ]; then
    echo 'release: the reviewed head differs. Give a reconcile note.' >&2
    return 1
  fi
  require_reconciled_base
}
wait_head() {
  require_release_pr || return
  outward bash "$tools/release/ci-wait.sh" "$head" '' --pr-head
}
release_ci() {
  local began code=0 tree time passed_checks
  if [ "$dry" = no ]; then rm -f "$frame_record" || return; fi
  require_release_pr || return
  if [ "$dry" = yes ]; then
    echo 'dry-run: run PR CI wait and frame-time browser checks in parallel, then require both to pass'
    dry_command bash "$tools/release/ci-wait.sh" "$head" '' --pr-head
  else
    bash "$tools/release/ci-wait.sh" "$head" '' --pr-head &
    ci_pid=$!
  fi
  began=$SECONDS
  frame_checks || code=$?
  say "time frame-checks $((SECONDS - began))s"
  [ "$code" -eq 0 ] || return "$code"
  if [ "$dry" = yes ]; then
    dry_command "cwd=$live_tree" git rev-parse "$head^{tree}"
    dry_command "write pass (tree, UTC time, king-effects painted-game) to $frame_record"
    return
  fi
  tree=$(git -C "$live_tree" rev-parse "$head^{tree}") || return
  time=$(date -u +%FT%TZ) || return
  passed_checks=$(awk '$1 == "ok" {printf "%s%s", separator, $2; separator=" "}' "$run/frame-checks.log") || return
  if [ -z "$passed_checks" ]; then
    echo 'release: the frame-time run reported no passing checks' >&2
    return 1
  fi
  wait "$ci_pid" || code=$?
  ci_pid=
  [ "$code" -eq 0 ] || return "$code"
  mkdir -p "$run/live" || return
  printf 'pass %s %s %s\n' "$tree" "$time" "$passed_checks" > "$frame_record.tmp" &&
    mv "$frame_record.tmp" "$frame_record"
}
merge_release() {
  require_release_pr || return
  require_reconcile || return
  outward bash "$tools/release/merge.sh" "$pr" "$head" "$reviewed" "$note"
}
staging_deploy() {
  local cmd=(python3 "$tools/release/staging.py" --ci-passed --pr-head "$head")
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
merge_commit() {
  local commit
  if [ "$dry" = yes ]; then
    printf '%s\n' '<merge-commit>'
    return
  fi
  if ! IFS= read -r commit < "$run/main-commit" || ! [[ "$commit" =~ ^[0-9a-f]{40}$ ]]; then
    echo 'release: start with --from main-ci to record green CI on the merge commit' >&2
    return 1
  fi
  printf '%s\n' "$commit"
}
live_step() {
  local mode=$1 commit
  commit=$(merge_commit) || return
  if [ "$dry" = yes ]; then
    dry_command "KINGDOWN_RELEASE_WORKTREE=$live_tree" "KINGDOWN_RELEASE_COMMIT=$commit" "KINGDOWN_RELEASE_EVIDENCE=$run/live" bash "$tools/release/live.sh" "$mode"
  else
    KINGDOWN_RELEASE_COMMIT="$commit" KINGDOWN_RELEASE_EVIDENCE="$run/live" bash "$tools/release/live.sh" "$mode" </dev/null
  fi
}
check_worktree() {
  local dir=$1 expected=${2:-} actual status
  cd -P -- "$dir" || return
  if [ ! -e .git ] || [ "$PWD" = "$main" ] || [ "$PWD" = "${tools%/tools}" ]; then
    echo "release: use a dedicated worktree at $dir" >&2
    return 1
  fi
  actual=$(git rev-parse --verify HEAD) || return
  if [ -n "$expected" ] && [ "$actual" != "$expected" ]; then
    echo "release: $dir is at $actual. Set the worktree to $expected before retrying." >&2
    return 1
  fi
  status=$(git status --porcelain --untracked-files=all) || return
  if [ -n "$status" ]; then
    echo "release: the worktree has changes at $dir" >&2
    return 1
  fi
}
frame_checks() (
  if [ "$dry" = yes ]; then
    dry_command "cwd=$live_tree" git status --porcelain --untracked-files=all
    dry_command "cwd=$live_tree" git fetch --no-tags origin "refs/pull/$pr/head"
    dry_command "cwd=$live_tree" git checkout --detach "$head"
    dry_command "cwd=$live_tree" npm ci '(with its own node_modules)'
    dry_command "cwd=$live_tree" node tools/check.mjs --gpu
    [ "${KINGDOWN_RELEASE_FAIL_STAGE:-}" != frame-checks ]
    return
  fi
  check_worktree "$live_tree" || return
  git fetch --no-tags origin "refs/pull/$pr/head" || return
  if [ "$(git rev-parse --verify FETCH_HEAD)" != "$head" ]; then
    echo 'release: the fetched PR head changed' >&2
    return 1
  fi
  git checkout -q --detach "$head" || return
  if [ -L node_modules ]; then rm node_modules || return; fi
  npm ci || return
  check_worktree "$PWD" "$head" || return
  . "$tools/release/profile.sh" || return
  unset KINGDOWN_STAGE VITE_KINGDOWN_STAGE KINGDOWN_TEST_PAGES VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY
  node tools/check.mjs --gpu | tee "$run/frame-checks.log" || return
  check_worktree "$PWD" "$head"
)
checks() (
  local dir=$1 expected=$2 origin=$3
  shift 3
  if [ "$dry" = yes ]; then
    dry_command "cwd=$dir" git rev-parse --verify HEAD "(expect $expected)"
    dry_command "cwd=$dir" git status --porcelain --untracked-files=all
    dry_command "cwd=$dir" npm ls --depth=0
    dry_command "cwd=$dir" npm ci '(if packages are missing or linked)'
    dry_command "cwd=$dir" "PLAYABLE_URL=$origin" npm run check:browser "$@"
    return
  fi
  check_worktree "$dir" "$expected" || return
  if [ -L node_modules ]; then rm node_modules || return; fi
  npm ls --depth=0 >/dev/null 2>&1 || npm ci || return
  check_worktree "$PWD" "$expected" || return
  PLAYABLE_URL="$origin" npm run check:browser "$@"
)
check_result() {
  local file="$run/$1.log"
  if [ "$(result "$1")" = skipped ]; then
    echo skipped
  elif [ -f "$file" ]; then
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
  local commit='unrecorded' published deployed='unrecorded' staged='skipped'
  [ ! -f "$run/main-commit" ] || IFS= read -r commit < "$run/main-commit"
  published=$(published_commit)
  if [ "$(result staging)" != skipped ]; then
    staged=unrecorded
    if [ -f "$run/staging.log" ]; then
      staged=$(awk '/^staging: deployment / {d=$3} END {print d ? d : "unrecorded"}' "$run/staging.log")
    fi
  fi
  if [ -f "$run/publish.log" ]; then
    deployed=$(awk '/^deploy: step / {publish=($0 == "deploy: step publish")} publish && match($0, /https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/) {d=substr($0,RSTART,RLENGTH)} END {print d ? d : "unrecorded"}' "$run/publish.log")
  fi
  append_release_log "$(printf -- '- %s | PR #%s | commit %s | published commit %s | staging %s | deploy %s | CI %s | staging alias %s | staging site %s | staging history %s | main CI %s | engines %s | publish %s | live site %s' \
    "$(date -u +%FT%TZ)" "$pr" "$commit" "${published:-unrecorded}" "$staged" "$deployed" "$(result ci)" "$(result staging)" "$(check_result staging-checks release-site)" "$(check_result staging-checks release-history)" "$(result main-ci)" "$(result engines)" "$(result publish)" "$(check_result live-check release-site)")"
}
result() {
  if [[ "$bypassed" == *" $1 "* ]]; then echo skipped; return; fi
  awk -v name="$1" '
    $1 != "release:" || $2 != name { next }
    $3 ~ /^(start|pass|failed)$/ { status=$3 }
    $3 ~ /^skip(ped)?$/ && !status { status="skipped" }
    END { print status ? status : "unrecorded" }
  ' "$progress"
}
run_stage() {
  local commit
  case "$1" in
    ci) release_ci ;;
    staging) staging_deploy ;;
    # The unsigned plugin and Muse probe reads the staging issuer from the build's staging.json.
    staging-checks) checks "$staging_tree" "$head" "$staging" release-site release-history &&
      outward node "$tools/deploy-plugin-live-check.mjs" "$staging_tree/kingdown-deploy/.vercel/output/functions/mcp.func" "$staging" ;;
    merge) merge_release ;;
    main-ci) wait_main ;;
    engines) live_step engines ;;
    publish) live_step publish ;;
    live-check) commit=$(merge_commit) && checks "$live_tree" "$commit" "$live" release-site ;;
    log) write_log ;;
  esac
}

if ! mkdir "$lock" 2>/dev/null; then
  if [ -d "$lock" ]; then
    owner=
    if [ -r "$lock/pid" ]; then IFS= read -r owner < "$lock/pid" || owner=; fi
    state='owner PID unavailable'
    if [[ "$owner" =~ ^[1-9][0-9]*$ ]]; then
      if kill -0 "$owner" 2>/dev/null; then state="PID $owner is running"; else state="PID $owner is not running"; fi
    fi
    echo "release: another run holds $lock ($state)" >&2
  else
    echo "release: could not create lock $lock" >&2
  fi
  exit 2
fi
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
printf '%s\n' "$$" > "$lock/pid"
rm -f "$progress.done"

say "progress $progress"
say "PR $pr $head from $from (tweak=$tweak, dry-run=$dry)"
case "$from" in
  ci|staging|staging-checks|merge) require_reconcile ;;
esac
started=no
for name in "${stages[@]}"; do
  [ "$name" != "$from" ] || started=yes
  if [ "$tweak" = yes ] && [[ "$name" == staging* ]]; then
    bypassed="$bypassed $name "
    say "$name skipped"
    continue
  fi
  if [ "$started" = no ]; then
    if [ "$force" = no ] && [ "$(result "$name")" != pass ]; then
      say "$name has no pass. Start at $name or use --force."
      exit 1
    fi
    if [ "$force" = yes ]; then bypassed="$bypassed $name "; fi
    say "$name skipped"
    continue
  fi
  stage=$name
  began=$SECONDS
  say "$stage start"
  if [ "$dry" = yes ]; then
    run_stage "$stage" | tee "$run/$stage.log"
    [ "${KINGDOWN_RELEASE_FAIL_STAGE:-}" != "$stage" ] || exit 1
  else
    run_stage "$stage" > "$run/$stage.log" 2>&1
    if [ "$stage" = publish ]; then verify_publish; fi
  fi
  say "$stage pass"
  say "time $stage $((SECONDS - began))s"
done
stage=
