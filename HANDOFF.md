# Handoff — King Down Chess, 2026-10-03 (third session); release branch updated 2026-10-05

For the next agent session. Read `AGENTS.md`, then `TASKS.md` and `LESSONS.md` (project rules),
then this file. `TASKS.md` stays the record of work and owner decisions; this file says where the
work stopped and what to do next.

## Where things stand

**Pull requests:** all five are merged into main on 2026-10-03 (local time): #1–#4
(`claude/wonderful-ritchie-4cgq32`, `claude/painted-motion`, `claude/perf-installable`,
`claude/visual-design`) and #5 (`claude/merge-night`). Do not push to those branches. New work goes
on its own `claude/<topic>` branch. Owner-approved branches are joined on one integration branch for
one PR, as #5 was; the next one is `claude/integration-2026-10-05`. The owner merges; never merge
yourself. Merging into main does not deploy (`AGENTS.md`, Hosting).

**Release, 2026-10-05.** `claude/integration-2026-10-05` is the release branch. It joins cards-all,
one-beast, card-art, piece-icons (with six-kings), archer-over2 (with archer-far) and
release-visuals (king-effects with power-motion). The owner approved it on 2026-10-05: "1. Pull
request ... yes, do what is needed. 2. deploy 3. yes, what you recommend." That covers the PR, a
deploy, the over-a-piece Archer (`docs/RULES.md` Decision 19), the six kings' effects, captures,
title kings and resting pawns, the power animations with the Darkness king step, and the ivory
Spirit's gold glow ("keep gold"). What it holds, its conflicts and its checks (all pass): `TASKS.md`,
first section. Next, for the lead: review, open the PR, and after the owner merges, deploy `main`
as `AGENTS.md` (Hosting) says. The deploy builds `main`, so it waits for the merge.

**Kings' powers rules:** the official readings are `POWERS_BALANCED` in `src/rules/rules.ts`.
Since round 11 two readings changed, both owner-adopted: Mercy M2 (2026-10-03) and the Darkness king
step (2026-10-04, rounds 16–17); they reach main with `claude/integration-2026-10-05`. Since
2026-10-05 the Archer shoots only over a piece (`archerShots: 'over2'`, `ARCHER_V` 83); the balance
rounds above were played under the old Archer. Report:
`docs/research/kings-powers-balance-2026-10-02.md`; rules text `docs/RULES.md` §4. The balance
numbers below are from rounds 11–13, before those changes.

**Balance, rounds 11–13 pooled (1,896 armies, 7,488 games;
`sim/out/kp2-r11+kp2-r12+kp2-r13.report.md`).** Tested together, three powers are off centre:
**Mercy 56.3 ± 3.3 and Haste 55.5 ± 2.4 high, Darkness 43.4 ± 3.4 low.** Flight is fine (47.4).
Ice Wall (46.1), March (46.5) and Death Touch (53.7) are off 50 on their own intervals only.
**Spirit − Shadow +3.2 ± 3.1** (0.2 to 6.3): the light king is ahead, from Mercy high and Darkness
low. The owner has the options (end of the Round 13 section of `docs/research/kings-powers-balance-2026-10-02.md`) and has not chosen yet.

**Mark bug (fixed in `dcb9d1f`).** A position held one Freeze/Ice Wall mark, so the side it bound
could set its own mark, erase the first and (under the free-mark reading) make the forbidden move.
Now one mark per side (`Position.marks`). It also affected the playable game when both kings hold
Frost powers. Only the Freeze–Ice Wall matchup of rounds 11–13 could trigger it; replayed on the
fixed engine (`fi-r11..13`), either power moves about 0.2 points. The search key's high half was
also a function of its low half (32-bit keys, not 52); fixed in `src/ai/zobrist.ts`.

**Card mode (lab, owner 2026-10-03).** Action/effect cards only, no piece cards. Built: `Rules.hands`
(a hand of one-use cards per side, each one use of a spendable power: Freeze, Ice Wall, Strike,
Haste, Flight, Sacrifice, March, Leap; at most one card a turn), `cards<k>` tournament entrants
(both sides get the same k cards, dealt per pair; smaller hands are the first cards of larger
ones), `--mirrorOnly` (same-hand rounds), `--anchor` (every entrant against one reference). Not in
the playable game yet. Report: `docs/research/cards-2026-10-03.md`.
- Phase A (`cards-a1`, 5,400 games): every card is worth something (Haste +2.3 pawns … March
  +0.5), and no card raised draws.
- Phase B (`cards-b2`: 0, 3, 6 cards; `cards-b3`: 4, 5 cards; same armies): together, hands of 3–6 cards remove most of
  White's first-move edge (55.4% → 50.5% ± 1.9; the sizes do not clearly differ, though 4 cards
  read 54.1%), about halve the draws (16.5% → 7–10%) and shorten games (102 → 77.5 turns with 6
  cards). Recommended: 6 cards; the owner has not chosen yet.
- Owner (on the provisional results): a smaller first-move edge, shorter games and fewer draws
  count for cards. Cards **may** change how pieces move or take (the kings'-powers limit does not
  apply to cards); eleven such cards are proposed in the report, none built.

**Kaggle (owner, 2026-10-03):** consider it for compute; see `AGENTS.md` (Compute) and
`tools/kaggle-tournament.mjs`. Token: `.secrets/kaggle_api_token` in the main checkout
(git-ignored), or `KAGGLE_API_TOKEN`. One notebook (4 CPUs) runs at about 1/5 the speed of 4 Mac
workers, and its games are identical to local ones. The account runs at most **5 notebooks at
once**; a push beyond that is refused ("Maximum batch CPU session count of 5 reached"; the tool
reports it; resend with `--only`). Used for `cards-a1`
(4 of 8 shards) and `cards-b3` (3 of 16). A private smoke notebook `saarshai/kd-smoke-s0of1`
remains in the owner's account (harmless; delete only if the owner asks).

## What to do next (in this order)

1. **Kings' powers fixes need the owner's choice.** Options sent on 2026-10-03 (end of the Round 13 section of `docs/research/kings-powers-balance-2026-10-02.md`).
   When the owner picks, build each reading as a lab toggle, and screen it as a `~v<name>` entrant
   beside its base power in one round on `--armies perPair` (they then play the same armies); add
   a variant − base line to `report`. Owner rules: Spirit and Shadow level; no king-power reading
   may change how other pieces move; today's Darkness stays; shelters are fine.
2. **Card mode needs the owner's choices:** the hand size (Phase B), and which of the proposed
   movement-changing cards to build. Then the playable game: a hand display and a way to play a
   card (none exists yet).
3. **Raw games** of round 13, `fi-r11..13` and the card rounds are on `claude/kp2-results-r13-cards`
   (owner: "yes"); later rounds go to a results branch the same way.

## Owner decisions and standing rules (also in TASKS.md)

- Kings' powers is a separate game mode; "No power" stays the default in New game.
- Light (Spirit) and dark (Shadow) kings may be somewhat stronger than the other four but must be
  balanced with each other.
- No king-power reading may change how other pieces move; cards may.
- Compute: Kaggle where it helps (2026-10-03); tournaments in one session, no cloud worker
  sessions; ignore Codex/GPT. Runs need the owner's go.
- Explain results in plain, non-technical language; answer the question before doing more work.
- Commit footer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and a `Claude-Session:`
  line for the current session. No model names in commits, PRs or code.
- **Secrets:** never print or commit any API key (TypeSafe, Kaggle). The Kaggle token lives only in
  `.secrets/` (git-ignored) or the environment.

## How to run things

- **Unit tests and types:** `npx tsc --noEmit`, `npx vitest run` (about 90 s; 570 tests on `claude/integration-2026-10-05`).
- **Browser checks:** build and serve, then run a check (`PLAYABLE_BROWSER=chromium` in cloud
  containers, which lack the Chrome channel):
  ```sh
  npx vite build && npx vite preview --port 5189 --strictPort &
  PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-painted-game.mjs
  ```
  The checks rewrite screenshots under `docs/painted-game/`; revert them unless wanted.
- **Tournaments:** `npx tsx src/sim/tournament.ts run --id <id> --none --pairs <n> --depth 3 --seed <n>
  --armies perPair` plus one `--rule key=value` per entry of the last spec's `rules`
  (`sim/out/kp2-r13.tournament.json`). Card rounds: `--powers none,cards3,cards6 --mirrorOnly`
  (`sim/out/cards-b2.tournament.json`). Runs resume by game id. **Start every long run detached**
  (`nohup … &` on the Mac, `setsid nohup … &` in a cloud container): an agent's background shell
  is stopped after at most 2 hours, and its runs with it. Report: `npx tsx src/sim/tournament.ts
  report --id <id> [--id <id2> …]`. zsh does not split `$VAR` into words: spell out flags.
- **On Kaggle:** `node tools/kaggle-tournament.mjs push --id <id> --shards <n> [--first <i> | --only
  <i,j>] -- <run flags>`, then `status` and `pull` with the same `--id`. The commit must be pushed
  first; the notebooks play that commit, so local shards must run the same commit too.
- **Tournaments play the linear evaluation.** The browser's computer player uses the residual net;
  the sim never switches, so balance numbers describe the linear-evaluation engine at depth 3.
- **Raw games:** `sim/out/*.jsonl` is not versioned on the PR branches. Rounds 1–10 are on the
  `claude/kp2-results-*` shard branches; rounds 11 and 12 on `claude/kp2-results-r11-r12`. To use them:
  `git fetch origin claude/kp2-results-r11-r12 && git checkout origin/claude/kp2-results-r11-r12 -- sim/out/kp2-r11.jsonl sim/out/kp2-r12.jsonl`
  (then `git restore --staged sim/out/kp2-r11.jsonl sim/out/kp2-r12.jsonl`). Round 13, `fi-r11..13`
  and the card rounds: `claude/kp2-results-r13-cards`.
- **Shell gotchas:** do not `pkill -f` a pattern that also matches your own shell command; kill by
  PID. A `pgrep -f` wait loop can match itself.

## Other open items (see TASKS.md for the full list)

- Computer player: policy / move ordering and a bigger training corpus (`docs/research/ai-powers-2026-10-02.md`).
- Browser checks that time out in cloud containers on main's build too (slow software WebGL):
  `verify-special-moves`, `verify-cursor-adoption`, `verify-playable-clay`, `qa`.
