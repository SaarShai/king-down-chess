# King Down Chess — standing instructions for any agent (Claude, Codex, OpenCode, Cursor, Antigravity)

Read `TASKS.md` (current work, owner decisions) and `LESSONS.md` (rules learned; the Jev entries) at the start of every session. Verify before you mark anything done. Do not launch runs the owner has not asked for; `docs/QUEUE.md` is launched by name.

Cloud sessions (claude.ai/code): `.claude/hooks/cloud-setup.sh` runs `npm ci` and tries to install Playwright Chromium. A cloud clone holds only Git: no raw art in `art-src/` (only its manifest), no bulk sim data, no TypeSafe key, no access to M1. Commit and push finished work; anything left only in the cloud is lost.

M1 / local models: for SSH, Remote Management, or Ollama work on M1, read `docs/LOCAL-AI-MACBOOK.md` and verify its device identity before state changes.

## Delegation policy — owner decision, 2026-09-22
Work directly in the main agent. The owner stopped delegation because its coordination and monitoring cost outweighed the benefit. Do not launch or resume subagents, OpenCode workers, Ollama agents, outsourced M1 jobs or delegation supervision from earlier campaign authorization. Delegation requires a new explicit owner instruction.

For questions about delegation, or after new authorization, read [docs/DELEGATION.md](docs/DELEGATION.md): measured M1/DeepSeek capabilities, prompt templates, acceptance checks and preserved unfinished work. This reference is not permission to delegate.

## Compute — owner decision, 2026-10-03
Before a compute task (tournaments, many game sessions, training data), consider Kaggle CPU notebooks besides this Mac. Tournaments: `node tools/kaggle-tournament.mjs push|status|pull` plays shards on Kaggle; its games are identical to local ones, so Kaggle and local shards pool in one report. One notebook has 4 CPUs, about 1/5 the speed of 4 workers on the M3 Max (measured) and so about 1/15 of the whole Mac: it pays as extra capacity beside the Mac or while the Mac is busy. Token: `KAGGLE_API_TOKEN`, or `.secrets/kaggle_api_token` in the main checkout (git-ignored); never print or commit it. Runs still need the owner's go.

## Jev / TypeSafe (optional, explicit)
- Client: `tools/jev.ts`, model pinned to `jev-1.13.0` (`TYPESAFE_MODEL` overrides). Key: `TYPESAFE_API_KEY` or `~/.config/typesafe/key`; never print or commit it.
- Every call carries a known-true and a known-false control; if they do not separate, the run is void.
- **A verdict is not quoted or committed after an INSTRUMENT INVALID run until a repaired spec passes.** Specs live in `docs/research/claims/`, one per report: `node tools/verify-claims.mjs docs/research/claims/*.json`.
- What passes here: claim checks against numbers, the interest rubric (`tools/jev-interest.ts`), the design-rule screen (`tools/design-screen.ts`). Advisory only, weakly calibrated: the rule-simplicity screen (`tools/rule-simplicity.ts`) and the routing rank (`tools/next-ab.ts`). What failed and must not be retried without a new design: narrative labels, fairness or game-breaking judgments, guide-text and doc triage (LESSONS.md 2026-09-16/17).
- Measurements, thresholds, adoption and taste stay in code and with the owner.

## Owner guidelines (2026-09-21)
- Value is one axis; report paralysis, conditions and interactions beside it.
- All things being equal or near equal, do not change or add rules. A rule that is hard to remember is not adopted on numbers alone.
- Explain results in non-technical language when asked; answer the question before doing more work.
