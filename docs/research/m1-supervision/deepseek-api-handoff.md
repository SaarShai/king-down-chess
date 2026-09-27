# DeepSeek API delegation handoff — 2026-09-22

> **Delegation stopped by owner — 2026-09-22.** Workers and the task-owned API server are inactive; recurring supervision is paused. This document retains historical instructions/evidence, not authorization to restart. Current policy and future-use prompt guidance: [DELEGATION.md](../../DELEGATION.md). Studies remain unfinished.

Owner direction: DeepSeek V4.1 Flash subagents through OpenCode API do the remaining source/design work; Codex manages and independently reviews; M1 executes prescribed jobs. This is explicitly authorized cloud delegation, superseding the old restriction for these agents. No cloud credential was copied to M1. All five study budgets/gates and pending real-human sessions remain unchanged.

## Live control

Control root: `/Users/za/.local/share/king-down-supervised-20260922`.

- `agents.json`: exact child IDs, parent ID, worktrees, saved prompts and launch times.
- `parent-session.json`: API parent session (organizational only; Codex is the supervisor).
- `api-server.json`: dedicated loopback OpenCode 1.18.32 server PID/URL, currently port 4099.
- `api.py`: authenticated API client; reads private mode-0600 `api-auth.json`. Never print/copy the password or provider keys. Provider authentication uses the owner's existing local OpenCode setup.
- `openapi.json`: documentation returned by this running API.
- `status.py`: reads latest message metadata, tool actions, diffs and artifact metadata; saves `last-status.json`. It omits reasoning text. Run `python3 /Users/za/.local/share/king-down-supervised-20260922/status.py`.
- `api-server.log`: durable server output. Server detached from this shell; do not duplicate it if already healthy.

Exact model `opencode-go/deepseek-v4.1-flash` was verified in the connected provider inventory and in actual assistant messages with completed tool calls for all three child sessions. Each worktree explicitly sets this model for build and small_model and enables only opencode-go. Worktree-specific config disables further delegation and network tools; it is a scope aid, not a security sandbox. Never silently replace the model.

## Source and ownership

The M1 Git bundle transfer was slow; it was stopped after an equivalent local baseline was verified. Local integration is a separate clone of local commit a9b6b630, with the exact four accepted M1 patches applied. Local baseline `aa1efa3f69dd0ab95ad27074b34961a1a93a0006` has a different history from M1 `c3393615a6eb11db21c6b7fd50e4eda471f300a2`, but the complete `src`, `tools`, package and TypeScript configuration trees compare exactly. Source identity is `3545663dcf97` in both. Tree evidence is saved in `baseline-source-trees.txt`. Do not claim identical commit IDs.

Integration clone: `<control>/integration`, branch `codex/deepseek-campaign`.
Separate worktrees:

- `provenance`: owns tools/conditions.ts, tools/conditions.test.ts, campaign/provenance-report.md. Validate intra-file identities, reject incompatible sources, qualify intended cross-arm spec/rules differences and missing legacy provenance. Preserve prior arithmetic/start/sparse regressions.
- `search`: owns src/ai/search.ts, focused search tests, campaign/search-stall-report.md and bounded reproducers. Require an actual legal failing regression and before/after evidence. Negative qdepth is a candidate mechanism, not proven historical attribution. No stand-pat in check; no random/unbounded batches.
- `protocol`: owns only phase-1 protocol/setup/spec/verification files listed in its prompt. At least 80 explicit legal setups, exact rules, pairing, prespecified outcomes/uncertainty/budgets, residual-runtime proof, proposed throughput/confirmation settings. No campaign games; do not invent weights or human evidence.

Worktrees have compact supervisor-written AGENTS/TASKS/LESSONS and opencode.json plus node_modules symlinks. These administrative differences predate workers; do not integrate them. Workers may commit only owned files. Existing four campaign acceptance artifacts also predate launch. Compare actual source/spec edits and new report paths, not the mere presence of campaign files. Saved prompts are the acceptance contracts.

## Supervision and acceptance

Every four minutes compare API message progress, actual diffs/new artifacts and errors. A running or finished model is not an accepted deliverable. Preserve evidence before correcting/stopping; do not duplicate live writers. Do not overwrite an agent's work while it is running. After it stops, read the diff/report, run independent meaningful checks, and return concrete corrections to the same session if necessary.

Use `api.call('POST', '/session/'+session_id+'/prompt_async', {'model': {'providerID': 'opencode-go', 'modelID': 'deepseek-v4.1-flash'}, 'agent': 'build', 'parts': [{'type': 'text', 'text': correction}]}, directory=worktree)` for the next reviewed turn. API helper and installed OpenAPI are authoritative. Check current state before posting so turns are not accidentally duplicated. Only abort a known task session when concrete stalled/off-task evidence warrants it; preserve state first.

Integrate accepted owned-file commits into the isolated integration clone, resolve only actual overlap, then transfer exact accepted patches to the isolated M1 branch. Verify M1 identity before changes; no source changes during a live job. Source-changing fixes require fresh source/run identities and regression/replay checks before campaigns. Run prescribed M1 jobs with durable logs/PIDs; initially at most two simulation workers, no local inference contention. No production/main adoption or unrelated graphics work.

The initial M1 prescribed full regression finished at c339361: TypeScript exit 0, 230 tests in 9 files passed, 81.5 seconds. Evidence: `../m1-results/full-regression-20260922/`. Memory snapshot showed 91% free. Game counts remain 0 balance-study games and 24 earlier 40-ply capped validation games; do not count validation as rules evidence. M1 is available for the next reviewed job once prerequisites are accepted.

Continue bounded DeepSeek assignments after these gates to finish all five studies and human pack. Keep actual human sessions pending. Quiet progress notifications; meaningful failures/completion/action only. Pause recurring supervision only after verified automated work is reported and only real-human input remains.

## First accepted DeepSeek output

Provenance accepted after reviewer corrections: agent commit a365c980; isolated local integration ffd78f0; M1 2109d67f6daebc2e7ebc543bd7778964b51f337f. All 14 independent CLI scenarios pass, plus M1 TypeScript and 74 targeted tests. Five remote evidence artifacts are hash-verified in `../m1-results/provenance-accepted/`. Source identity is unchanged because this modifies analysis only. Provenance session is idle/accepted; search and protocol continuation sessions remain active and require independent review. The search and protocol agents reached their 40-step limits after producing useful evidence/artifacts; focused continuation prompts are saved, so continue those sessions rather than restarting discovery.
