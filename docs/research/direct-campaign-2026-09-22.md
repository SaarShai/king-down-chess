# Direct King Down research campaign — closed at the owner's request

The owner requested wrapping up current work, starting nothing new, and committing. The already-running Ogre batch finished and passed its audits. **13,400 full-study records are verified: 13,394 endings and six unresolved caps.** Guard and arrangement/pool studies were cancelled before launch. No optional Ogre expansion was run. The original five-workstream campaign is therefore partially completed, not fully executed.

| Workstream | Study records | Endings / caps | Status |
|---|---:|---:|---|
| Current game, evaluators and Archer | 6,600 | 6,599 / 1 | Accepted, including fixed confirmations |
| Paladin substitution | 6,000 | 5,996 / 4 | Accepted, with selected counterplay review |
| Ogre relocation | 800 | 799 / 1 | Both pilots accepted; expansion not run |
| Guard placement | 0 | 0 / 0 | Prepared; cancelled before execution |
| Arrangements and army pool | 0 | 0 / 0 | Prepared; cancelled before execution |

Separate diagnostic/operational evidence comprises 96 throughput games, three selected endgame continuations, 96 Paladin branches and 114 short Ogre continuations. These are not additional balance-study games. The earlier M1 trial's 24 capped validation records are historical and excluded.

The current Archer rule consistently shortened games by about 14 plies, while checkmate-rate and White-score changes remained inconclusive. The residual evaluator's strength depended on the time budget. [Phase 1 report](direct-campaign-phase-1-2026-09-22.md).

Paladin raised White's score more clearly against Maester than Knight. Longer searches from Black's first reply avoided the large advantages in the 24 selected opening examples; unfinished branches do not prove forced outcomes. Keep the existing rule. [Phase 2 report](direct-campaign-phase-2-2026-09-22.md).

Ogre push increased friendly shoves by 0.83 per game but reduced enemy shoves by 0.24. Its checkmate signal and uncertain White-score shift do not establish an overall better rule. The pilot remains conditional on finite-budget linear bots. No rule or roster adoption. [Phase 3 report](direct-campaign-phase-3-2026-09-22.md).

The human pack has 152 verified entry positions, rule cards, a balanced 24–36-game allocation for 8–12 real players and an empty response sheet. Nine browser checks passed. **Zero real participants or responses are recorded.** The local board remains available at `http://127.0.0.1:5186/campaign/human/play.html`; its files are in the isolated checkout's `campaign/human/` directory. Automated QA is not human play-testing.

The isolated implementation is at `/Users/za/.local/share/king-down-supervised-20260922/integration`, branch `codex/deepseek-campaign` (a historical name; delegation is stopped). Final study/evidence commit: `a252b08dc450d9da34ab60866209895da500107e`. Its `campaign/CLOSEOUT.md`, `campaign/closeout-evidence.json` and three phase evidence manifests retain counts, raw SHA-256 hashes and audit paths. Raw JSONL files remain on disk under `sim/out/`; they are intentionally ignored by Git, while reports, manifests and legal-replay evidence are committed. Legacy `.summary.json` values are not the campaign's censoring-aware inference.

Search repair `2d7e7b0` fixes the proven fairy-pawn repetition cycle, including quiescence history/state. The baseline-failing regression passes after repair; all 252 engine tests passed. Eleven campaign analysis/replay tests and campaign TypeScript checks passed. Every study batch passed source/spec/start identity, legal/event/ending replay and allocation checks; phase 2/3 contrasts were also checked with independent arithmetic. Source `b0ce8c42639c` stayed frozen. The historical 25-minute warm-state stall was not fully reconstructed.

A pre-study review also caught stale linear material values. Both evaluator arms now pin identical current parameters except the intended evaluator selection; the initial 72 old-value throughput games stay operational only. Source identity and a valid network hash alone would not have prevented that confound.

All task-owned simulation writers and queue controllers are stopped. `campaign/owner-wrapup.json` preserves the pre-stop state; `local-state.json` and `followup-queue.json` record closure and cancelled specs. M1 supervision remains paused. Earlier remote shutdown evidence is retained; closure did not perform a new remote inspection. No agents, M1 jobs, models, Jev calls, training or new studies were started during wrap-up. The main gameplay defaults and separate graphics work were preserved. Future study execution or delegation requires a new owner instruction; see [delegation guidance](../DELEGATION.md).
