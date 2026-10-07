#!/bin/bash
# wt: set up git worktrees for this repository. Bash 3.2 and BSD tools.
#
#   wt add <branch> [<start>]  Make a worktree in the main checkout's worktrees folder, named after
#                              the last part of the branch. Use the branch if it exists, else make
#                              it from <start> (default main). Then do the package step.
#   wt add <path>              Do only the package step in an existing worktree.
#
# Package step: if the worktree's lock file is byte-equal to the main checkout's, node_modules
# becomes a link to the main checkout's packages. Else the step removes any link and runs
# `npm ci`, so the worktree gets its own installation. (`npm ci` through a link would empty the
# main checkout's folder.) The step prints one line: path, branch and `linked` or `installed`,
# with a tab between them.
set -eu

die() { echo "wt: $*" >&2; exit 1; }

# The main checkout is the folder that holds git's common folder, also from a worktree.
common=$(git rev-parse --path-format=absolute --git-common-dir) || die "not in a git repository"
main=$(dirname "$common")

packages() {
  local dir=$1 branch
  [ "$dir" != "$main" ] || die "$dir is the main checkout; it keeps its own installation"
  branch=$(git -C "$dir" symbolic-ref --short -q HEAD) || branch='(detached)'
  if [ -d "$main/node_modules" ] && cmp -s "$dir/package-lock.json" "$main/package-lock.json"; then
    if [ -L "$dir/node_modules" ] || [ ! -e "$dir/node_modules" ]; then
      ln -sfn "$main/node_modules" "$dir/node_modules"
      printf '%s\t%s\tlinked\n' "$dir" "$branch"
    else
      # An own installation stays as it is.
      printf '%s\t%s\tinstalled\n' "$dir" "$branch"
    fi
  else
    if [ -L "$dir/node_modules" ]; then rm "$dir/node_modules"; fi
    (cd "$dir" && npm ci >&2)
    printf '%s\t%s\tinstalled\n' "$dir" "$branch"
  fi
}

add() {
  [ $# -ge 1 ] && [ $# -le 2 ] || die "usage: wt add <branch> [<start>] | wt add <path>"
  local target=$1 start=${2:-main} dir
  if [ $# -eq 1 ] && [ -d "$target" ]; then
    dir=$(cd "$target" && pwd -P)
    [ "$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" = "$dir" ] || die "$target is not the top of a worktree"
    [ "$(git -C "$dir" rev-parse --path-format=absolute --git-common-dir)" = "$common" ] || die "$target is a worktree of another repository"
    packages "$dir"
    return
  fi
  dir="$main/.claude/worktrees/${target##*/}"
  if git show-ref --verify -q "refs/heads/$target"; then
    git worktree add -q "$dir" "$target" >&2
  else
    git worktree add -q -b "$target" "$dir" "$start" >&2
  fi
  packages "$dir"
}

command=${1:-}
[ $# -gt 0 ] && shift
case $command in
  add) add "$@" ;;
  *) die "usage: wt add <branch> [<start>] | wt add <path>" ;;
esac
