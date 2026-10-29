# Compute

The machine facts for runs: Kaggle, the M1, this Mac's power, the shell limit, the browser-check runner and the run recipes. The run and machine-use rules are in [AGENTS.md](../AGENTS.md). Runs are listed in [QUEUE.md](QUEUE.md).

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

- `npm run check:browser [name ...]` builds the app, serves the build on 127.0.0.1 at a free port and runs the named checks one at a time in that run. With no name, it runs all checks that are not "by name only". Each run prints and keeps its own output folder under `kingdown-check-runs` in the system's temporary folder.
- `npm run check:browser -- --help` lists the checks, their time limits and the settings each check gets.
- One heavy local command at a time on the machine: each run takes the per-user machine lease (`tools/test-lock.sh --machine`, `$HOME/.cache/kingdown/machine.lock`), which `npm test` and `tools/deploy.sh` share. A second run waits with one line. CI takes no machine lease. Inside one clone the runner also takes one of three slots for its build and for each check. A check that asserts time or shares the test database (`king-effects`, `painted-game`, `qa`, `plugin-oauth`, `plugin-ui-http`) is exclusive: it takes every slot of the clone, and a run that waits for it goes first. The slot count is the constant `SLOTS` in `tools/lib/lock.mjs`; it is 3 since the measurement of the [after-redesign spec](specs/after-redesign/spec.md), §3.4 (ticket 05, 2026-10-10).

## Recipes

The run recipes of the 2026-10-03 handoff, now in the [tasks archive](tasks-archive/). Follow the run and machine-use rules in [AGENTS.md](../AGENTS.md). For the tests and the browser checks, use `npm test` and `npm run check:browser`.

Run the whole unit suite only as `npm test`. It waits for the machine's test lock, `tools/test-lock.sh`. A bare `vitest run` or `npx vitest` with no file skips the lock. Its load made the deploy's timed judge tests fail on 2026-10-19. Run one file as `KINGDOWN_TEST_FILE=<file> npm test`. Do not put npm or npx between the lock and vitest: Node closes the lease descriptor in its children, so a kill of that layer frees the lease while vitest still runs.

- **Tournament:** `npx tsx src/sim/tournament.ts run --id <id> --none --pairs <n> --depth 3 --seed <n> --armies perPair`, with one `--rule key=value` for each entry of the `rules` of the last spec (for example `sim/out/kp2-r13.tournament.json`).
- **Card round:** add `--powers none,cards3,cards6 --mirrorOnly` (for example `sim/out/cards-b2.tournament.json`).
- A run continues from its last game id. Start a long run detached (see "Long runs and the shell limit").
- **Report:** `npx tsx src/sim/tournament.ts report --id <id> [--id <id2> …]`.
- zsh does not split `$VAR` into words, on this Mac and over `ssh M1`: write each flag in full, and keep a PID list in an array (`pids+=($!)`, then `kill "${pids[@]}"`). A process that a command over `ssh` starts in the background keeps the session open until it ends, unless all its output goes to a file (`> /dev/null 2>&1`). Stop a temporary load or test process with a `trap` on `EXIT`, so that a failed command stops it too; a long run that must outlive the shell starts detached instead (see "Long runs and the shell limit").
- **Kaggle:** `node tools/kaggle-tournament.mjs push --id <id> --shards <n> [--first <i> | --only <i,j>] -- <run flags>`, then `status` and `pull` with the same `--id`. Push the commit first. The notebooks play that commit, so the local shards must play the same commit.
- **M1:** the steps and the `PATH` line are in [LOCAL-AI-MACBOOK.md](LOCAL-AI-MACBOOK.md), section "Tournament shards".
- **Engine:** the tournaments play the linear evaluation; the sim never uses the residual net of the computer player in the browser. Thus the balance numbers are for the linear-evaluation engine at the depth of the run.
- **Raw games:** git does not keep `sim/out/*.jsonl` on the pull-request branches. The branch `claude/kp2-results` on origin holds them: rounds 2–18, `fi-r11..13`, the card rounds and the piece runs. The older branches that the handoff named (`claude/kp2-results-r11-r12`, `claude/kp2-results-r13-cards` and the shard branches) are not on origin (checked 2026-10-07). To get a file: `git fetch origin claude/kp2-results && git checkout origin/claude/kp2-results -- <files>`, then `git restore --staged <files>`.
- **Stop a process:** do not `pkill -f` a pattern that also matches your own shell command; stop it by its PID. A `pgrep -f` wait loop can find itself.

## Results storage and backup

The authoritative result collection on the main Mac is `/Volumes/card disk/King Down/results`. `~/.config/king-down/results.json` records its volume UUID. The shared result-root module stops if the configured card is absent. A machine without that configuration, such as M1 or Kaggle, uses its local `sim/out` spool. An explicit `KING_DOWN_RESULTS_DIR` selects a test or remote spool. Do not use that override to bypass a missing card on the main Mac.

The daily Codex maintenance job runs at 06:00 Pacific. It collects local and M1 spools and verifies their Google Drive backup. This Mac must be available, the card connected, and M1 reachable for a complete collection. To collect M1 results before analysis, run `python3 tools/results-store.py collect --m1` on the main Mac. For an immediate cloud backup, use `tools/backup-sim-out.sh`. The collector reads all registered local worktrees and all M1 project `sim/out` folders. It does not delete sources. Strictly appended logs retain their previous version. Other conflicts stay in `.variants/<sha256>/<path>` with source manifests; the balance reader excludes them from automatic samples pending provenance review. Do not concatenate different runs.

Snapshots in `King Down/results-backups` contain a file manifest and compressed source provenance. Large files use immutable objects in `King Down/results-objects`; small files share a verified compressed pack. Unchanged objects are reused, including independently copied legacy Drive data. The job checks decoded content locally and cloud checksums for every referenced object before updating `latest.json`. Old objects and snapshots remain. Missing M1 access or a missing card prevents a complete-success report.

To restore a snapshot, read its `manifest.json`. Each file names its object, decoded SHA-256 and size. Decode `gzip` objects, copy `plain` objects, or extract the named member from a `tar-gzip` pack. Verify every restored file against its SHA-256. Never delete `results-objects` while retaining manifests that reference it.

Git does not track `sim/out`. `.gitignore` ignores the whole folder. The old reports are at `1476f55c:sim/out/`. The [removal record](specs/retro-2026-10-20/issues/04-retro-records.md) gives the restore command. The tournament test fixtures are in `src/sim/fixtures/tournaments/`. Old worktrees that lack the new root module remain spools until their code is updated; the collector includes them.
