#!/bin/sh
# Stores the clipboard text as one secret file and never prints the value.
#
# Usage: tools/save-secret.sh [--force] NAME
#
# The file goes to the main checkout's .secrets/ folder, also when you run the copy of
# this script in a linked worktree. GATE_SECRETS_DIR replaces that folder (for tests).
# The file gets mode 600 and the folder mode 700. The script prints the name, the size
# in bytes and the first 8 hex digits of the SHA-256, then clears the clipboard.
# It refuses an empty clipboard, a name with "/" or a leading ".", and, without
# --force, a file that exists. Exit 0: saved; exit 1: refused; exit 2: bad arguments.
set -eu

usage() { echo "usage: tools/save-secret.sh [--force] NAME" >&2; exit 2; }

force=0
name=
for arg in "$@"; do
  case $arg in
    --force) force=1 ;;
    -*) usage ;;
    *) [ -z "$name" ] || usage; name=$arg ;;
  esac
done
[ -n "$name" ] || usage
case $name in
  */* | .*) echo "save-secret: the name must not hold \"/\" or start with \".\"" >&2; exit 1 ;;
esac

if [ -n "${GATE_SECRETS_DIR:-}" ]; then
  dir=$GATE_SECRETS_DIR
else
  # The common git folder is the main checkout's .git folder, also from a linked worktree.
  common=$(git -C "$(dirname "$0")" rev-parse --path-format=absolute --git-common-dir)
  dir=$(dirname "$common")/.secrets
fi
file=$dir/$name

umask 077
mkdir -p "$dir"
chmod 700 "$dir"
if [ -e "$file" ] && [ "$force" -ne 1 ]; then
  echo "save-secret: $name exists; use --force to replace it" >&2
  exit 1
fi

# Write to a temporary file in the same folder, then move it, so a refusal leaves no file.
tmp=$(mktemp "$dir/.save-secret.XXXXXX")
trap 'rm -f "$tmp"' EXIT
pbpaste > "$tmp"
size=$(wc -c < "$tmp" | tr -d ' ')
if [ "$size" -eq 0 ]; then
  echo "save-secret: the clipboard is empty; copy the key first" >&2
  exit 1
fi
hash=$(shasum -a 256 < "$tmp" | cut -c1-8)
chmod 600 "$tmp"
mv -f "$tmp" "$file"
trap - EXIT
printf '' | pbcopy
echo "saved $name: $size bytes, sha256 $hash"
