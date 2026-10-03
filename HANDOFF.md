# Handoff — King Down Chess, 2026-10-03 (second session)

For the next agent session. Read `AGENTS.md`, then `TASKS.md` and `LESSONS.md` (project rules),
then this file. `TASKS.md` stays the record of work and owner decisions; this file says where the
work stopped and what to do next.

## Where things stand

**Pull requests** (all drafts; the owner reviews and merges, never merge yourself):

| PR | branch | what |
|---|---|---|
| [#1](https://github.com/SaarShai/king-down-chess/pull/1) | `claude/wonderful-ritchie-4cgq32` | Kings' powers mode (12 powers, balanced), the stronger power-aware computer player, the tournament tools. **Push new work here** unless the owner says otherwise. |
| [#2](https://github.com/SaarShai/king-down-chess/pull/2) | `claude/painted-motion` | Painted look: quiet moves, breathing selection, framed board |
| [#4](https://github.com/SaarShai/king-down-chess/pull/4) | `claude/perf-installable` | Faster first load, installable/offline, GitHub Pages |
| [#3](https://github.com/SaarShai/king-down-chess/pull/3) | `claude/visual-design` | Title screen, stone-and-parchment look, piece cards, move/take markers |

The PRs are **stacked**: #1 → #2 → #4 → #3. Each branch contains the one before it, joined with
merge commits (never rebase or force-push these branches). The owner authorized pushing to the
three stacked branches to keep them up to date; after every push to #1, merge it forward (below).

**Kings' powers rules:** the official readings are `POWERS_BALANCED` in `src/rules/rules.ts`; no
rule has changed since round 11. Report: `docs/research/kings-powers-balance-2026-10-02.md`
(rounds 1–12); rules text `docs/RULES.md` §4.

**Balance, rounds 11 and 12 pooled (24 armies; `sim/out/kp2-r11+kp2-r12.report.md`).** All twelve
powers 43.8–55.2% against the other powers, and **no power is clearly off centre yet**. Haste
(55.2 ± 3.4) is borderline: tested together with the other eleven it sits exactly at the band's
edge. Mercy (54.5), Flight (45.4) and Darkness (43.8) are off 50 on their own intervals only, which
with twelve powers can be chance. All four are candidates for round 13. Spirit − Shadow +1.6 ± 4.9:
no clear gap, but up to about 6 points is not ruled out. (With 12–24 armies the report uses t
quantiles; two reviews this session corrected earlier, over-confident readings.)

**Tournament runner (this session).** `--armies perPair` gives every pair its own army (1,872 in
a 24-pair round instead of 24); without it the schedule is unchanged. `report` prints intervals
resampled over armies, a screen and a simultaneous verdict for "off centre", king averages and
Spirit − Shadow, and marks partial rounds. `run` refuses to resume onto a changed schedule. Tests:
`src/sim/tournament.test.ts` (schedules of all recorded rounds and of K13 pinned).

**Kaggle (owner, 2026-10-03):** consider it for compute; see `AGENTS.md` (Compute) and
`tools/kaggle-tournament.mjs`. Token: `.secrets/kaggle_api_token` in the main checkout
(git-ignored), or `KAGGLE_API_TOKEN`. One notebook (4 CPUs) is about 1/15 of the owner's M3 Max,
and its games are identical to local ones. A private smoke notebook `saarshai/kd-smoke-s0of1`
remains in the owner's Kaggle account (harmless; delete only if the owner asks).

## What to do next (in this order)

1. **Round 13 (K13 in `docs/QUEUE.md`) needs the owner's go.** The official set on a fresh army for
   every pair, 3,744 games, about 20–30 min on the Mac's 16 cores (or split with Kaggle). Then
   pool it with rounds 11–12 and read the "tested together" line.
2. **Then ask the owner** about any power K13 confirms off centre (candidates: Haste, Mercy,
   Flight, Darkness). Readings already measured: Haste — the rulebook's two moves that may take
   (80%), second move without captures (67%), neither move takes (official; 47–57% by round);
   Flight — one use (official; 42–50%), two uses (52–58%, overshoots). New readings must not change
   how other pieces move; today's Darkness stays; the Mercy and Holy Light shelters are fine.
3. If the owner picks readings, screen them as `~v<name>` entrants with their base powers in the
   same round (they then play the same armies), and add a variant − base line to `report`.

4. **Card mode (owner, 2026-10-03, open):** action/effect cards only, no piece cards. The owner's
   idea: each player gets the same random collection (e.g. 6), each card used once. The suggestion
   given: the same open hand for both, at most one card per turn as a free action before the move,
   no card on the first move, chess-native rewrites of the original spells, and a separate mode
   from kings' powers at first. A design note with a 12-card pool was offered; wait for the owner.
   Sources: `docs/research/drive-cards.md`, the 2015 rulebook in `art-src/rules/` (image-only PDF;
   tolls are paid by pawning cards, pp. 11–15).

## Owner decisions and standing rules (also in TASKS.md)

- Kings' powers is a separate game mode; "No power" stays the default in New game.
- Light (Spirit) and dark (Shadow) kings may be somewhat stronger than the other four but must be
  balanced with each other.
- Compute: Kaggle where it helps (2026-10-03); tournaments in one session, no cloud worker
  sessions; ignore Codex/GPT. Runs need the owner's go.
- Explain results in plain, non-technical language; answer the question before doing more work.
- Commit footer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and a `Claude-Session:`
  line for the current session. No model names in commits, PRs or code.
- **Secrets:** never print or commit any API key (TypeSafe, Kaggle). The Kaggle token lives only in
  `.secrets/` (git-ignored) or the environment.

## How to run things

- **Unit tests and types:** `npx tsc --noEmit`, `npx vitest run` (about 90 s; 350+ tests on the top
  of the stack).
- **Merge forward after a push to #1** (from a worktree with `node_modules` linked):
  ```sh
  git fetch origin claude/wonderful-ritchie-4cgq32 claude/painted-motion claude/perf-installable claude/visual-design
  git checkout -B pm origin/claude/painted-motion && git merge origin/claude/wonderful-ritchie-4cgq32
  git checkout -B pi origin/claude/perf-installable && git merge pm
  git checkout -B vd origin/claude/visual-design && git merge pi
  npx tsc --noEmit && npx vitest run
  git push origin pm:claude/painted-motion pi:claude/perf-installable vd:claude/visual-design
  ```
- **Browser checks:** build and serve, then run a check (`PLAYABLE_BROWSER=chromium` in cloud
  containers, which lack the Chrome channel):
  ```sh
  npx vite build && npx vite preview --port 5189 --strictPort &
  PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-painted-game.mjs
  ```
  The checks rewrite screenshots under `docs/painted-game/`; revert them unless wanted.
- **Tournaments:** `npx tsx src/sim/tournament.ts run --id <id> --none --pairs <n> --depth 3 --seed <n>
  --armies perPair` plus one `--rule key=value` per entry of the last spec's `rules`
  (`sim/out/kp2-r12.tournament.json`; K13 in `docs/QUEUE.md` has them written out). Runs resume by
  game id. On macOS start long runs with `nohup … &`; in a cloud container with `setsid nohup … &`
  (background jobs there are stopped after 2 hours). Report: `npx tsx src/sim/tournament.ts report
  --id <id> [--id <id2> …]`. zsh does not split `$VAR` into words: spell out flags.
- **On Kaggle:** `node tools/kaggle-tournament.mjs push --id <id> --shards <n> [--first <i>] -- <run
  flags>`, then `status` and `pull` with the same `--id`. The commit must be pushed first.
- **Tournaments play the linear evaluation.** The browser's computer player uses the residual net;
  the sim never switches, so balance numbers describe the linear-evaluation engine at depth 3.
- **Raw games:** `sim/out/*.jsonl` is not versioned on the PR branches. Rounds 1–10 are on the
  `claude/kp2-results-*` shard branches; rounds 11 and 12 on `claude/kp2-results-r11-r12`. To use them:
  `git fetch origin claude/kp2-results-r11-r12 && git checkout origin/claude/kp2-results-r11-r12 -- sim/out/kp2-r11.jsonl sim/out/kp2-r12.jsonl`
  (then `git restore --staged sim/out/kp2-r11.jsonl sim/out/kp2-r12.jsonl`).
- **Shell gotchas:** do not `pkill -f` a pattern that also matches your own shell command; kill by
  PID. A `pgrep -f` wait loop can match itself.

## Other open items (see TASKS.md for the full list)

- Computer player: policy / move ordering and a bigger training corpus (`docs/research/ai-powers-2026-10-02.md`).
- Browser checks that time out in cloud containers on main's build too (slow software WebGL):
  `verify-special-moves`, `verify-cursor-adoption`, `verify-playable-clay`, `qa`.
