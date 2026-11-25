# Tasks

The open work, one line per item: a bold title, a [label](docs/agents/triage-labels.md), the next step or question, and a link to the details. The work itself goes in a ticket in the specs folder.

## Open items

- **iOS app** · `needs-info` · Version 1.1 (build 9) is in TestFlight. Owner steps: the test, then the App Review submission. · [map](docs/specs/ios-app/map.md)
- **ChatGPT app and submission** · `needs-info` · The owner's Rescan in the portal is open. · [submission steps](docs/submission/checklist.md)
- **Web app** · `ready-for-agent` · The Daylight design is live at kingdown.dev (2026-11-19). The app and the plugin do not have the later web tweaks. Open: New game panel at 568x320 with 150% text; the `notice` case of `next-menus` is not in CI. Each change follows [the change classes](docs/CHANGES.md). · [index](docs/specs/web-build/README.md)
- **Process follow-ups** · `ready-for-agent` · Watch the `painted-game` walk timing (one flake, 2026-11-21). Groundwork: one layer state; move off the old page. · [ticket](docs/specs/ci-fast/issues/03-ci-capacity-and-ios.md)
- **Retro 2026-11-24** · `needs-info` · Owner: the four decisions of the platform seam spec. Ready: ticket 08. · [retro](docs/specs/retro-2026-11-24/retro.md)
- **Accounts and multiplayer** · `needs-info` · Pushed; the ChatGPT MVP builds on it. The 8 [report](docs/research/multiplayer-2026-10-10/README.md) decisions.
- **Card deal** · `needs-info` · The 21 released cards (Q20, owner 2026-10-11: "20. yes", including MorphP as Morph, MirrorB as Mirror, Vault as Hop) and the 4-card shared deal (owner 2026-10-09: "yes. 4 cards.") are in the build. Open (audit call 2, 2026-11-22): keep all 21 (with Curse, March and Ice Wall below 0.7 pawns in `cards-d1`), remove weak cards, or run a fresh test on today's engine? · [2026-10](docs/tasks-archive/2026-10.md)
- **Balance framework** · `needs-info` · Merged (PR #30, 2026-10-10); `npm run balance:check` guards the rule documents. The three proposed runs and the open choices in `docs/balance/FRAMEWORK.md` wait for the owner. · [spec](docs/specs/balance-framework/spec.md)
- **Frozen-piece mark** · `needs-triage` · No mark on a frozen piece. Draw one on the board (UX review, 2026-10-09). · [spec](docs/specs/web-redesign/spec.md)
- **Card mode in the game** · `ready-for-agent` · After the deal: coins by the king, power coin first (owner 2026-10-08; [ticket 24](docs/specs/web-redesign/issues/24-card-coins.md)); a legendary Rage look for the owner's yes. · [2026-10](docs/tasks-archive/2026-10.md)
- **Turn countdown** · `needs-info` · Does the owner approve the screenshots of `claude/turn-countdown` (83f442f)? · [handoff](docs/tasks-archive/HANDOFF-2026-10-06.md)
- **Criterion 4** · `needs-info` · Keep it as written (it cannot fail) or use 4b, "a phase at or above the average piece"? · [2026-10](docs/tasks-archive/2026-10.md)
- **Piece-letter icons** · `needs-info` · Should Settings → Piece letters draw icons on the figures? · [2026-10](docs/tasks-archive/2026-10.md)
- **King with no power** · `needs-info` · Draw a king picked with No power as that king? · [2026-10](docs/tasks-archive/2026-10.md)
- **Powers-mode computer player** · `ready-for-agent` · Move ordering and a bigger corpus; runs follow AGENTS.md. · [2026-10](docs/tasks-archive/2026-10.md)
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
