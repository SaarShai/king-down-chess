#!/bin/bash
# wt: set up git worktrees for this repository. Bash 3.2 and BSD tools.
#
#   wt add <branch> [<start>]  Make a worktree in the main checkout's worktrees folder, named after
#                              the last part of the branch. Use the branch if it exists, else make
#                              it from <start> (default main). Then do the package step.
#   wt add <path>              Do only the package step in an existing worktree.
#   wt prune [--apply]         Run `git worktree prune`, then print one line per worktree: path,
#                              verdict (`safe` or `keep`) and the reason, with a tab between them.
#                              With --apply, remove each safe worktree with `git worktree remove`
#                              (never with force; its verdict becomes `removed`). No branch goes.
#
# Safe means all of: not the main checkout and not the current worktree; not locked; index and HEAD
# unchanged for 24 hours; an empty `git status`; no ignored file except node_modules, dist and
# .DS_Store; HEAD is an ancestor of main.
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

# Prints why the worktree at $1 must stay, or nothing when it is safe. $2 is yes when it is locked.
keep_reason() {
  local dir=$1 locked=$2 gitdir status line path
  if [ "$dir" = "$main" ]; then echo "main checkout"; return; fi
  if [ "$dir" = "$here" ]; then echo "current worktree"; return; fi
  if [ "$locked" = yes ]; then echo "locked"; return; fi
  [ -d "$dir" ] || { echo "folder missing"; return; }
  gitdir=$(git -C "$dir" rev-parse --absolute-git-dir 2>/dev/null) || { echo "not a git worktree"; return; }
  if [ -n "$(find "$gitdir/index" "$gitdir/HEAD" -mmin -1440 2>/dev/null)" ]; then
    echo "index or HEAD changed in the last 24 hours"; return
  fi
  # --no-optional-locks: git status must not write the index, or the next run sees recent work.
  status=$(git --no-optional-locks -C "$dir" status --porcelain --ignored=matching) || { echo "git status failed"; return; }
  while IFS= read -r line; do
    case $line in
      '') ;;
      '!! '*)
        path=${line#'!! '}
        path=${path%/}
        case ${path##*/} in
          node_modules | dist | .DS_Store) ;;
          *) echo "ignored file: $path"; return ;;
        esac ;;
      *) echo "changes: ${line#???}"; return ;;
    esac
  done <<EOF
$status
EOF
  git -C "$dir" merge-base --is-ancestor HEAD refs/heads/main 2>/dev/null || { echo "commits not on main"; return; }
}

prune() {
  local apply=no list line dir='' locked=no reason
  [ $# -le 1 ] || die "usage: wt prune [--apply]"
  case ${1:-} in
    '') ;;
    --apply) apply=yes ;;
    *) die "usage: wt prune [--apply]" ;;
  esac
  git worktree prune
  here=$(git rev-parse --show-toplevel) && here=$(cd "$here" && pwd -P)
  list=$(git worktree list --porcelain)
  # Each record is a `worktree <path>` line, more lines, and an empty line. Add one more empty line
  # so that the last record also ends.
  while IFS= read -r line; do
    case $line in
      'worktree '*) dir=${line#worktree }; locked=no ;;
      locked | 'locked '*) locked=yes ;;
      '')
        [ -n "$dir" ] || continue
        if [ -d "$dir" ]; then dir=$(cd "$dir" && pwd -P); fi
        reason=$(keep_reason "$dir" "$locked")
        if [ -n "$reason" ]; then
          printf '%s\tkeep\t%s\n' "$dir" "$reason"
        elif [ $apply = no ]; then
          printf '%s\tsafe\tclean, on main, idle for 24 hours\n' "$dir"
        elif git worktree remove "$dir" >&2; then
          printf '%s\tremoved\tclean, on main, idle for 24 hours\n' "$dir"
        else
          printf '%s\tkeep\tgit worktree remove refused\n' "$dir"
        fi
        dir='' ;;
    esac
  done <<EOF
$list

EOF
}

command=${1:-}
[ $# -gt 0 ] && shift
case $command in
  add) add "$@" ;;
  prune) prune "$@" ;;
  *) die "usage: wt add <branch> [<start>] | wt add <path> | wt prune [--apply]" ;;
esac
