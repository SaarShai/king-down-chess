#!/bin/bash
# deploy: the only path to the live site (secrets-and-public-gates/09). Bash 3.2 and BSD tools.
#
#   tools/deploy.sh             Test a fresh origin/main. Publish nothing.
#   tools/deploy.sh --publish   Test, publish the tested build, then confirm the live site.
#
# The script takes no ref. It fetches origin and makes a detached worktree of origin/main in a new
# temp folder, so a local commit that is not on origin has no effect. In that worktree it runs the
# worktree's own `tools/wt.sh add <path>` (packages), `npm test` and `npm run check:browser` (the
# browser-check runner, which builds the app into dist/). It stops at the first failure and names
# the step. It removes the worktree and its folder on every exit: pass, failure or interrupt.
#
# With --publish (secrets-and-public-gates/10), it then copies the tested dist/ into a folder named
# `kingdown`, links that folder to the Vercel project `kingdown` and deploys it to production with the
# pinned Vercel CLI. Then the worktree's own tools/deploy-live-check.mjs fetches the live site
# (DEPLOY_LIVE_URL, default https://kingdown.dev) with no cookie for up to 2 minutes: the bundle name
# and the privacy, terms and delete-data pages must match the build.
set -eu

# The pinned Vercel CLI: the last version that deployed the site (2026-10-03). npx gets its own --yes,
# because the dev-environment spec sets yes=false in .npmrc, and then npx asks before an install.
vercel=vercel@62.2.0

die() { echo "deploy: $*" >&2; exit 2; }
usage="usage: tools/deploy.sh [--publish]"

# Parse the arguments before anything changes on disk.
publish=no
if [ $# -gt 1 ]; then die "$usage"; fi
if [ $# -eq 1 ]; then
  [ "$1" = --publish ] || die "$usage"
  publish=yes
fi

top=$(git rev-parse --show-toplevel 2>/dev/null) || die "not in a git repository"

base='' dir=''
cleanup() {
  local status=$?
  trap - EXIT INT TERM HUP
  if [ -n "$base" ]; then
    cd "$top"
    # Remove the package link first, so that no removal can go through it into the main checkout.
    if [ -L "$dir/node_modules" ]; then rm "$dir/node_modules"; fi
    git worktree remove --force "$dir" >/dev/null 2>&1 || true
    rm -rf "$base"
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
# One temp folder holds the worktree (tree/) and, with --publish, the published copy (kingdown/).
base=$(mktemp -d "${TMPDIR:-/tmp}/deploy.XXXXXX")
base=$(cd "$base" && pwd -P)
dir=$base/tree
echo "deploy: worktree $dir at $commit"
step 'make worktree' git worktree add --quiet --detach "$dir" "$commit"
cd "$dir"
step 'wt add' ./tools/wt.sh add "$dir"
step 'npm test' npm test
step 'browser checks' npm run check:browser
if [ $publish = no ]; then
  echo "deploy: checks passed at $commit; published nothing (no --publish flag)"
  exit 0
fi

echo "deploy: checks passed at $commit; publishing the tested build"
site=$base/kingdown
step 'copy build' cp -R "$dir/dist" "$site"
cd "$site"
# No input: the CLI never waits for an answer.
step 'publish' npx --yes "$vercel" link --project kingdown --yes </dev/null
step 'publish' npx --yes "$vercel" deploy --prod --yes </dev/null
step 'live check' node "$dir/tools/deploy-live-check.mjs" "$site"
echo "deploy: published $commit; the live site serves it"
