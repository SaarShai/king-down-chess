#!/bin/bash
# deploy: the only path to the live site (secrets-and-public-gates/09). Bash 3.2 and BSD tools.
#
#   tools/deploy.sh             Test a fresh origin/main. Publish nothing.
#   tools/deploy.sh --publish   Test, then publish (secrets-and-public-gates/10 adds this step).
#
# The script takes no ref. It fetches origin and makes a detached worktree of origin/main in a new
# temp folder, so a local commit that is not on origin has no effect. In that worktree it runs the
# worktree's own `tools/wt.sh add <path>` (packages), `npm test` and `npm run check:browser` (the
# browser-check runner). It stops at the first failure and names the step. It removes the worktree
# and its folder on every exit: pass, failure or interrupt.
set -eu

die() { echo "deploy: $*" >&2; exit 2; }
usage="usage: tools/deploy.sh [--publish]"

# Parse the arguments before anything changes on disk.
publish=no
if [ $# -gt 1 ]; then die "$usage"; fi
if [ $# -eq 1 ]; then
  [ "$1" = --publish ] || die "$usage"
  publish=yes
fi
if [ $publish = yes ]; then
  die "the publish step is not built yet (secrets-and-public-gates/10); published nothing"
fi

top=$(git rev-parse --show-toplevel 2>/dev/null) || die "not in a git repository"

dir=''
cleanup() {
  local status=$?
  trap - EXIT INT TERM HUP
  if [ -n "$dir" ]; then
    cd "$top"
    # Remove the package link first, so that no removal can go through it into the main checkout.
    if [ -L "$dir/node_modules" ]; then rm "$dir/node_modules"; fi
    git worktree remove --force "$dir" >/dev/null 2>&1 || true
    rm -rf "$dir"
    git worktree prune || true
  fi
  exit $status
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

# step <name> <command ...>: run one step; stop the deploy at its failure.
step() {
  local name=$1
  shift
  echo "deploy: step $name"
  if ! "$@"; then
    echo "deploy: FAIL at $name" >&2
    exit 1
  fi
}

step 'fetch origin' git fetch --quiet origin
commit=$(git rev-parse --verify --quiet 'refs/remotes/origin/main^{commit}') || die "origin has no main branch"
dir=$(mktemp -d "${TMPDIR:-/tmp}/deploy.XXXXXX")
dir=$(cd "$dir" && pwd -P)
echo "deploy: worktree $dir at $commit"
step 'make worktree' git worktree add --quiet --detach "$dir" "$commit"
cd "$dir"
step 'wt add' ./tools/wt.sh add "$dir"
step 'npm test' npm test
step 'browser checks' npm run check:browser
echo "deploy: checks passed at $commit; published nothing (no --publish flag)"
