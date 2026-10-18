# Tasks

The open work, one line per item: a bold title, a [label](docs/agents/triage-labels.md), the next step or question, and a link to the details. The work itself goes in a ticket in the specs folder.

## Open items

- **ChatGPT plugin MVP** · `ready-for-agent` · Spec and sample approved (owner, 2026-10-11). Tickets 02 to 18 and 20 merged on `claude/chatgpt-mvp` (a4dea5d8; all checks pass on this Mac and the M1). The build is ready for the owner's test. Ticket 19 (release) waits for the owner's word; its documents are on `claude/mvp-19-prep`. · [spec](https://github.com/SaarShai/king-down-chess/blob/claude/chatgpt-mvp/docs/specs/chatgpt-mvp/spec.md)
- **Web app adaptation** · `needs-info` · Next: the route prototype. · [map](docs/specs/web-adaptation/map.md)
- **Accounts and multiplayer** · `needs-info` · Pushed; the ChatGPT MVP builds on it. The 8 [report](docs/research/multiplayer-2026-10-10/README.md) decisions.
- **After the redesign** · `needs-triage` · Done (#33 to #37, 2026-10-10); follow-ups in tickets 04 and 05. · [spec](docs/specs/after-redesign/spec.md)
- **Proving Ground, legend, web redesign** · `needs-triage` · Done and live: deployed 2026-10-11 (b661ff0d); #26 to #53. Clay parked. · [spec](docs/specs/workshop-proving-ground/spec.md)
- **Card deal** · `needs-info` · The owner chose MirrorB and dropped Mirror and Rescue (2026-10-07); Hand size: **4 cards** (owner 2026-10-09: "yes. 4 cards."; draws 12.6% at depth 4, against 11.0% with 6). Keep March (below the floor in `cards-d1`)? Which cards make the deal, and do the four new cards join it? · [2026-10](docs/tasks-archive/2026-10.md)
- **Balance framework** · `needs-info` · Merged (PR #30, 2026-10-10); `npm run balance:check` guards the rule documents. The three proposed runs and the open choices in `docs/balance/FRAMEWORK.md` wait for the owner. · [spec](docs/specs/balance-framework/spec.md)
- **Frozen-piece mark** · `needs-triage` · No mark on a frozen piece. Draw one on the board (UX review, 2026-10-09). · [spec](docs/specs/web-redesign/spec.md)
- **Card mode in the game** · `ready-for-agent` · After the deal: coins by the king, power coin first (owner 2026-10-08; [ticket 24](docs/specs/web-redesign/issues/24-card-coins.md)), MorphP in the deal; a legendary Rage look for the owner's yes. · [2026-10](docs/tasks-archive/2026-10.md)
- **Guard drop A/B** · `ready-for-agent` · `guardReserve=any` is built (PR #28). Queue the A/B against the guard next to the king, 4,000 games at depth 3, with the owner's quote (2026-10-09: "queue guard drop for testing anyway - i want the data"); a launch needs the run go. · [ticket](docs/specs/owner-decisions-2026-10-09/issues/01-build-the-decisions.md)
- **Turn countdown** · `needs-info` · Does the owner approve the screenshots of `claude/turn-countdown` (83f442f)? · [handoff](docs/tasks-archive/HANDOFF-2026-10-06.md)
- **Criterion 4** · `needs-info` · Keep it as written (it cannot fail) or use 4b, "a phase at or above the average piece"? · [2026-10](docs/tasks-archive/2026-10.md)
- **Piece-letter icons** · `needs-info` · Should Settings → Piece letters draw icons on the figures? · [2026-10](docs/tasks-archive/2026-10.md)
- **King with no power** · `needs-info` · Draw a king picked with No power as that king? · [2026-10](docs/tasks-archive/2026-10.md)
- **Powers-mode computer player** · `ready-for-agent` · Move ordering, a bigger corpus; runs need the owner's go. · [2026-10](docs/tasks-archive/2026-10.md)
- **Browser checks in the cloud** · `ready-for-agent` · `verify-special-moves`, `verify-cursor-adoption` and `qa` time out in the cloud (slow WebGL). · [handoff](docs/tasks-archive/HANDOFF-2026-10-03.md)
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
