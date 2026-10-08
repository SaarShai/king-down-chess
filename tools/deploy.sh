#!/bin/bash
# deploy: the only path to the live site (secrets-and-public-gates/09). Bash 3.2 and BSD tools.
#
#   tools/deploy.sh             Test a fresh origin/main. Publish nothing.
#   tools/deploy.sh --publish   Test, publish the tested build, then confirm the live site.
#   tools/deploy.sh --target plugin [--publish]   Check or publish the separate plugin.
#   tools/deploy.sh --setup-plugin   Link the empty plugin project. Publish nothing.
#   tools/deploy.sh --configure-plugin <private-env-file>   Set its production environment.
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
plugin_scope=saars-projects-2c777ec5
plugin_project_id=prj_2H4LcrzOXCQbFuKbq0z0G7lCFFC6
plugin_origin=https://kingdown-plugin.vercel.app

die() { echo "deploy: $*" >&2; exit 2; }
usage="usage: tools/deploy.sh [--target website|plugin] [--publish] | --setup-plugin | --configure-plugin <private-env-file>"

# Parse the arguments before anything changes on disk.
publish=no
target=website
target_set=no
setup_plugin=no
configure_plugin=''
if [ $# -eq 1 ] && [ "$1" = --setup-plugin ]; then setup_plugin=yes; shift; fi
if [ $# -eq 2 ] && [ "$1" = --configure-plugin ]; then configure_plugin=$2; [ -n "$configure_plugin" ] || die "$usage"; shift 2; fi
while [ $# -gt 0 ]; do
  case "$1" in
    --publish) [ "$publish" = no ] || die "$usage"; publish=yes; shift ;;
    --target)
      [ "$target_set" = no ] && [ $# -ge 2 ] || die "$usage"
      case "$2" in website|plugin) target=$2 ;; *) die "$usage" ;; esac
      target_set=yes; shift 2 ;;
    *) die "$usage" ;;
  esac
done
if [ "$target" = plugin ]; then
  [ -n "${PLUGIN_TEST_DATABASE_URL:-}" ] || die 'set PLUGIN_TEST_DATABASE_URL to a disposable loopback database ending in _test'
  node --input-type=module - <<'NODE'
try {
  const db = new URL(process.env.PLUGIN_TEST_DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(db.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(db.hostname) || !db.pathname.endsWith('_test') || db.search || db.hash) throw new Error();
} catch {
  console.error('deploy: plugin tests need a disposable loopback database ending in _test, without URL query options');
  process.exit(2);
}
NODE
fi

top=$(git rev-parse --show-toplevel 2>/dev/null) || die "not in a git repository"
script_dir=$(cd "$(dirname "$0")" && pwd -P)

base='' dir=''
cleanup() {
  local status=$?
  trap - EXIT INT TERM HUP
  if [ -n "$base" ]; then
    cd "$top"
    # Remove the package link first, so that no removal can go through it into the main checkout.
    if [ -n "$dir" ]; then
      if [ -L "$dir/node_modules" ]; then rm "$dir/node_modules"; fi
      git worktree remove --force "$dir" >/dev/null 2>&1 || true
    fi
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

verify_plugin_project() {
  node --input-type=module - "$1" <<'NODE'
import { readFileSync } from 'node:fs';
const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
const expected = process.argv[2];
if (project.orgId !== 'team_mIlANWWDRbX1NT4jgJn9jAna' || project.projectName !== 'kingdown-plugin' ||
    !/^prj_[A-Za-z0-9]+$/.test(project.projectId) || (expected && project.projectId !== expected)) {
  console.error('deploy: linked plugin project does not match the approved team and project'); process.exit(1);
}
console.log(`deploy: plugin project ${project.projectId} in ${project.orgId}`);
NODE
}

if [ "$setup_plugin" = yes ] || [ -n "$configure_plugin" ]; then
  unset VERCEL_PROJECT_ID VERCEL_ORG_ID
  base=$(mktemp -d "${TMPDIR:-/tmp}/deploy.XXXXXX")
  base=$(cd "$base" && pwd -P)
  if [ -n "$configure_plugin" ]; then
    step 'validate plugin environment' node "$script_dir/deploy-plugin-env.mjs" "$configure_plugin" "$base/env"
  fi
  mkdir "$base/kingdown-plugin"
  cd "$base/kingdown-plugin"
  step 'link plugin project' npx --yes "$vercel" link --project kingdown-plugin --scope "$plugin_scope" --yes </dev/null
  step 'verify plugin project' verify_plugin_project "$plugin_project_id"
  if [ -n "$configure_plugin" ]; then
    for name in KINGDOWN_PLUGIN_ORIGIN SUPABASE_URL SUPABASE_PUBLISHABLE_KEY KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS KINGDOWN_PLUGIN_DATABASE_URL KINGDOWN_PLUGIN_OAUTH_READY; do
      echo "deploy: set production $name"
      if ! npx --yes "$vercel" env add "$name" production --force --sensitive --yes --scope "$plugin_scope" < "$base/env/$name" > "$base/env-result.log" 2>&1; then
        die "failed to set production $name; CLI output is withheld to protect values"
      fi
    done
  else
    step 'inspect plugin project' npx --yes "$vercel" project inspect kingdown-plugin --scope "$plugin_scope" </dev/null
  fi
  echo 'deploy: plugin project is linked; published nothing'
  exit 0
fi

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
if [ "$target" = plugin ]; then step 'plugin test database' npm run plugin:db:init-test; fi
step 'npm test' npm test
if [ "$target" = website ]; then
  step 'browser checks' npm run check:browser
else
  step 'plugin artifact' npm run plugin:build:vercel
  step 'plugin HTTP check' npm run plugin:server:check -- plugin-deploy/.vercel/output/functions/mcp.func
  step 'plugin worker check' npm run plugin:smoke
  step 'plugin protocol check' npm run plugin:check:protocol
  step 'plugin browser checks' npm run check:browser plugin-oauth plugin-ui plugin-ui-http
fi
if [ $publish = no ]; then
  echo "deploy: checks passed at $commit; published nothing (no --publish flag)"
  exit 0
fi

echo "deploy: checks passed at $commit; publishing the tested build"
if [ "$target" = plugin ]; then
  [ -n "$plugin_project_id" ] && [ -n "$plugin_origin" ] || die 'pin the approved plugin project and origin before publication'
  site=$base/kingdown-plugin
  mkdir -p "$site/.vercel"
  step 'copy plugin artifact' cp -R "$dir/plugin-deploy/.vercel/output" "$site/.vercel/output"
  cd "$site"
  unset VERCEL_PROJECT_ID VERCEL_ORG_ID
  step 'link plugin project' npx --yes "$vercel" link --project kingdown-plugin --scope "$plugin_scope" --yes </dev/null
  step 'verify plugin project' verify_plugin_project "$plugin_project_id"
  step 'publish plugin' npx --yes "$vercel" deploy --prebuilt --prod --scope "$plugin_scope" --yes </dev/null
  step 'plugin live check' node "$dir/tools/deploy-plugin-live-check.mjs" "$site/.vercel/output/functions/mcp.func" "$plugin_origin"
  echo "deploy: published plugin $commit; unsigned live checks pass"
  exit 0
fi
site=$base/kingdown
step 'copy build' cp -R "$dir/dist" "$site"
step 'copy consent route' cp "$dir/vercel.json" "$site/vercel.json"
cd "$site"
# No input: the CLI never waits for an answer.
step 'publish' npx --yes "$vercel" link --project kingdown --yes </dev/null
step 'publish' npx --yes "$vercel" deploy --prod --yes </dev/null
step 'live check' node "$dir/tools/deploy-live-check.mjs" "$site"
echo "deploy: published $commit; the live site serves it"
