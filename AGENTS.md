# King Down Chess — standing instructions for any agent (Claude, Codex, OpenCode, Cursor, Antigravity)

Read `TASKS.md` (current work, owner decisions) and `LESSONS.md` (rules learned; the Jev entries) at the start of every session. Verify before you mark anything done. Do not launch runs the owner has not asked for; `docs/QUEUE.md` is launched by name.

Cloud sessions (claude.ai/code): `.claude/hooks/cloud-setup.sh` runs `npm ci` and tries to install Playwright Chromium. A cloud clone holds only Git: no raw art in `art-src/` (only its manifest), no bulk sim data, no TypeSafe key, no access to M1. Commit and push finished work; anything left only in the cloud is lost.

M1 / local models: for SSH, Remote Management, or Ollama work on M1, read `docs/LOCAL-AI-MACBOOK.md` and verify its device identity before state changes.

## Delegation — owner decision, 2026-10-06
Helpers (subagents, workflows) may be used (owner: "you may keep using helpers"); the 2026-09-22 stop is lifted. [docs/DELEGATION.md](docs/DELEGATION.md) holds the measured M1/DeepSeek capabilities and prompt templates. Runs still need the owner's go (Compute, below).

## Compute — owner decision, 2026-10-03
Before a compute task (tournaments, many game sessions, training data), think of Kaggle and the M1 beside this Mac. Runs still need the owner's go. Start a run that takes more than a few minutes detached, and watch it with a separate check: an agent's background shell stops at the shell's own timeout or at the session end, and its runs stop with it. [docs/COMPUTE.md](docs/COMPUTE.md) holds the Kaggle, M1 and power facts and the browser-check runner.

## Hosting — owner decision, 2026-10-03
The game is public at https://kingdown.dev. `tools/deploy.sh` is the only deploy path. Every deploy publishes to the world: deploy only what the owner asked to put online. A DNS change needs the owner's go. Never print or commit a file of `.secrets/`. [docs/HOSTING.md](docs/HOSTING.md) holds the site, deploy, DNS and secret-file facts.

## Jev / TypeSafe (optional, explicit)
- Client: `tools/jev.ts`, model pinned to `jev-1.13.0` (`TYPESAFE_MODEL` overrides). Key: `TYPESAFE_API_KEY` or `~/.config/typesafe/key`; never print or commit it.
- Every call carries a known-true and a known-false control; if they do not separate, the run is void.
- **A verdict is not quoted or committed after an INSTRUMENT INVALID run until a repaired spec passes.** Specs live in `docs/research/claims/`, one per report: `node tools/verify-claims.mjs docs/research/claims/*.json`.
- What passes here: claim checks against numbers, the interest rubric (`tools/jev-interest.ts`), the design-rule screen (`tools/design-screen.ts`). Advisory only, weakly calibrated: the rule-simplicity screen (`tools/rule-simplicity.ts`) and the routing rank (`tools/next-ab.ts`). What failed and must not be retried without a new design: narrative labels, fairness or game-breaking judgments, guide-text and doc triage (LESSONS.md 2026-09-16/17).
- Measurements, thresholds, adoption and taste stay in code and with the owner.

## Owner guidelines (2026-09-21)
- Value is one axis; report paralysis, conditions and interactions beside it.
- Piece balance: judge each pool piece against the six criteria the owner adopted on 2026-10-03 ([docs/research/piece-balance-criteria-2026-10-03.md](docs/research/piece-balance-criteria-2026-10-03.md); worth with `run.ts --experiment values`, the rest with `tools/piece-activity.ts`).
- Designing or changing a piece, king power, card or rule: start from [docs/MATRIX.md](docs/MATRIX.md) (ability types, the powers and cards schema, conditions, shackles, promotion) and add the new item there (owner, 2026-10-06: "a key resource for coming up with new pieces").
- All things being equal or near equal, do not change or add rules. A rule that is hard to remember is not adopted on numbers alone.
- Explain results in non-technical language when asked; answer the question before doing more work.
