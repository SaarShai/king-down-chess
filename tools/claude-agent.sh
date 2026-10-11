#!/bin/bash
# claude-agent: run one Claude sub-agent on the project's API key, not on the session's sign-in.
# The key and its workspace id are in the main checkout's .secrets/ (anthropic_api_key,
# anthropic_workspace_id). The value never goes into an argument, a log or the transcript.
#
#   claude-agent <model> <dir> <prompt-file> [claude -p options...]
#
# Runs `claude -p --model <model>` in <dir> with the prompt from <prompt-file>.
# Check the key with `--output-format stream-json --verbose`: the init line says
# "apiKeySource":"ANTHROPIC_API_KEY".
set -eu
[ $# -ge 3 ] || { sed -n 2,10p "$0" >&2; exit 2; }
model=$1 dir=$2 prompt=$3; shift 3
main=$(git -C "$(dirname "$0")" worktree list --porcelain | sed -n '1s/^worktree //p')
ANTHROPIC_API_KEY=$(cat "$main/.secrets/anthropic_api_key")
ANTHROPIC_CUSTOM_HEADERS="anthropic-workspace-id: $(cat "$main/.secrets/anthropic_workspace_id")"
export ANTHROPIC_API_KEY ANTHROPIC_CUSTOM_HEADERS
unset ANTHROPIC_AUTH_TOKEN CLAUDE_CODE_OAUTH_TOKEN CLAUDECODE
cd "$dir"
exec claude -p --model "$model" "$@" < "$prompt"
