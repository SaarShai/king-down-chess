# Claude Code hook and settings facts

Type: research
Status: resolved

## Question

What can a PreToolUse hook return (ask, deny, allow)? Does it fire for MCP tools? Can a Stop hook block a turn? Is there a worktree symlink setting? Can commit attribution be changed in settings? Needed by: checks and hooks, secrets and public gates, dev environment.

Resolved by the workflow retro-spec-facts (run wf_354ee3fb-e64); the report lands in the scratchpad facts folder and its gist is appended here.

## Answer

Source: the Claude Code docs read on 2026-10-06 (hooks, permissions, settings, worktrees, subagents). The full report is in the session scratchpad under `facts/claude-code.md`. Desktop app runs Claude Code 2.1.289; the terminal `claude` is 2.1.276.

- A PreToolUse hook returns, on exit 0, JSON with `hookSpecificOutput.permissionDecision` = `ask`, `deny` or `allow` and a `permissionDecisionReason`. `ask` shows the reason to the user in the prompt; in a `-p` run it becomes a deny. `deny` shows the reason to Claude. Exit 2 also denies, with stderr as the reason. Deny and ask permission rules still apply over an `allow`.
- MCP tools: a hook matcher and a permission rule match MCP tool names (`mcp__server`, `mcp__server__*`, `mcp__server__tool`). A settings rule cannot match an MCP argument (a URL); a hook that reads `tool_input.url` can.
- Bash prefix rules: `Bash(vercel *)` asks for `vercel ...` but not for `npx vercel ...`; each runner needs its own rule. A hook on `Bash` that searches the command for `\bvercel\b` is the strict gate.
- A Stop hook can block the end of a turn: `{"decision":"block","reason":"..."}` or exit 2. The input carries `stop_hook_active`; exit 0 when it is true. A cap of 8 continuations applies.
- SessionStart has matchers `startup`, `resume`, `clear`, `compact`, `fork`. Plain stdout on exit 0 goes into the context (10,000 characters). A `compact` hook re-injects context after compaction; PreCompact cannot add instructions.
- Settings hooks run inside subagents and workflow agents (tested: the user hook blocked a command inside a workflow agent).
- `worktree.symlinkDirectories: ["node_modules"]` exists in `.claude/settings.json` scope. The docs do not say whether the desktop app's own worktree option uses it. Gitignored files copy through `.worktreeinclude`.
- Attribution: `attribution.commit` sets the commit trailer text, `attribution.pr` the PR text, `attribution.sessionUrl` the session link. `"attribution": false` breaks settings files before 2.1.281, so use the object form. A CLAUDE.md or memory rule takes precedence over these lines.
- A worktree session reads the worktree's committed `.claude/settings.json` and the main checkout's `settings.local.json`. `$CLAUDE_PROJECT_DIR` stays at the session's root.
- `preview_start` reads `.claude/launch.json` from the folder the session started in; the docs do not say which folder a worktree session uses.
