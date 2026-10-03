# Handoff — King Down Chess, 2026-10-03

For the next agent session. Read `AGENTS.md`, then `TASKS.md` and `LESSONS.md` (project rules),
then this file. `TASKS.md` stays the record of work and owner decisions; this file says where the
work stopped and what to do next.

## Where things stand

**Pull requests** (all drafts; the owner reviews and merges, never merge yourself):

| PR | branch | what |
|---|---|---|
| [#1](https://github.com/SaarShai/king-down-chess/pull/1) | `claude/wonderful-ritchie-4cgq32` | Kings' powers mode (12 powers, balanced), the stronger power-aware computer player, today's fixes. **This session's branch: push only here** unless the owner says otherwise. |
| [#2](https://github.com/SaarShai/king-down-chess/pull/2) | `claude/painted-motion` | Painted look: quiet moves, breathing selection, framed board |
| [#4](https://github.com/SaarShai/king-down-chess/pull/4) | `claude/perf-installable` | Faster first load, installable/offline, GitHub Pages |
| [#3](https://github.com/SaarShai/king-down-chess/pull/3) | `claude/visual-design` | Title screen, stone-and-parchment look, piece cards, move/take markers |

The PRs are **stacked**: #1 → #2 → #4 → #3. Each branch contains the one before it, joined with
merge commits (never rebase or force-push these branches). The owner authorized pushing to the
three stacked branches to keep them up to date.

**Kings' powers rules:** the official readings are `POWERS_BALANCED` in `src/rules/rules.ts`; no
rule has changed since round 11. The report is `docs/research/kings-powers-balance-2026-10-02.md`
(rounds 1–12), the rules text `docs/RULES.md` §4.

**Latest balance result (round 12, 2026-10-03).** Each tournament round uses only 12 random armies
(one per pair slot, reused by all 78 matchups), and a power's strength depends on the army, so a
single round's per-game intervals (±5.5) are too narrow; resampled over armies they are ±4–10.
Pooled over rounds 11 and 12 (24 armies): all twelve powers 43.8–55.2% against the other powers;
only Haste (55.2 ± 3.1) and Flight (45.4 ± 3.7) are clearly off centre. Mercy (54.5 ± 5.1) needs no
change. Spirit's powers average 50.5, Shadow's 48.9 (the owner wants these two kings level with
each other; they may be a little stronger than the rest).

## What to do next (in this order)

1. **Bring the stacked PRs up to date.** PR #1 has commits that #2/#4/#3 do not yet have (everything
   on `claude/wonderful-ritchie-4cgq32` after `ee3fdec`). Merge forward, one branch at a time:
   ```sh
   git fetch origin claude/wonderful-ritchie-4cgq32 claude/painted-motion claude/perf-installable claude/visual-design
   git worktree add ../stack origin/claude/painted-motion && cd ../stack && ln -s ../king-down-chess/node_modules node_modules
   git checkout -B pm origin/claude/painted-motion && git merge origin/claude/wonderful-ritchie-4cgq32
   git checkout -B pi origin/claude/perf-installable && git merge pm
   git checkout -B vd origin/claude/visual-design && git merge pi
   npx tsc --noEmit && npx vitest run          # on vd: expect all tests to pass (344+ on 2026-10-03)
   git push origin pm:claude/painted-motion pi:claude/perf-installable vd:claude/visual-design
   ```
   If TASKS.md or LESSONS.md conflict, keep both sides' entries.
2. **Update PR #1's description** with this session's changes: round 12 and the army finding; the
   power picker fix (it showed the rulebook counts, e.g. Freeze "2 per game", before any powers
   game; a powers game gives one); the evaluation now rounds each king's phase blend so mirrored
   positions score exactly alike; the finished-game case in `tools/verify-painted-game.mjs`; the
   report wording fixes (Death Touch, Ogre).
3. **Make the tournament runner measure more armies.** In `src/sim/tournament.ts` the job list
   uses `armies[p]` / `seeds[p]` for every matchup. Options: more pairs per matchup (more armies,
   same design), or a fresh army per pair (loses common random numbers between matchups). Also
   make `report` print intervals resampled over armies next to the per-game ones. Code changes are
   fine; **new tournament runs need the owner's go** (AGENTS.md: "Do not launch runs the owner has
   not asked for").
4. **Ask the owner** whether to try a small Haste trim and/or a Flight boost (the only two powers
   clearly off centre). The report lists readings already measured for each power. The owner's
   limits: no readings that change how other pieces move; today's Darkness stays; the Mercy and
   Holy Light shelters are fine.

## Owner decisions and standing rules (also in TASKS.md)

- Kings' powers is a separate game mode; "No power" stays the default in New game.
- Light (Spirit) and dark (Shadow) kings may be somewhat stronger than the other four but must be
  balanced with each other.
- Compute: run tournaments in one session (no cloud worker sessions); ignore Codex/GPT.
- Explain results in plain, non-technical language; answer the question before doing more work.
- Commit footer used on this branch:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and a `Claude-Session:` line for the
  current session. No model names in commits, PRs or code.
- **Secrets:** never print, write or commit any API key (TypeSafe key, Kaggle key). The owner pasted
  a Kaggle key in chat on 2026-10-02; they were asked to revoke it, add a new one as the environment
  variable `KAGGLE_API_TOKEN` in the environment settings, and allow kaggle.com in the network
  policy. Until then kaggle.com (and OpenAI hosts) are blocked by the proxy.

## How to run things here

- **Unit tests and types:** `npx tsc --noEmit`, `npx vitest run` (about 90 s; 344 tests on the top
  of the stack).
- **Browser checks:** build and serve, then run a check with the bundled Chromium (the Chrome
  channel is not installed in cloud containers):
  ```sh
  npx vite build && npx vite preview --port 5189 --strictPort &
  PLAYABLE_URL=http://127.0.0.1:5189/ PLAYABLE_BROWSER=chromium node tools/verify-painted-game.mjs
  ```
  The checks rewrite screenshots under `docs/painted-game/`; revert them unless the change is
  wanted (`git checkout -- docs/painted-game`). For your own Playwright scripts use
  `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`; run them from inside the repo
  so `playwright` resolves.
- **Tournaments:** the spec of the last round is `sim/out/kp2-r12.tournament.json`. To run one:
  `npx tsx src/sim/tournament.ts run --id <id> --none --pairs 12 --depth 3 --seed <n>` plus one
  `--rule key=value` per entry of that spec's `rules`. 1,872 games take about 64 minutes on the
  container's 4 cores and use all of them. Runs resume by game id: start long runs with
  `setsid nohup … &` (background jobs are stopped after 2 hours) and re-run the same command to
  continue. Report: `npx tsx src/sim/tournament.ts report --id <id> [--id <id2> …]`.
- **Tournaments play the linear evaluation.** The browser's computer player uses the residual net
  (`src/ai/worker.ts` calls `setEvaluator('residual')`); the sim never switches, so balance numbers
  describe the linear-evaluation engine at depth 3.
- **Army-resampled intervals** (until `report` does this): the round-12 numbers came from this
  script (game records are `sim/out/<id>.jsonl`; `result` is White's score):
  ```python
  import json, random, collections
  random.seed(7)
  def intervals(files, B=2000):
      by = collections.defaultdict(lambda: collections.defaultdict(lambda: [0.0, 0]))
      for fi, f in enumerate(files):
          for line in open(f):
              g = json.loads(line)
              if 'none' in (g['a'], g['b']): continue
              sc = {g['white']: g['result'], g['black']: 1 - g['result']}
              for p in (g['a'], g['b']):
                  c = by[p][(fi, g['backRank'])]; c[0] += sc[p]; c[1] += 1
      armies = sorted({a for p in by for a in by[p]})
      for p in sorted(by):
          bs = []
          for _ in range(B):
              s = k = 0
              for a in random.choices(armies, k=len(armies)):
                  v = by[p].get(a)
                  if v: s += v[0]; k += v[1]
              bs.append(s / k)
          bs.sort()
          tot = sum(v[0] for v in by[p].values()); n = sum(v[1] for v in by[p].values())
          print(p, round(100 * tot / n, 1), '±', round(50 * (bs[int(.975 * B)] - bs[int(.025 * B)]), 1))
  intervals(['sim/out/kp2-r11.jsonl', 'sim/out/kp2-r12.jsonl'])
  ```
  Scores are exact; the ± widths move by a few tenths from run to run (resampling).
- **Raw games:** `sim/out/*.jsonl` is not versioned on the PR branches. Rounds 1–10 are on the
  `claude/kp2-results-*` shard branches; rounds 11 and 12 on `claude/kp2-results-r11-r12` (owner
  approved, 2026-10-03). Results branches get no PRs. To use them:
  `git fetch origin claude/kp2-results-r11-r12 && git checkout origin/claude/kp2-results-r11-r12 -- sim/out/kp2-r11.jsonl sim/out/kp2-r12.jsonl`
  (then `git restore --staged sim/out/kp2-r11.jsonl sim/out/kp2-r12.jsonl` so they stay out of your commits).
- **Shell gotchas:** do not `pkill -f` a pattern that also matches your own shell command (it kills
  the shell); kill by PID. A `pgrep -f` wait loop can match itself.

## Other open items (see TASKS.md for the full list)

- Computer player: policy / move ordering and a bigger training corpus (`docs/research/ai-powers-2026-10-02.md`).
- Phone check of the newest UI (visual-design, 2026-10-03): no overflow or errors at 360 and
  390 px; the only bug found (the picker counts) is fixed.
- Browser checks that time out in cloud containers on main's build too (slow software WebGL):
  `verify-special-moves`, `verify-cursor-adoption`, `verify-playable-clay`, `qa`.
