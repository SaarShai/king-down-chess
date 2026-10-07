# Compute

The machine facts for runs: Kaggle, the M1, this Mac's power, the shell limit and the browser-check runner. The rules for runs (the owner's go, the smoke allowance) are in [AGENTS.md](../AGENTS.md). Runs are listed in [QUEUE.md](QUEUE.md).

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
