# Prompt: a formal balancing and rules framework for King Down

Give this prompt to the agent as it is. Write all your reports in ASD-STE100: approved words, short sentences, active voice, present tense.

## Your task

King Down is a chess variant. It has new pieces, king powers and cards. Its rules came from many design sessions and thousands of simulated games. The knowledge is in many places, and it is not in one form. Make it formal. Build one balancing and rules framework from three sources:

- all the game data so far, from every machine and every run,
- the approved rules, pieces, cards and king powers,
- the ability matrix.

Read `AGENTS.md` first and obey it. It includes the rules for commits, worktrees, tests and compute.

## Sources

**The approved design**
- `docs/RULES.md`. These are the rules. The numbered decisions record what the owner approved, with the owner's words.
- `docs/MATRIX.md`. This is the ability matrix for pieces (A.0, A.1), the capital (B), powers and cards (C.1, C.2), and conditions (D).
- The matrix spreadsheet: `/Users/za/Documents/king down chess/docs/status/king-down-status-2026-10-09.xlsx` (in the repo: `docs/status/king-down-status-2026-10-09.xlsx`). It has these tabs: Pieces, Cards, King powers, Rules, Piece matrix and Card matrix. Each version of an element is in its own columns, with its status (approved, pending, lab or rejected).
- `TASKS.md` and `docs/tasks-archive/`. These are the open and closed decisions.
- The code is the ground truth for what the game does:
  - `src/rules/` (rule flags, `POWERS_BALANCED`, the setup pool)
  - `src/ai/eval.ts` (piece values, such as `ARCHER_V` = 339 for far2)
  - `src/sim/` (the tournament and experiment runners)

**The game data**
- `docs/QUEUE.md`. It has one row for each run. A row gives the id, the machine, the commit, the flags, the game count and the result. Use it as the index of all the data.
- `docs/RUNS.md`, `docs/SIM-PLAN.md`, `docs/research/` (164 files: the reports and the reasons for each decision), and `docs/KINGS-POWERS-PLAN.md`.
- The raw output (`.jsonl` game records, `.log` files, `.tournament.json` files and reports):
  - `sim/out/` on this Mac. It is not in git. `sim/out/m1/` holds the copies from the M1, and `sim/out/mac-runs/` holds the old worktree runs.
  - The full backup on Google Drive: `~/Library/CloudStorage/GoogleDrive-saar.shai@gmail.com/My Drive/king-down-sim-out`. The `.jsonl` and `.log` files there are gzipped.
  - Some runs exist only on the M1 (`ssh M1`, folders `~/projects/king-down-*` and `~/projects/kd-*`). Each QUEUE.md row names its folder.
- Analysis tools: `tools/deal-cards.ts`, `tools/guard-probes.ts`, `tools/piece-activity.ts`, `src/sim/analyze.ts`, and `npx tsx src/sim/tournament.ts report --id <id>`.

Some runs are void, or their flags are wrong, for example the first dt-r0 runs, which have no released rules. QUEUE.md says so. Do not use void runs.

## Timing: start now, some runs are still pending

Start now. The schema, the criteria, the matrix check and the dataset builder do not need the runs that are still running. Almost all of the data is on disk now, or in the Drive backup.

These runs are still pending on 2026-10-09:
- `deal-c4k` (Kaggle) is the deal with 4 cards, the approved hand size. Only shards 9–11 of 12 run, about 3,500 games.
- `deal-d4k` (Kaggle) is the deal with 6 cards. Shards 7–11 are done, and shards 5–6 are running.
- `deal-nosalv2` (M1) is the deal without Salvation, seed 7579.
- `ab-guard-drop-any` (M1, queued after deal-nosalv2) is the Guard dropped on any empty square, against the Guard next to its king.

How to work with them:
- In the dataset, give each pending run the status "pending", with no value. Do not guess its result.
- Kaggle results arrive in `sim/out/` as `<id>.shard*of*.jsonl`. M1 results arrive in `sim/out/m1/` or on the M1. Do not pull, push or start Kaggle notebooks or M1 jobs yourself.
- Make the dataset builder rebuild everything from the files with one command. When a pending run arrives, run the builder again and update the status report.
- In the status report, mark each conclusion that depends on a pending run.

## What the framework must do

1. **A formal model of the design space.** Make a typed schema for each element type: piece, king power, card and rule.
   - Each property is a dimension, with its allowed values: a matrix row and its options.
   - Each element is a point in that space.
   - Every approved element, and every tested version, must fit the schema.
   - List each element or version that does not fit, and each code rule flag that is not in the matrix. One survey found about 24 such flags, for example archer shot patterns, Paladin capture outcomes, Ogre shove targets, Haste, Mercy and Darkness variants, draw rules, and Black's double first turn.
2. **One table of measurements.** Read every valid run into one dataset. Each row is one measured effect, with:
   - the element and its version,
   - the rule context (the flags and the commit),
   - the measure (worth in pawns, White's score, draw rate, length, activity),
   - the value, its error and the sample size,
   - the depth, the machine and the run id.
   Bring the units into one scale. A pawn is about 64–70 Elo here; take the scale from the reports.
3. **Balance criteria as formal checks.** Write the project's targets as testable rules. Find them in `RULES.md`, the research reports and QUEUE.md. Some examples:
   - a power's score is in a band around 50%,
   - a card's worth is between the floor of 0.7 and the ceiling of 3 pawns,
   - White's edge stays the same and draws do not go up (draws come first),
   - a price follows the odds-match method.
   For each criterion, give its source. Mark each criterion that the owner has not approved. "Criterion 4" is an open question.
4. **A status report.** For each approved element, say pass, fail or no data for each criterion, with the evidence row. List the elements where the data is old because the rules changed after the run. For example, the Archer changed to far2, the Guard now starts next to its king, the Paladin is back in the pool, Death Touch is T2, and each hand has 4 cards.
5. **A model of effects, where the data supports one.** Find which properties predict worth or draw changes. One example: more cards give fewer draws (draws are 29.7% with 0 cards and 12.6% with 4 cards). Use the model to predict the worth of a new design in the yellow "NEW" column of the matrix. Give an error bar, and say when the data is too thin.
6. **The next runs.** Rank the runs that would close the largest gaps. Write them in QUEUE.md format, with machine sizes as in the QUEUE.md rules. A Kaggle notebook must stay under 9 hours. Do not launch them.

## Constraints

- Do not pull, push or start any Kaggle notebook or M1 job. Treat a pending run as pending (see Timing).
- This Mac does no new compute. Tests, and a smoke run of at most 20 games, are allowed. Do not start simulation runs.
- Do not change the game rules, the piece values or the shipped eval. The framework reads and checks; it does not decide. Put each proposed change in a list for the owner, with its evidence.
- Do not print or commit secrets (`.secrets/`, API tokens).
- Keep the framework small and plain:
  - Use TypeScript in `src/balance/` or `tools/`, with the existing dependencies.
  - Generate the dataset as a file in `docs/balance/`, with a script to rebuild it.
  - Add one runnable check that fails when the schema and `RULES.md` or `MATRIX.md` disagree.
- Work on a branch and open a pull request. Do not merge it. The owner reviews it.

## Deliverables

1. `docs/balance/FRAMEWORK.md`. It describes the schema, the criteria, the method and the status report.
2. The schema and the dataset builder (code), with its check and its tests.
3. `docs/balance/measurements.(json|csv)`, built from the data.
4. A short list of open questions and proposed changes for the owner, each with its evidence.
