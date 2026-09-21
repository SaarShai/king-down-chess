# King Down Chess — standing instructions for any agent (Claude, Codex, OpenCode, Cursor, Antigravity)

Read `TASKS.md` (current work, owner decisions) and `LESSONS.md` (rules learned; the Jev entries) at the start of every session. Verify before you mark anything done. Do not launch runs the owner has not asked for; `docs/QUEUE.md` is launched by name.

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
