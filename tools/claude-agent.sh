#!/bin/bash
# claude-agent: run one Claude sub-agent on the project's API key, not on the session's sign-in.
# The key and its workspace id are in the main checkout's .secrets/ (anthropic_api_key,
# anthropic_workspace_id). The value never goes into an argument, a log or the transcript.
#
#   claude-agent <model> <dir> <prompt-file> [claude -p options...]
#
# Runs `claude -p --model <model>` in <dir> with the prompt from <prompt-file>.
# The init line of `--output-format stream-json --verbose` says "apiKeySource":"ANTHROPIC_API_KEY"
# even when the sign-in pays. The proof is a false key in the file: the run must fail.
set -eu
[ $# -ge 3 ] || { sed -n 2,10p "$0" >&2; exit 2; }
model=$1 dir=$2 prompt=$3; shift 3
main=$(git -C "$(dirname "$0")" worktree list --porcelain | sed -n '1s/^worktree //p')
# A parent Claude session (the desktop app most of all) passes its own sign-in in CLAUDE* and
# ANTHROPIC* variables, and that sign-in wins over the key. Clear them all.
for v in $(compgen -e); do case $v in CLAUDE*|ANTHROPIC*) unset "$v" ;; esac; done
ANTHROPIC_API_KEY=$(cat "$main/.secrets/anthropic_api_key")
ANTHROPIC_CUSTOM_HEADERS="anthropic-workspace-id: $(cat "$main/.secrets/anthropic_workspace_id")"
export ANTHROPIC_API_KEY ANTHROPIC_CUSTOM_HEADERS
cd "$dir"
exec claude -p --model "$model" "$@" < "$prompt"
