# Compute

The machine facts for runs: Kaggle, the M1, this Mac's power, the shell limit, the browser-check runner and the run recipes. The rules for runs (the owner's go, the smoke allowance) are in [AGENTS.md](../AGENTS.md). Runs are listed in [QUEUE.md](QUEUE.md).

## Kaggle

- Before a compute task (tournaments, many game sessions, training data), think of Kaggle CPU notebooks beside this Mac.
- `node tools/kaggle-tournament.mjs push|status|pull` plays tournament shards on Kaggle. Its games are identical to local games, so Kaggle shards and local shards pool in one report.
- One notebook has 4 CPUs. It plays at about 1/5 the speed of 4 workers on the M3 Max (measured), so about 1/15 of the whole Mac. It is extra capacity beside the Mac, or while the Mac is busy.
- The account runs 5 notebooks at most at one time. Kaggle refuses a push above that ("Maximum batch CPU session count of 5 reached", 2026-10-03), and the tool reports it. Send the refused shards again with `--only`.
- Token: `KAGGLE_API_TOKEN`, or the file `.secrets/kaggle_api_token` in the main checkout (git ignores it). Never print or commit it. [HOSTING.md](HOSTING.md) lists the secret files.

## M1

- The M1 is the network MacBook. Owner, 2026-10-03: "can you have games run on that mac?"
- It plays tournament shards when it is on this Mac's network, on mains power and not busy. Its games are identical to this Mac's games.
- The steps are in [LOCAL-AI-MACBOOK.md](LOCAL-AI-MACBOOK.md), section "Tournament shards".

## Long runs and the shell limit

- An agent's background shell stops at the shell's own timeout or at the session end. The runs that it started stop with it. On 2026-10-03 a card round stopped this way at 2,315 of 2,400 games. Runs resume by game id.
- Thus start each local run that takes more than a few minutes detached: `nohup … &` on the Mac, `setsid nohup … &` in a cloud container.
- Watch the run with a separate check. When the check ends before the run, start it again. Else the results wait unread: on 2026-10-03 a night's runs finished at 18:36, and nobody read them for four hours.

## Power

- On the 61 W USB-C charger the M3 Max runs 16 workers at about half speed (93 → 177 ms a ply, 2026-10-03), and the battery goes down.
- Before a long run, check the battery with `pmset -g batt` and the charger with `ioreg -rn AppleSmartBattery | grep Watts`. If the charger is the small one, ask the owner for the larger charger.

## Browser checks

- `npm run check:browser [name ...]` builds the app, serves the build on 127.0.0.1 at a free port and runs the named checks one at a time. With no name, it runs all checks that are not "by name only".
- `npm run check:browser -- --help` lists the checks, their time limits and the settings each check gets.
- One run at a time in all worktrees: a second run waits for the lock.

## Recipes

The run recipes of the 2026-10-03 handoff, now in the [tasks archive](tasks-archive/). Each run needs the owner's go ([AGENTS.md](../AGENTS.md)). For the tests and the browser checks, use `npm test` and `npm run check:browser`.

- **Tournament:** `npx tsx src/sim/tournament.ts run --id <id> --none --pairs <n> --depth 3 --seed <n> --armies perPair`, with one `--rule key=value` for each entry of the `rules` of the last spec (for example `sim/out/kp2-r13.tournament.json`).
- **Card round:** add `--powers none,cards3,cards6 --mirrorOnly` (for example `sim/out/cards-b2.tournament.json`).
- A run continues from its last game id. Start a long run detached (see "Long runs and the shell limit").
- **Report:** `npx tsx src/sim/tournament.ts report --id <id> [--id <id2> …]`.
- zsh does not split `$VAR` into words: write each flag in full.
- **Kaggle:** `node tools/kaggle-tournament.mjs push --id <id> --shards <n> [--first <i> | --only <i,j>] -- <run flags>`, then `status` and `pull` with the same `--id`. Push the commit first. The notebooks play that commit, so the local shards must play the same commit.
- **M1:** the steps and the `PATH` line are in [LOCAL-AI-MACBOOK.md](LOCAL-AI-MACBOOK.md), section "Tournament shards".
- **Engine:** the tournaments play the linear evaluation at depth 3. The computer player in the browser uses the residual net. Thus the balance numbers are for the linear-evaluation engine.
- **Raw games:** git does not keep `sim/out/*.jsonl` on the pull-request branches. Rounds 1–10 are on the `claude/kp2-results-*` shard branches; rounds 11 and 12 on `claude/kp2-results-r11-r12`; round 13, `fi-r11..13` and the card rounds on `claude/kp2-results-r13-cards`; round 18 on `claude/kp2-results`. To get a file: `git fetch origin <branch> && git checkout origin/<branch> -- <files>`, then `git restore --staged <files>`.
- **Stop a process:** do not `pkill -f` a pattern that also matches your own shell command; stop it by its PID. A `pgrep -f` wait loop can find itself.
