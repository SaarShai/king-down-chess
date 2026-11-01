#!/bin/bash
# Live release of a fresh origin/main through tools/deploy.sh (the only deploy path, docs/HOSTING.md).
#   tools/release/live.sh check     checks and builds origin/main with tools/deploy.sh; publishes nothing
#   tools/release/live.sh engines   read-only check of the engines in use against production; publishes nothing
#   tools/release/live.sh publish   waits for green CI on origin/main (deploy.sh then skips the local test run), publishes
# The engine check reads the live games with the runtime database login from the owner's private env file
# (KINGDOWN_SECRETS_ENV). The value goes only into this process, never in an argument, a message or a log. Without the
# file, a hidden prompt asks for the URL. The publishable key is the public production value read from the live bundle.
#   KINGDOWN_RELEASE_WORKTREE  a worktree with its own node_modules (default <main checkout>/.claude/worktrees/release-live)
#   KINGDOWN_RELEASE_EVIDENCE  where the logs go (default <main checkout>/../evidence/production-release)
set -euo pipefail
mode=${1:?check, engines or publish}
tools=$(cd "$(dirname "$0")/.." && pwd -P)
main=$(dirname "$(git -C "$tools" rev-parse --path-format=absolute --git-common-dir)")
repo=${KINGDOWN_RELEASE_WORKTREE:-$main/.claude/worktrees/release-live}
evidence=${KINGDOWN_RELEASE_EVIDENCE:-$main/../evidence/production-release}
secrets=${KINGDOWN_SECRETS_ENV:-/Users/za/Documents/king down chess/.secrets/kingdown-mvp.env}
[ -d "$repo/.git" ] || [ -f "$repo/.git" ] || { echo "live: $repo is not a worktree; make it with tools/wt.sh add release-live" >&2; exit 2; }
mkdir -p "$evidence"
unset KINGDOWN_STAGE VITE_KINGDOWN_STAGE
export VITE_SUPABASE_URL=https://utqzovjmclfyojedmwok.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=$(node "$tools/release/publishable-key.mjs" https://kingdown.dev); export VITE_SUPABASE_PUBLISHABLE_KEY
export PLUGIN_TEST_DATABASE_URL=${PLUGIN_TEST_DATABASE_URL:-postgresql://kingdown_test@127.0.0.1:55432/kingdown_release_test}
engine_url() {
  local v=''
  [ -r "$secrets" ] && v=$(sed -nE 's/^[[:space:]]*(export[[:space:]]+)?KINGDOWN_PLUGIN_DATABASE_URL=//p' "$secrets" | head -n 1)
  v=${v%$'\r'}; v=${v#\"}; v=${v%\"}; v=${v#\'}; v=${v%\'}
  case "$v" in
    postgres://*|postgresql://*) KINGDOWN_ENGINES_DATABASE_URL="$v"; echo 'live: engine-check login loaded from the private env file' ;;
    *) read -r -s -p 'Engine-check URL: ' KINGDOWN_ENGINES_DATABASE_URL; printf '\n' ;;
  esac
  unset v
  export KINGDOWN_ENGINES_DATABASE_URL
}
test_database() { pg_isready -q -h 127.0.0.1 -p 55432 || { echo 'live: the local test Postgres (port 55432) is down' >&2; exit 1; }; }
git -C "$repo" fetch -q origin main
git -C "$repo" checkout -q --detach origin/main
sha=$(git -C "$repo" rev-parse HEAD)
echo "live: $mode origin/main $sha"
case "$mode" in
  check)
    test_database; cd "$repo"; tools/deploy.sh 2>&1 | tee "$evidence/check-$sha.log" ;;
  engines)
    # A node_modules link (tools/wt.sh) points at the main checkout's packages: npm ci through it would empty them.
    [ ! -L "$repo/node_modules" ] || rm "$repo/node_modules"
    npm ls --depth=0 --prefix "$repo" >/dev/null 2>&1 || npm ci --prefix "$repo"
    engine_url; cd "$repo"; node tools/engines-check.mjs engines 2>&1 | tee "$evidence/engines-$sha.log" ;;
  publish)
    test_database; engine_url
    # Green CI on this commit lets deploy.sh skip the local tests; a failed or absent CI run means the full local run.
    bash "$tools/release/ci-wait.sh" "$sha" 30 || echo 'live: CI did not pass in time; deploy.sh runs the full local checks'
    cd "$repo"; tools/deploy.sh --publish 2>&1 | tee "$evidence/deploy-$sha.log" ;;
  *) echo 'usage: tools/release/live.sh check|engines|publish' >&2; exit 2 ;;
esac
