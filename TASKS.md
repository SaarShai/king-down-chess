# Tasks

The open work, one line per item: a bold title, a [label](docs/agents/triage-labels.md), the next step or question, and a link to the details. The work itself goes in a ticket in the specs folder.

## Open items

- **Accounts and multiplayer** · `needs-info` · Accounts migration run? The 8 [report](docs/research/multiplayer-2026-10-10/README.md) decisions. Foundation: `claude/multiplayer-foundation`.
- **After the redesign** · `needs-triage` · Done (tickets 01 to 05, PRs #33 to #37, 2026-10-10): three check runs share this Mac; `main.ts` 1,348 → 210 lines. Small follow-ups wait in the Comments of tickets 04 and 05. · [spec](docs/specs/after-redesign/spec.md)
- **Proving Ground and legend** · `ready-for-agent` · Owner chose Workshop mockup A and the red-target legend (2026-10-10). Building. · [spec](docs/specs/workshop-proving-ground/spec.md)
- **Card deal** · `needs-info` · The owner chose MirrorB and dropped Mirror and Rescue (2026-10-07); Hand size: **4 cards** (owner 2026-10-09: "yes. 4 cards."; draws 12.6% at depth 4, against 11.0% with 6). Keep March (below the floor in `cards-d1`)? Which cards make the deal, and do the four new cards join it? · [2026-10](docs/tasks-archive/2026-10.md)
- **Web redesign** · `ready-for-agent` · Merged (PR #26); the polish PRs #31 and #32 merged 2026-10-10. Deploy waits for the owner. · [spec](docs/specs/web-redesign/spec.md)
- **Balance framework** · `needs-info` · Merged (PR #30, 2026-10-10); `npm run balance:check` guards the rule documents. The three proposed runs and the open choices in `docs/balance/FRAMEWORK.md` wait for the owner. · [spec](docs/specs/balance-framework/spec.md)
- **Frozen-piece mark** · `needs-triage` · No mark shows on a frozen piece. Draw one in the web board; keep the plugin default (redesign UX review, 2026-10-09). · [spec](docs/specs/web-redesign/spec.md)
- **Card mode in the game** · `ready-for-agent` · After the deal: coins by the king, the power coin first (owner, 2026-10-08; [ticket 24](docs/specs/web-redesign/issues/24-card-coins.md)), MorphP in the deal, and a legendary look for Rage for the owner's yes. · [2026-10](docs/tasks-archive/2026-10.md)
- **Guard drop A/B** · `ready-for-agent` · `guardReserve=any` is built (PR #28). Queue the A/B against the guard next to the king, 4,000 games at depth 3, with the owner's quote (2026-10-09: "queue guard drop for testing anyway - i want the data"); a launch needs the run go. · [ticket](docs/specs/owner-decisions-2026-10-09/issues/01-build-the-decisions.md)
- **Turn countdown** · `needs-info` · Does the owner approve the screenshots of `claude/turn-countdown` (83f442f)? · [handoff](docs/tasks-archive/HANDOFF-2026-10-06.md)
- **Criterion 4** · `needs-info` · Keep it as written (it cannot fail) or use 4b, "a phase at or above the average piece"? · [2026-10](docs/tasks-archive/2026-10.md)
- **Piece-letter icons** · `needs-info` · Should Settings → Piece letters draw icons on the figures? · [2026-10](docs/tasks-archive/2026-10.md)
- **King with no power** · `needs-info` · Draw a king picked with No power as that king? · [2026-10](docs/tasks-archive/2026-10.md)
- **Clay king effects** · `ready-for-agent` · The six king effects in the clay look (about one day). · [2026-10](docs/tasks-archive/2026-10.md)
- **Powers-mode computer player** · `ready-for-agent` · Move ordering and a bigger corpus; the runs need the owner's go. · [2026-10](docs/tasks-archive/2026-10.md)
- **Browser checks in the cloud** · `ready-for-agent` · `verify-special-moves`, `verify-cursor-adoption`, `verify-playable-clay` and `qa` time out in a cloud container (slow software WebGL). · [handoff](docs/tasks-archive/HANDOFF-2026-10-03.md)
- **Trailer decisions** · `needs-triage` · Music, loudness, wake readings, CTA, end card, hero poses, art rights. · [2026-09](docs/tasks-archive/2026-09.md)
- **Market suggestions** · `needs-triage` · Which of the ten to build (#9 is now the kings' powers mode)? · [2026-09](docs/tasks-archive/2026-09.md)
- **Maester beam** · `needs-triage` · The owner's review of the goggle beam capture. · [2026-09](docs/tasks-archive/2026-09.md)
- **Balance-lab leftovers** · `needs-triage` · Paladin and Maester A/Bs, kamikaze-never, double first turn; more data for the AI. · [2026-09](docs/tasks-archive/2026-09.md)
- **leadMetrics parity** · `needs-triage` · `leadMetrics()` reads the mover off ply parity, so it is wrong under a double first turn. · [2026-09](docs/tasks-archive/2026-09.md)
- **Takeover dataset** · `needs-triage` · Audit the 686 prefix, freeze the dataset, train one residual candidate. · [2026-09](docs/tasks-archive/2026-09.md)
- **Phase 2** · `needs-triage` · Card effects in the game, a stronger computer player, online play. · [2026-09](docs/tasks-archive/2026-09.md)
- **Ogre and AI plan** · `needs-triage` · The Ogre plan; then policy gate, NNUE accumulator, opening book, tablebases, skill levels. · [2026-09](docs/tasks-archive/2026-09.md)
- **Jev design screen** · `needs-triage` · The owner fills the owner column of the design screen; then the screens are gated again. · [2026-09](docs/tasks-archive/2026-09.md)

## Archive and specs

- [Tasks archive](docs/tasks-archive/): the old sections, word for word, one file per month.
- [Specs and tickets](docs/specs/): one folder per feature, with its spec and its tickets.
