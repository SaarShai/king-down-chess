#!/bin/bash
# deploy: the only path to the live site (secrets-and-public-gates/09). Bash 3.2 and BSD tools.
#
#   tools/deploy.sh             Check the combined tree from a fresh origin/main. Publish nothing.
#   tools/deploy.sh --publish   Publish that tested tree to kingdown, then run both live checks.
#   tools/deploy.sh --configure <private-env-file>   Set kingdown's production server keys.
#   Legacy until the old project retires:
#   tools/deploy.sh --target plugin [--publish]   Check or publish kingdown-plugin.
#   tools/deploy.sh --setup-plugin | --configure-plugin <private-env-file>
#
# The release shell must hold no KINGDOWN_STAGE or VITE_KINGDOWN_STAGE. A website run needs the production
# VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, because the build reads both from this shell.
# No ref is accepted. A detached origin/main worktree runs npm test and the default browser checks,
# then build:vercel (with its own node_modules), the engine guards and byte record, check:vercel and
# the web journey (web-online). The ChatGPT plugin is parked (tools/chatgpt-plugin.mjs): the website
# release runs no MCP protocol or plugin UI check, and the checks expect each plugin path to answer 404.
# PLUGIN_TEST_DATABASE_URL must name a disposable loopback database ending in _test.
# A build that adds an uncommitted engine stops. KINGDOWN_ENGINES_DATABASE_URL enables the read-only
# check of engines in use; publish stops without it. Check-only mode can skip it.
#
# --publish copies the tested Build Output API tree, links the approved team and project, adds the
# content-named files of the live build that the new static tree does not have (deploy-keep-assets.mjs),
# and uses the pinned CLI with --prebuilt --prod. No website-only tree can publish to kingdown.
# Both unsigned live checks use DEPLOY_LIVE_TIMEOUT_MS (site default 180000, plugin default 120000;
# migration window 900000). The site check compares the public bytes, every file under assets/ (kept files
# too), the app routes and /api/status.
# The plugin check uses https://kingdown.dev. For a parked build it checks that each plugin path answers 404.
# Every exit removes the temporary worktree and artifact copy.
set -eu

# The pinned Vercel CLI: the last version that deployed the site (2026-10-03). npx gets its own --yes,
# because the dev-environment spec sets yes=false in .npmrc, and then npx asks before an install.
vercel=vercel@62.2.0
scope=saars-projects-2c777ec5
plugin_project_id=prj_2H4LcrzOXCQbFuKbq0z0G7lCFFC6
plugin_origin=https://kingdown-plugin.vercel.app

production_supabase_url=https://utqzovjmclfyojedmwok.supabase.co

die() { echo "deploy: $*" >&2; exit 2; }
usage="usage: tools/deploy.sh [--target website|plugin] [--publish] | --configure <private-env-file> | --setup-plugin | --configure-plugin <private-env-file>"

# Parse the arguments before anything changes on disk.
publish=no
target=website
target_set=no
setup_plugin=no
configure=''
if [ $# -eq 1 ] && [ "$1" = --setup-plugin ]; then setup_plugin=yes; target=plugin; shift; fi
if [ $# -eq 2 ]; then
  case "$1" in
    --configure|--configure-plugin)
      [ "$1" != --configure-plugin ] || target=plugin
      configure=$2; [ -n "$configure" ] || die "$usage"; shift 2 ;;
  esac
fi
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
# Production profile (staging-first-game/66): this script serves production only, so the release shell
# holds no staging setting. A staging release uses node tools/deploy-staging.mjs.
[ -z "${KINGDOWN_STAGE:-}" ] || die 'unset KINGDOWN_STAGE; production refuses staging settings (staging uses node tools/deploy-staging.mjs)'
[ -z "${VITE_KINGDOWN_STAGE:-}" ] || die 'unset VITE_KINGDOWN_STAGE; production refuses staging settings (staging uses node tools/deploy-staging.mjs)'
if [ "$target" = website ] && [ "$setup_plugin" = no ] && [ -z "$configure" ]; then
  # The website build reads both public values from this shell (src/account/public-config.ts).
  [ "${VITE_SUPABASE_URL:-}" = "$production_supabase_url" ] || die "set VITE_SUPABASE_URL=$production_supabase_url; the website build needs the production account project"
  key=${VITE_SUPABASE_PUBLISHABLE_KEY:-}
  case "$key" in sb_publishable_?*) case "${key#sb_publishable_}" in *[!A-Za-z0-9_-]*) key='' ;; esac ;; *) key='' ;; esac
  [ -n "$key" ] || die 'set VITE_SUPABASE_PUBLISHABLE_KEY to the production publishable key (sb_publishable_...)'
fi
# Only the site build gets the public values; the tests and checks run as on a clean shell.
site_env="VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-} VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY:-}"
unset VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY
if [ "$publish" = yes ]; then
  [ -n "${KINGDOWN_ENGINES_DATABASE_URL:-}" ] || die 'set KINGDOWN_ENGINES_DATABASE_URL before --publish; the engines-in-use check is required'
  # Publish checks the live games, so the engine check must read the production project, not a staging or loopback copy.
  node --input-type=module - "$(cd "$(dirname "$0")" && pwd -P)/staging-config.mjs" <<'NODE' || die 'KINGDOWN_ENGINES_DATABASE_URL must name the production Supabase database, with no PGOPTIONS, before --publish'
try {
  const { pathToFileURL } = await import('node:url');
  const { productionDatabase } = await import(pathToFileURL(process.argv[2]).href);
  productionDatabase(new URL(process.env.KINGDOWN_ENGINES_DATABASE_URL), process.env);
} catch { process.exit(2); }
NODE
fi
if [ "$setup_plugin" = no ] && [ -z "$configure" ]; then
  [ -n "${PLUGIN_TEST_DATABASE_URL:-}" ] || die 'set PLUGIN_TEST_DATABASE_URL to a disposable loopback database ending in _test'
  node --input-type=module - <<'NODE'
try {
  const db = new URL(process.env.PLUGIN_TEST_DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(db.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(db.hostname) || !db.pathname.endsWith('_test') || db.search || db.hash) throw new Error();
} catch {
  console.error('deploy: tests need a disposable loopback database ending in _test, without URL query options');
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

# The build archives a new engine in engines/; a release needs it committed on origin/main.
engines_committed() {
  local changed
  changed=$(git status --porcelain -- engines)
  [ -z "$changed" ] && return 0
  echo "deploy: commit the new engine bundle and fixture first (npm run plugin:build writes them):" >&2
  echo "$changed" >&2
  return 1
}

# Refuse a staging build, record the published bytes, and prove that every engine archive in the
# function is a committed archive with unchanged bytes.
production_artifact() {
  node --input-type=module - "$1" "$2" <<'NODE'
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const [out, target] = process.argv.slice(2);
const fail = message => { console.error(`deploy: ${message}`); process.exit(1); };
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
if (existsSync(join(out, 'staging.json'))) fail('the build carries the staging manifest; build without KINGDOWN_STAGE');
if (target === 'website') for (const name of ['static/index.html', 'static/sw.js']) {
  if (!existsSync(join(out, name))) fail(`the build has no ${name}`);
  console.log(`deploy: sha256 ${sha(join(out, name))} ${name}`);
}
const archives = dir => (existsSync(dir) ? readdirSync(dir).filter(name => name.endsWith('.mjs')).sort() : []);
const built = archives(join(out, 'functions/mcp.func/runtime/engines')), committed = archives('engines');
if (built.join() !== committed.join()) fail(`the build holds engine archives ${built.join(', ') || 'none'}; engines/ holds ${committed.join(', ') || 'none'}`);
for (const name of built) {
  const file = join(out, 'functions/mcp.func/runtime/engines', name), hash = sha(file);
  if (!readFileSync(file).equals(readFileSync(join('engines', name)))) fail(`engine archive ${name} changed`);
  console.log(`deploy: sha256 ${hash} engine archive ${name}`);
}
console.log(`deploy: ${built.length} engine archives unchanged; no staging manifest`);
NODE
}

verify_project() {
  node --input-type=module - "$1" "$2" <<'NODE'
import { readFileSync } from 'node:fs';
const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
const [name, expected] = process.argv.slice(2);
if (project.orgId !== 'team_mIlANWWDRbX1NT4jgJn9jAna' || project.projectName !== name ||
    !/^prj_[A-Za-z0-9]+$/.test(project.projectId) || (expected && project.projectId !== expected)) {
  console.error('deploy: linked project does not match the approved team and project'); process.exit(1);
}
console.log(`deploy: ${name} project ${project.projectId} in ${project.orgId}`);
NODE
}

if [ "$target" = plugin ]; then
  project=kingdown-plugin
  artifact=plugin-deploy/.vercel/output
  expected=$plugin_project_id
  origin=$plugin_origin
  kind=plugin
  publish_step='publish plugin'
  echo 'deploy: legacy kingdown-plugin path; retire it after the transition week'
else
  project=kingdown
  artifact=kingdown-deploy/.vercel/output
  expected=''
  origin=https://kingdown.dev
  kind=site
  publish_step=publish
fi

if [ "$setup_plugin" = yes ] || [ -n "$configure" ]; then
  unset VERCEL_PROJECT_ID VERCEL_ORG_ID
  base=$(mktemp -d "${TMPDIR:-/tmp}/deploy.XXXXXX")
  base=$(cd "$base" && pwd -P)
  if [ -n "$configure" ]; then
    step "validate $kind environment" node "$script_dir/deploy-plugin-env.mjs" "$configure" "$base/env" "$target"
  fi
  mkdir "$base/$project"
  cd "$base/$project"
  step "link $kind project" npx --yes "$vercel" link --project "$project" --scope "$scope" --yes </dev/null
  step "verify $kind project" verify_project "$project" "$expected"
  if [ -n "$configure" ]; then
    for value in "$base/env/"*; do
      name=${value##*/}
      echo "deploy: set production $name"
      if ! npx --yes "$vercel" env add "$name" production --force --sensitive --yes --scope "$scope" < "$value" > "$base/env-result.log" 2>&1; then
        die "failed to set production $name; CLI output is withheld to protect values"
      fi
    done
  else
    step 'inspect plugin project' npx --yes "$vercel" project inspect "$project" --scope "$scope" </dev/null
  fi
  echo "deploy: $project is linked; published nothing"
  exit 0
fi

git remote get-url origin >/dev/null 2>&1 || die 'add the GitHub remote origin (github.com/SaarShai/king-down-chess); the release builds a fresh origin/main'
github_origin() {
  case "$1" in
    https://github.com/SaarShai/king-down-chess|https://github.com/SaarShai/king-down-chess.git|git@github.com:SaarShai/king-down-chess|git@github.com:SaarShai/king-down-chess.git|ssh://git@github.com/SaarShai/king-down-chess|ssh://git@github.com/SaarShai/king-down-chess.git) return 0 ;;
  esac
  return 1
}
# The configured URL and the URL that fetch uses (after any insteadOf rewrite) must both name the one GitHub repository.
if ! github_origin "$(git config --get-all remote.origin.url)" || ! github_origin "$(git ls-remote --get-url origin)"; then
  die 'remote origin must be the GitHub repository SaarShai/king-down-chess; the release builds a fresh origin/main'
fi
# An explicit refspec, so a custom remote.origin.fetch cannot put another branch into origin/main.
step 'fetch origin' git fetch --quiet origin +refs/heads/main:refs/remotes/origin/main
commit=$(git rev-parse --verify --quiet 'refs/remotes/origin/main^{commit}') || die "origin has no main branch"
# One temp folder holds the worktree (tree/) and, with --publish, the published copy (kingdown/).
base=$(mktemp -d "${TMPDIR:-/tmp}/deploy.XXXXXX")
base=$(cd "$base" && pwd -P)
dir=$base/tree
echo "deploy: worktree $dir at $commit"
step 'make worktree' git worktree add --quiet --detach "$dir" "$commit"
cd "$dir"
step 'wt add' ./tools/wt.sh add "$dir"
# A linked node_modules writes its path into bundle comments, so the release builds with its own installation.
if [ -L node_modules ]; then
  rm node_modules
  step 'own node_modules' npm ci
fi
step 'plugin test database' npm run plugin:db:init-test
step 'npm test' npm test
if [ "$target" = website ]; then
  step 'browser checks' npm run check:browser
  # shellcheck disable=SC2086 # site_env holds two checked words without spaces.
  step 'site artifact' env $site_env npm run build:vercel
else
  step 'plugin artifact' npm run plugin:build:vercel
fi
step 'engine archive' engines_committed
step 'production artifact' production_artifact "$artifact" "$target"
if [ -n "${KINGDOWN_ENGINES_DATABASE_URL:-}" ]; then
  if [ "$publish" = yes ]; then
    step 'engines in use' node tools/engines-check.mjs --production "$artifact/functions/mcp.func/runtime/engines"
  else
    step 'engines in use' node tools/engines-check.mjs "$artifact/functions/mcp.func/runtime/engines"
  fi
else
  echo 'deploy: KINGDOWN_ENGINES_DATABASE_URL is not set; skipped the check of engines in use'
fi
if [ "$target" = website ]; then
  step 'site HTTP check' npm run check:vercel
else
  step 'plugin HTTP check' npm run plugin:server:check -- "$artifact/functions/mcp.func"
  step 'plugin worker check' npm run plugin:smoke
fi
if [ "$target" = website ]; then
  # The site build parks the ChatGPT plugin, so the website release has no plugin gate; CI still checks its source.
  # To bring it back, put the plugin protocol check and `check:browser plugin-ui plugin-ui-http` here again. The
  # legacy plugin target builds with `--chatgpt` (npm run plugin:build:vercel), so its gates test the tree it publishes.
  step 'web journey' npm run check:browser web-online
else
  step 'plugin protocol check' npm run plugin:check:protocol
  step 'plugin browser checks' npm run check:browser plugin-oauth plugin-ui plugin-ui-http
fi
if [ $publish = no ]; then
  echo "deploy: checks passed at $commit; published nothing (no --publish flag)"
  exit 0
fi

echo "deploy: checks passed at $commit; publishing the tested build"
site=$base/$project
mkdir -p "$site/.vercel"
step 'copy artifact' cp -R "$dir/$artifact" "$site/.vercel/output"
cd "$site"
unset VERCEL_PROJECT_ID VERCEL_ORG_ID
step "link $kind project" npx --yes "$vercel" link --project "$project" --scope "$scope" --yes </dev/null
step "verify $kind project" verify_project "$project" "$expected"
if [ "$target" = website ]; then
  # Only the publish copy gets the live build's content-named files under assets/; the tested tree stays
  # as built. A page of the live build can then load its own chunks after the switch.
  step 'keep live assets' node "$dir/tools/deploy-keep-assets.mjs" "$site/.vercel/output/static"
fi
step "$publish_step" npx --yes "$vercel" deploy --prebuilt --prod --scope "$scope" --yes </dev/null
if [ "$target" = website ]; then
  step 'live check' node "$dir/tools/deploy-live-check.mjs" "$site/.vercel/output/static"
fi
step 'plugin live check' node "$dir/tools/deploy-plugin-live-check.mjs" "$site/.vercel/output/functions/mcp.func" "$origin"
echo "deploy: published $commit to $project; live checks pass"
