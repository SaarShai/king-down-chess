#!/bin/bash
# push-main: push a commit of main to origin from a clean detached worktree. Bash 3.2 and BSD tools.
#
#   tools/push-main.sh [--dry-run] [<commit>]    (default: HEAD)
#
# --dry-run does everything but the send: the hook still runs npm test and the gate in the worktree.
#
# The pre-push hook refuses a push while a tracked file differs from HEAD, because npm test would not
# run on the commit that goes out. When another session's uncommitted edits sit in the main checkout,
# this script checks the commit out in a worktree under the system's temporary folder, links the
# packages, pushes from there (the hook runs its tests in that worktree) and removes the worktree.
# The commit must be on the local main branch; a branch goes out from its own worktree.
set -eu

die() { echo "push-main: $*" >&2; exit 1; }

dry=
if [ "${1:-}" = --dry-run ]; then dry=--dry-run; shift; fi
[ $# -le 1 ] || die "usage: tools/push-main.sh [--dry-run] [<commit>]"
common=$(git rev-parse --path-format=absolute --git-common-dir) || die "not in a git repository"
main=$(dirname "$common")
sha=$(git rev-parse --verify -q "${1:-HEAD}^{commit}") || die "${1:-HEAD} is not a commit"
git merge-base --is-ancestor "$sha" refs/heads/main || die "$sha is not on the local main branch"

parent=$(mktemp -d "${TMPDIR:-/tmp}/kingdown-push.XXXXXX")
dir="$parent/w"
cleanup() { git worktree remove --force "$dir" >/dev/null 2>&1 || true; rm -rf "$parent"; }
trap cleanup EXIT
[ -d "$main/node_modules" ] || die "the main checkout has no node_modules; run npm ci there"
git worktree add -q --detach "$dir" "$sha"
ln -s "$main/node_modules" "$dir/node_modules"
git -C "$dir" push $dry origin "HEAD:refs/heads/main"
